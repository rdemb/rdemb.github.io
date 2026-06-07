"""Procedural 32x32 grayscale gravity-ball sequences.

A ball is launched with an initial velocity and falls under constant gravity,
bouncing off the floor (with restitution) and the side/ceiling walls. Image y
increases downward, so gravity is a constant positive acceleration on the
vertical velocity. This is the side-view projection of a 3D yard scene with the
depth axis frozen: the brain must learn the downward acceleration to predict the
arc, which a memoryless constant-velocity baseline structurally cannot.

The interface mirrors :mod:`jepa_petri.data.bouncing_ball`: positions are stored
as ``[x, y]`` pixel coordinates and the ball center always stays within the valid
bounds for the configured frame.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import torch
from torch import Tensor
from torch.utils.data import Dataset


@dataclass(frozen=True)
class GravityBallConfig:
    height: int = 32
    width: int = 32
    seq_len: int = 8
    radius: int = 2
    gravity: float = 0.55
    restitution: float = 0.72
    seed: int = 0


def _sample_launch(rng: np.random.Generator, config: GravityBallConfig) -> tuple[np.ndarray, np.ndarray]:
    """Sample a start position near the floor and an upward/lateral kick."""
    low_x = float(config.radius)
    high_x = float(config.width - 1 - config.radius)
    floor_y = float(config.height - 1 - config.radius)
    # Start somewhere along the lower third so the arc has room to rise.
    start_x = rng.uniform(low_x, high_x)
    start_y = rng.uniform(floor_y - 4.0, floor_y)
    position = np.array([start_x, start_y], dtype=np.float32)

    horizontal = rng.uniform(-1.7, 1.7)
    if abs(horizontal) < 0.5:
        horizontal = 0.5 if horizontal >= 0 else -0.5
    # Image y grows downward, so an upward kick is negative.
    vertical = rng.uniform(-3.6, -2.4)
    velocity = np.array([horizontal, vertical], dtype=np.float32)
    return position, velocity


def _step(position: np.ndarray, velocity: np.ndarray, config: GravityBallConfig) -> None:
    """Advance one step of gravity + bounded bounces, in place."""
    low_x = float(config.radius)
    high_x = float(config.width - 1 - config.radius)
    low_y = float(config.radius)
    high_y = float(config.height - 1 - config.radius)

    velocity[1] += config.gravity
    position += velocity

    # Floor: lose energy to restitution; reflect back into the frame.
    if position[1] > high_y:
        position[1] = high_y - (position[1] - high_y)
        velocity[1] = -velocity[1] * config.restitution
        # Damp tiny residual bounces so the ball can settle instead of jittering.
        if abs(float(velocity[1])) < 0.6:
            velocity[1] = 0.0
    # Ceiling: simple reflection.
    if position[1] < low_y:
        position[1] = low_y + (low_y - position[1])
        velocity[1] = -velocity[1] * config.restitution
    # Side walls: elastic reflection so lateral motion is preserved.
    if position[0] < low_x:
        position[0] = low_x + (low_x - position[0])
        velocity[0] *= -1.0
    if position[0] > high_x:
        position[0] = high_x - (position[0] - high_x)
        velocity[0] *= -1.0

    position[0] = float(np.clip(position[0], low_x, high_x))
    position[1] = float(np.clip(position[1], low_y, high_y))


def _render_frame(position: np.ndarray, config: GravityBallConfig) -> Tensor:
    y = torch.arange(config.height, dtype=torch.float32).view(config.height, 1)
    x = torch.arange(config.width, dtype=torch.float32).view(1, config.width)
    cx, cy = float(position[0]), float(position[1])
    mask = (x - cx).square() + (y - cy).square() <= float(config.radius**2)
    return mask.to(torch.float32).unsqueeze(0)


def generate_gravity_ball_sequence(
    *,
    height: int = 32,
    width: int = 32,
    seq_len: int = 8,
    radius: int = 2,
    gravity: float = 0.55,
    restitution: float = 0.72,
    seed: int = 0,
) -> dict[str, Tensor]:
    """Generate one deterministic gravity-ball sample.

    Positions are ``[x, y]`` pixel coordinates of the ball center, guaranteed to
    stay within the valid bounds for the configured frame.
    """
    if height <= 2 * radius or width <= 2 * radius:
        raise ValueError("height and width must leave room for the ball radius")
    if seq_len < 2:
        raise ValueError("seq_len must be at least 2")
    if gravity <= 0.0:
        raise ValueError("gravity must be positive")
    if not 0.0 <= restitution <= 1.0:
        raise ValueError("restitution must be between 0 and 1")

    config = GravityBallConfig(
        height=height,
        width=width,
        seq_len=seq_len,
        radius=radius,
        gravity=gravity,
        restitution=restitution,
        seed=seed,
    )
    rng = np.random.default_rng(seed)
    position, velocity = _sample_launch(rng, config)
    # Start the recorded window at a random phase of the arc (rising, apex,
    # falling, post-bounce), not only the launch. This matches what a live
    # observer sees when the ball enters occlusion mid-flight, so a model trained
    # here generalizes to any-phase context instead of only the start of a throw.
    for _ in range(int(rng.integers(0, 9))):
        _step(position, velocity, config)

    frames = torch.empty(seq_len, 1, height, width, dtype=torch.float32)
    positions = torch.empty(seq_len, 2, dtype=torch.float32)
    for step in range(seq_len):
        positions[step] = torch.from_numpy(position.copy())
        frames[step] = _render_frame(position, config)
        _step(position, velocity, config)

    return {"frames": frames, "positions": positions}


class GravityBallDataset(Dataset[dict[str, Tensor]]):
    """Index-deterministic dataset backed by procedural gravity-ball generation."""

    def __init__(
        self,
        *,
        length: int = 10_000,
        height: int = 32,
        width: int = 32,
        seq_len: int = 8,
        radius: int = 2,
        gravity: float = 0.55,
        restitution: float = 0.72,
        seed: int = 0,
    ) -> None:
        self.length = length
        self.height = height
        self.width = width
        self.seq_len = seq_len
        self.radius = radius
        self.gravity = gravity
        self.restitution = restitution
        self.seed = seed

    def __len__(self) -> int:
        return self.length

    def __getitem__(self, index: int) -> dict[str, Tensor]:
        if index < 0:
            index = self.length + index
        if index < 0 or index >= self.length:
            raise IndexError(index)
        return generate_gravity_ball_sequence(
            height=self.height,
            width=self.width,
            seq_len=self.seq_len,
            radius=self.radius,
            gravity=self.gravity,
            restitution=self.restitution,
            seed=self.seed + int(index),
        )

    def sample_batch(
        self,
        *,
        batch_size: int,
        batch_index: int = 0,
        device: torch.device | str | None = None,
    ) -> dict[str, Tensor]:
        start = batch_index * batch_size
        samples = [self[(start + offset) % self.length] for offset in range(batch_size)]
        frames = torch.stack([sample["frames"] for sample in samples], dim=0)
        positions = torch.stack([sample["positions"] for sample in samples], dim=0)
        if device is not None:
            frames = frames.to(device)
            positions = positions.to(device)
        return {"frames": frames, "positions": positions}
