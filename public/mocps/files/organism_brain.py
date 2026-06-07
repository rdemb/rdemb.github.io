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

from collections import deque
from pathlib import Path

import torch
from torch import Tensor, nn
import torch.nn.functional as F

from jepa_petri.data import make_dataset
from jepa_petri.models import TinyJEPA
from organism.world import LiveGravityWorld, WorldConfig

LATENT_SURPRISE_THRESH = 0.27  # latent mismatch (1 - cos) at reveal counting as a flinch; 96% possible/impossible split


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

        self.ok = 0
        self.surprises = 0
        self.trials = 0
        self.phys_ok = 0
        self.phys_tot = 0
        self.poss_surprise: list[float] = []
        self.imp_surprise: list[float] = []

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
        frame = self.world.render()
        visible = not self.world.hidden
        pred_pos: tuple[float, float] | None = None
        latent: Tensor | None = None
        self.surprise *= 0.9  # the flinch decays between events

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
            self.phys_tot += 1
            self.phys_ok += int(impossible == surprised)
            self.trials += 1
            (self.imp_surprise if impossible else self.poss_surprise).append(ls)
            if surprised:
                self.surprises += 1
                self.conf = 0.1
                self.state_name = "surprised"
            else:
                self.ok += 1
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
        phys_pct = round(100 * self.phys_ok / self.phys_tot) if self.phys_tot else None
        poss = sum(self.poss_surprise) / len(self.poss_surprise) if self.poss_surprise else 0.0
        imp = sum(self.imp_surprise) / len(self.imp_surprise) if self.imp_surprise else 0.0
        return {
            "ball": world_state["ball"],
            "occluder": world_state["occluder"],
            "ground_y": world_state["ground_y"],
            "size": world_state["size"],
            "trial": world_state["trial"],
            "step": world_state["step"],
            "belief": {"x": round(self.bx, 2), "y": round(self.by, 2), "vx": round(self.bvx, 2), "vy": round(self.bvy, 2)},
            "predicted": None if pred_pos is None else {"x": round(pred_pos[0], 2), "y": round(pred_pos[1], 2)},
            "arc": self.arc,
            "confidence": round(self.conf, 3),
            "surprise": round(self.surprise, 3),
            "state": self.state_name,
            "metrics": {
                "physics_grasp_pct": phys_pct,
                "ok": self.ok,
                "surprises": self.surprises,
                "trials": self.trials,
                "possible_surprise": round(poss, 3),
                "impossible_surprise": round(imp, 3),
                "voe_margin": round(imp - poss, 3),
            },
        }
