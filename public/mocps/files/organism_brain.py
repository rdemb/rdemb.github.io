"""The living brain: the trained gravity world-model given a body.

Wraps :class:`organism.world.LiveGravityWorld` with the trained TinyJEPA gravity
model and a linear position probe. Each step it:

  - renders the world to the model's 32x32 eye and encodes it,
  - reads the perceived position and the model's predicted future position
    (the cyan arc) through the probe,
  - holds a belief about the ball under occlusion by rolling it forward with the
    gravity the model demonstrably learned (object permanence),
  - measures surprise: a continuous latent mismatch (V-JEPA style) plus, at a
    trial reveal, how far reality diverged from the gravitational expectation.

Every number it emits comes from the trained model or the validated learned
physics; nothing is scripted. The state() dict is what the frontend renders 1:1.
"""

from __future__ import annotations

import json
import time
from collections import deque
from pathlib import Path

import torch
from torch import Tensor, nn
import torch.nn.functional as F

from jepa_petri.data import make_dataset
from jepa_petri.models import TinyJEPA
from organism.life import Life
from organism.world import IMPOSSIBLE_KINDS, SUBTLE_KINDS, LiveGravityWorld, WorldConfig

LATENT_SURPRISE_THRESH = 0.27  # latent mismatch (1 - cos) at reveal counting as a flinch; 96% possible/impossible split
BASELINE_PX_THRESH = 2.5  # kinematic baseline: pixel distance at reveal counting as a flinch (~ball radius + 1)


class LivingBrain:
    def __init__(self, run_dir: str = "runs/gravity_v3", device: str = "cpu", seed: int | None = None) -> None:
        self.device = torch.device(device)
        checkpoint = torch.load(Path(run_dir) / "checkpoints" / "model.pt", map_location=self.device)
        self.cfg = checkpoint["config"]
        self.H = int(self.cfg["horizon"])
        self.CL = int(self.cfg["context_len"])
        self.model = TinyJEPA(latent_dim=int(self.cfg["latent_dim"]), context_len=self.CL).to(self.device)
        self.model.load_state_dict(checkpoint["model_state"])
        self.model.eval()
        self.scale = torch.tensor([31.0, 31.0], device=self.device)
        self.probe = self._train_probe()

        # Occlusion lasts H-1 steps so the prediction made at occlusion onset
        # (which targets H steps ahead of the last visible frame) lands exactly on
        # the reveal frame.
        self.world = LiveGravityWorld(config=WorldConfig(occlusion_steps=max(1, self.H - 1)), seed=seed)
        self.wc = self.world.cfg
        self.bx, self.by = self.world.x, self.world.y
        self.bvx, self.bvy = 0.0, 0.0
        self.conf = 1.0
        self.state_name = "sees"
        self.frames: deque[Tensor] = deque(maxlen=self.CL)
        self.pred_buffer: dict[int, Tensor] = {}
        self.arc: list[list[float]] = []
        self.surprise = 0.0
        self.expect_latent: Tensor | None = None

        # Lifetime ledger: counters survive restarts (runs/<run>/life.json).
        self.life = Life(run_dir)
        # Per-trial log: an append-only public dataset (one JSON line per trial)
        # for threshold calibration (ROC/AUC) and per-kind detection curves.
        self._trials_log = Path(run_dir) / "trials.jsonl"

        # Kinematic baseline (no network): tracks the truth ball by "pixels",
        # extrapolates with world physics through the occlusion, flinches on
        # pixel distance at reveal. Reported next to the model for honesty.
        self._base_xy: tuple[float, float] | None = None
        self._base_v: tuple[float, float] = (0.0, 0.0)
        self._base_seen_prev = False
        self._base_pred: tuple[float, float] | None = None

    # ---- probe ----------------------------------------------------------
    def _train_probe(self, steps: int = 500, batch_size: int = 64, lr: float = 5e-2) -> nn.Linear:
        probe = nn.Linear(int(self.cfg["latent_dim"]), 2).to(self.device)
        optimizer = torch.optim.Adam(probe.parameters(), lr=lr)
        dataset = make_dataset("gravity_ball", seq_len=int(self.cfg["seq_len"]), seed=int(self.cfg["seed"]))
        probe.train()
        for step in range(steps):
            batch = dataset.sample_batch(batch_size=batch_size, batch_index=step, device=self.device)
            # Train on every frame in the sequence, not just the horizon target, so
            # the probe covers the full position range the live ball visits
            # (including low near the ground), not only mid-arc.
            frames = batch["frames"]
            flat_frames = frames.reshape(-1, 1, frames.shape[-2], frames.shape[-1])
            flat_positions = batch["positions"].reshape(-1, 2)
            with torch.no_grad():
                target_latent = self.model.encode_target(flat_frames)
            loss = ((probe(target_latent) - flat_positions / self.scale) ** 2).mean()
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            optimizer.step()
        probe.eval()
        return probe

    @torch.no_grad()
    def _encode(self, frame: Tensor) -> Tensor:
        return self.model.encode_target(frame.unsqueeze(0).to(self.device))[0]

    @torch.no_grad()
    def _probe_pos(self, latent: Tensor) -> tuple[float, float]:
        pos = self.probe(latent.unsqueeze(0))[0] * self.scale
        return float(pos[0]), float(pos[1])

    # ---- belief shadow physics (the learned expectation) ----------------
    def _shadow_step(self, x: float, y: float, vx: float, vy: float) -> tuple[float, float, float, float]:
        c = self.wc
        vy += c.gravity
        x += vx
        y += vy
        if y > c.ground_y:
            y = c.ground_y - (y - c.ground_y)
            vy = -vy * c.restitution
            if abs(vy) < 0.6:
                vy = 0.0
        if y < c.ceil_y:
            y = c.ceil_y + (c.ceil_y - y)
            vy = -vy * c.restitution
        x = min(max(x, c.wall_lo), c.wall_hi)
        y = min(max(y, c.ceil_y), c.ground_y)
        return x, y, vx, vy

    def _compute_arc(self, n: int = 24) -> list[list[float]]:
        x, y, vx, vy = self.bx, self.by, self.bvx, self.bvy
        points: list[list[float]] = []
        for _ in range(n):
            points.append([round(x, 2), round(y, 2)])
            x, y, vx, vy = self._shadow_step(x, y, vx, vy)
        return points

    # ---- step -----------------------------------------------------------
    def step(self, dt: float) -> dict:
        reveal = self.world.tick(dt)
        self.life.steps += 1
        frame = self.world.render()
        visible = not self.world.hidden
        pred_pos: tuple[float, float] | None = None
        latent: Tensor | None = None
        self.surprise *= 0.9  # the flinch decays between events

        # kinematic baseline percept (idealized pixel tracker of the truth ball)
        if visible:
            if self._base_seen_prev and self._base_xy is not None:
                self._base_v = (self.world.x - self._base_xy[0], self.world.y - self._base_xy[1])
            self._base_xy = (self.world.x, self.world.y)
            self._base_seen_prev = True
        else:
            if self._base_seen_prev and self._base_xy is not None:
                bx, by = self._base_xy
                bvx, bvy = self._base_v
                # occlusion_steps hidden ticks + the reveal tick itself = H steps,
                # matching the horizon the network's expectation targets
                for _ in range(max(1, self.world.cfg.occlusion_steps) + 1):
                    bx, by, bvx, bvy = self._shadow_step(bx, by, bvx, bvy)
                self._base_pred = (bx, by)
            self._base_seen_prev = False

        if visible:
            latent = self._encode(frame)
            px, py = self._probe_pos(latent)
            px = min(max(px, 0.0), float(self.wc.size - 1))
            py = min(max(py, 0.0), float(self.wc.size - 1))
            self.bvx = 0.6 * self.bvx + 0.4 * (px - self.bx)
            self.bvy = 0.6 * self.bvy + 0.4 * (py - self.by)
            self.bx, self.by = px, py
            self.conf = min(1.0, self.conf + dt * 1.5)
            self.state_name = "sees"
            self.frames.append(frame)
            if len(self.frames) == self.CL:
                context = torch.stack(list(self.frames)).unsqueeze(0).to(self.device)
                with torch.no_grad():
                    predicted_latent = self.model.predict(self.model.encode_context(context))[0]
                pred_pos = self._probe_pos(predicted_latent)
        else:
            # At occlusion onset, snapshot what the model predicts the reveal frame
            # will look like; then hold the belief forward under learned gravity.
            if not self.world.prev_hidden and len(self.frames) == self.CL:
                context = torch.stack(list(self.frames)).unsqueeze(0).to(self.device)
                with torch.no_grad():
                    self.expect_latent = self.model.predict(self.model.encode_context(context))[0]
            self.frames.clear()
            self.bx, self.by, self.bvx, self.bvy = self._shadow_step(self.bx, self.by, self.bvx, self.bvy)
            self.conf = max(0.0, self.conf - dt * 0.4)
            self.state_name = "lost" if self.conf < 0.15 else "holds"

        trial = self.world.trial
        if reveal and trial is not None and not trial["scored"] and (not trial["impossible"] or trial["applied"]):
            if latent is None:
                latent = self._encode(frame)
            if self.expect_latent is not None:
                ls = float(1.0 - F.cosine_similarity(self.expect_latent.unsqueeze(0), latent.unsqueeze(0)))
            else:
                ls = 0.0
            self.surprise = ls
            surprised = ls > LATENT_SURPRISE_THRESH
            impossible = bool(trial["impossible"])
            life = self.life
            life.phys_tot += 1
            life.phys_ok += int(impossible == surprised)
            life.trials += 1
            if impossible:
                life.imp_sum += ls
                life.imp_n += 1
            else:
                life.poss_sum += ls
                life.poss_n += 1
            if surprised:
                life.surprises += 1
                self.conf = 0.1
                self.state_name = "surprised"
            else:
                life.ok += 1
            life.bump_kind(trial["kind"], impossible == surprised)
            base_dist = None
            if self._base_pred is not None:
                base_dist = ((self._base_pred[0] - self.world.x) ** 2 + (self._base_pred[1] - self.world.y) ** 2) ** 0.5
                life.base_tot += 1
                life.base_ok += int(impossible == (base_dist > BASELINE_PX_THRESH))
                self._base_pred = None
            try:
                with self._trials_log.open("a", encoding="utf-8") as fh:
                    fh.write(json.dumps({
                        "ts": round(time.time(), 1),
                        "step": self.life.steps,
                        "kind": trial["kind"],
                        "impossible": impossible,
                        "subtle": bool(trial.get("subtle", False)),
                        "latent_surprise": round(ls, 4),
                        "surprised": surprised,
                        "baseline_dist_px": None if base_dist is None else round(base_dist, 2),
                    }) + "\n")
            except OSError:
                pass
            trial["scored"] = True
            self.world.end_trial()
            self.expect_latent = None
            self.bx, self.by = self.world.x, self.world.y
            self.bvx = self.bvy = 0.0

        self.arc = self._compute_arc()
        return self.build_state(pred_pos)

    # ---- state ----------------------------------------------------------
    def build_state(self, pred_pos: tuple[float, float] | None) -> dict:
        world_state = self.world.state()
        life = self.life
        phys_pct = round(100 * life.phys_ok / life.phys_tot) if life.phys_tot else None
        base_pct = round(100 * life.base_ok / life.base_tot) if life.base_tot else None
        poss = life.poss_sum / life.poss_n if life.poss_n else 0.0
        imp = life.imp_sum / life.imp_n if life.imp_n else 0.0
        return {
            "ball": world_state["ball"],
            "occluder": world_state["occluder"],
            "ground_y": world_state["ground_y"],
            "size": world_state["size"],
            "trial": world_state["trial"],
            "step": life.steps,
            "life": life.block(),
            "belief": {"x": round(self.bx, 2), "y": round(self.by, 2), "vx": round(self.bvx, 2), "vy": round(self.bvy, 2)},
            "predicted": None if pred_pos is None else {"x": round(pred_pos[0], 2), "y": round(pred_pos[1], 2)},
            "arc": self.arc,
            "confidence": round(self.conf, 3),
            "surprise": round(self.surprise, 3),
            "state": self.state_name,
            "metrics": {
                "physics_grasp_pct": phys_pct,
                "ok": life.ok,
                "surprises": life.surprises,
                "trials": life.trials,
                "possible_surprise": round(poss, 3),
                "impossible_surprise": round(imp, 3),
                "voe_margin": round(imp - poss, 3),
                # honesty rail: an idealized pixel tracker with true physics —
                # the geometric ceiling the latent VoE is compared against
                "baseline_grasp_pct": base_pct,
                "grasp_hard_pct": self._kind_group_pct(IMPOSSIBLE_KINDS),
                "grasp_subtle_pct": self._kind_group_pct(SUBTLE_KINDS),
                "kinds": {k: {"n": v[1], "ok_pct": round(100 * v[0] / v[1])} for k, v in sorted(life.kind_counts.items()) if v[1]},
            },
        }

    def _kind_group_pct(self, kinds: tuple[str, ...]) -> int | None:
        ok = tot = 0
        for k in kinds:
            c = self.life.kind_counts.get(k)
            if c:
                ok += c[0]
                tot += c[1]
        return round(100 * ok / tot) if tot else None
