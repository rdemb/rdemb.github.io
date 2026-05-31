#!/usr/bin/env python3
"""Separation margin d_min: is the ceiling of post-occlusion identity accuracy governed by
geometry (how closely the two objects pass at the reappearance frame) rather than by the model?
Criterion: identity is recoverable iff the prediction error < d_min/2. When d_min is small,
even an oracle fails. This is the geometry behind the two failure modes in the write-up.
"""
import torch
from jepa_petri.run_accel_occlusion_memory_mocps import _dataset_for, AccelOcclusionMemoryMOCPSConfig

cfg = AccelOcclusionMemoryMOCPSConfig()
MODES = ["none_control", "mild_accel", "strong_accel", "direction_change"]
LS = [1, 2, 3, 4, 6]
# known oracle ceilings / learned accuracy (from the runs) for cross-reference
NOTE = {("strong_accel", 1): "learned .15", ("strong_accel", 2): "learned .03 / oracle .75",
        ("strong_accel", 3): "learned .88", ("direction_change", 4): "learned 1.00 (vel .18)"}


def reappear_distance(mode, L, n=64):
    """Mean target-to-distractor distance at the frame right after occlusion (pixels)."""
    ds = _dataset_for(cfg, seed=4242, acceleration_mode=mode, occlusion_length=L)
    b = ds.sample_batch(batch_size=n, batch_index=0)
    pos = b["positions"]             # [B, seq, 2] target
    dis = b["distractor_positions"]  # [B, seq, 2] distractor
    oe = b["occlusion_end"]          # [B]
    seq = pos.shape[1]
    dists, mins = [], []
    for i in range(pos.shape[0]):
        f = min(int(oe[i].item()) + 1, seq - 1)   # reappearance frame
        d = torch.linalg.norm((pos[i, f] - dis[i, f])).item()
        dists.append(d)
        # minimum distance over the post-occlusion window (the hardest assignment moment)
        post = torch.linalg.norm((pos[i, f:] - dis[i, f:]), dim=-1)
        mins.append(post.min().item())
    import statistics as st
    return (st.mean(dists), st.pstdev(dists), st.mean(mins))


if __name__ == "__main__":
    print("Separation margin: target-to-distractor distance at the reappearance frame (pixels)")
    print("Criterion: assignment is reliable when the prediction error < d_min/2\n")
    print(f"  {'mode':16} {'L':>2} | {'d@reappear':>10} {'+/-':>6} | {'d_min(post)':>11} | note")
    for mode in MODES:
        for L in LS:
            m, sd, mn = reappear_distance(mode, L)
            note = NOTE.get((mode, L), "")
            flag = "  tight" if mn < 12.0 else ""
            print(f"  {mode:16} {L:>2} | {m:10.2f} {sd:6.2f} | {mn:11.2f} | {note}{flag}")
