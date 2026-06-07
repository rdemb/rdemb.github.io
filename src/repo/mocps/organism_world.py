"""Live authoritative gravity world for the living organism ("Pod Kloszem").

Server-side single source of truth. A ball moves under continuous gravity and,
during a trial, arcs behind an occluder (the yard's car) where it is hidden for a
controlled number of steps. A director stages *possible* trials (the ball keeps
obeying gravity while hidden) and *impossible* ones (it levitates, freezes, or
teleports while hidden). The controlled occlusion gives the violation time to
develop, so a gravity-expecting observer's belief diverges clearly from reality
on impossible trials and matches it on possible ones.

The world renders the same 32x32 grayscale projection the model was trained on
(jepa_petri.data.gravity_ball), so the brain sees in-distribution frames. There
is no model here; the brain consumes render() plus the trial labels.

Units are pixels in [0, size-1], y growing downward.
"""

from __future__ import annotations

import random
from dataclasses import dataclass

import torch
from torch import Tensor

IMPOSSIBLE_KINDS = ("levitate", "freeze", "teleport")
APPROACH_TIMEOUT = 80


@dataclass(frozen=True)
class WorldConfig:
    size: int = 32
    radius: int = 2
    gravity: float = 0.55
    restitution: float = 0.72
    ground_y: float = 29.0
    ceil_y: float = 2.0
    wall_lo: float = 2.0
    wall_hi: float = 29.0
    occ_x0: float = 9.0
    occ_x1: float = 15.0
    occ_top: float = 14.0
    occlusion_steps: int = 4


class LiveGravityWorld:
    """Continuous gravity ball + controlled-occlusion possible/impossible director."""

    def __init__(self, config: WorldConfig | None = None, seed: int | None = None) -> None:
        self.cfg = config or WorldConfig()
        self.rng = random.Random(seed)
        self.x = 8.0
        self.y = 27.0
        self.vx = 0.0
        self.vy = 0.0
        self.no_grav = False
        self.frozen = False
        self.hidden = False
        self.prev_hidden = False
        self.step_count = 0
        self.trial: dict | None = None
        self.cooldown = 1.0
        self._kick()

    # ---- dynamics -------------------------------------------------------
    def _kick(self) -> None:
        # Stay inside the training distribution (gravity_ball: horizontal in
        # [-1.7, 1.7], vertical kick in [-3.6, -2.4]); a faster lateral launch is
        # out-of-distribution and the model's predictions become unreliable.
        self.x = self.rng.uniform(2.0, 4.0)
        self.y = self.rng.uniform(25.0, 28.0)
        self.vx = self.rng.uniform(0.9, 1.5)
        self.vy = self.rng.uniform(-3.5, -2.6)
        self.no_grav = False
        self.frozen = False

    def _gravity_physics(self) -> None:
        c = self.cfg
        if not self.no_grav and not self.frozen:
            self.vy += c.gravity
        if not self.frozen:
            self.x += self.vx
            self.y += self.vy
        if self.y > c.ground_y:
            self.y = c.ground_y - (self.y - c.ground_y)
            self.vy = -self.vy * c.restitution
            if abs(self.vy) < 0.6:
                self.vy = 0.0
        if self.y < c.ceil_y:
            self.y = c.ceil_y + (c.ceil_y - self.y)
            self.vy = -self.vy * c.restitution
        if self.x < c.wall_lo:
            self.x = c.wall_lo + (c.wall_lo - self.x)
            self.vx = -self.vx
        if self.x > c.wall_hi:
            self.x = c.wall_hi - (self.x - c.wall_hi)
            self.vx = -self.vx
        self.x = min(max(self.x, c.wall_lo), c.wall_hi)
        self.y = min(max(self.y, c.ceil_y), c.ground_y)

    # ---- director -------------------------------------------------------
    def _start_trial(self, force_impossible: bool | None = None) -> None:
        impossible = self.rng.random() < 0.5 if force_impossible is None else force_impossible
        kind = self.rng.choice(IMPOSSIBLE_KINDS) if impossible else "normal"
        self.trial = {
            "impossible": impossible,
            "kind": kind,
            "phase": "approach",
            "occ_left": 0,
            "applied": False,
            "scored": False,
            "age": 0.0,
        }
        self._kick()

    def _begin_occlusion(self) -> None:
        """Ball just entered the occluder column: hide it and set the miracle."""
        assert self.trial is not None
        self.trial["phase"] = "occluded"
        self.trial["occ_left"] = self.cfg.occlusion_steps
        self.trial["applied"] = True
        if self.trial["impossible"]:
            kind = self.trial["kind"]
            if kind == "levitate":
                self.no_grav = True
                self.vy = -3.0  # a clear upward defiance of gravity, not a subtle drift
            elif kind == "freeze":
                self.frozen = True
            elif kind == "teleport":
                # jump to the far side at the height it entered; gravity resumes
                self.x = self.cfg.occ_x0 - 4.0 if self.x > (self.cfg.occ_x0 + self.cfg.occ_x1) / 2 else self.cfg.occ_x1 + 4.0

    def end_trial(self) -> None:
        self.trial = None
        self.no_grav = False
        self.frozen = False
        self.cooldown = self.rng.uniform(2.5, 5.0)

    def request_trial(self, impossible: bool) -> None:
        if self.trial is None:
            self._start_trial(force_impossible=impossible)

    # ---- step -----------------------------------------------------------
    def tick(self, dt: float) -> bool:
        self.prev_hidden = self.hidden
        if self.trial is None:
            self.cooldown -= dt
            if self.cooldown <= 0.0:
                self._start_trial()

        trial = self.trial
        if trial is not None and trial["phase"] == "occluded":
            self._gravity_physics()
            trial["occ_left"] -= 1
            self.hidden = True
            if trial["occ_left"] <= 0:
                trial["phase"] = "done"
        else:
            self._gravity_physics()
            self.hidden = False
            if trial is not None and trial["phase"] == "approach":
                trial["age"] += dt
                if self.cfg.occ_x0 < self.x < self.cfg.occ_x1:
                    self._begin_occlusion()
                    self.hidden = True
                elif trial["age"] > APPROACH_TIMEOUT * dt:
                    self._kick()
                    trial["age"] = 0.0

        self.step_count += 1
        return bool(self.prev_hidden and not self.hidden)

    # ---- views ----------------------------------------------------------
    def render(self) -> Tensor:
        c = self.cfg
        frame = torch.zeros(1, c.size, c.size, dtype=torch.float32)
        if not self.hidden:
            yy = torch.arange(c.size, dtype=torch.float32).view(c.size, 1)
            xx = torch.arange(c.size, dtype=torch.float32).view(1, c.size)
            mask = (xx - self.x) ** 2 + (yy - self.y) ** 2 <= float(c.radius ** 2)
            frame[0] = mask.to(torch.float32)
        return frame

    def state(self) -> dict:
        c = self.cfg
        trial = None
        if self.trial is not None:
            trial = {
                "impossible": self.trial["impossible"],
                "kind": self.trial["kind"],
                "phase": self.trial["phase"],
            }
        return {
            "ball": {"x": round(self.x, 2), "y": round(self.y, 2), "vx": round(self.vx, 2), "vy": round(self.vy, 2), "hidden": self.hidden},
            "trial": trial,
            "occluder": {"x0": c.occ_x0, "x1": c.occ_x1, "top": c.occ_top},
            "ground_y": c.ground_y,
            "size": c.size,
            "step": self.step_count,
        }
