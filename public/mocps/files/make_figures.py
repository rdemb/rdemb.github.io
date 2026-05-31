#!/usr/bin/env python3
"""Figures for the write-up:
  FIG1: phase diagram V = learned - max(fair baselines)  (where learning beats everything)
  FIG2: the two failure modes (separation margin d_min vs identity accuracy)
"""
import json
from collections import defaultdict
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from separation_margin import reappear_distance

VEL = "memory_velocity_two_slot"
PRED = "predictive_occlusion_memory_two_slot"
LEARN = "learned_recurrent_occlusion_memory_two_slot"
KEY = "assignment_accuracy_after_occlusion"
ACCENT = "#E8B23A"


def load(path):
    rows = json.load(open(path)).get("rows", [])
    g = defaultdict(lambda: defaultdict(list))
    for r in rows:
        m, L, v = r.get("acceleration_mode"), r.get("occlusion_length"), r.get("variant")
        val = r.get(KEY)
        if val is not None:
            g[(m, L)][v].append(val)
    return g


# merge the runs: brittleness probe (strong/dir, L1-6) + accel frontier (4 modes, L2,4,6) + corner fill
G = {}
for p in ["runs/accel_frontier/summary.json", "runs/brittleness_probe/summary.json", "runs/fill_corners/summary.json"]:
    for k, vd in load(p).items():
        G.setdefault(k, vd)
mean = lambda xs: (sum(xs) / len(xs)) if xs else float("nan")

MODES = ["none_control", "mild_accel", "strong_accel", "direction_change"]
LABELS = {"none_control": "none", "mild_accel": "mild\naccel", "strong_accel": "strong\naccel", "direction_change": "direction\nchange"}
LS = [1, 2, 3, 4, 6]

# ---------- FIG 1: phase diagram V = learned - max(baseline) ----------
Vmat = np.full((len(MODES), len(LS)), np.nan)
for i, m in enumerate(MODES):
    for j, L in enumerate(LS):
        vd = G.get((m, L))
        if not vd: continue
        lr = mean(vd.get(LEARN, [])); ve = mean(vd.get(VEL, [])); pr = mean(vd.get(PRED, []))
        if np.isnan(lr): continue
        best = np.nanmax([ve, pr])
        Vmat[i, j] = lr - best

fig, ax = plt.subplots(figsize=(7.2, 4.2))
im = ax.imshow(Vmat, cmap="RdYlGn", vmin=-0.8, vmax=0.8, aspect="auto")
ax.set_xticks(range(len(LS))); ax.set_xticklabels([f"L={L}" for L in LS])
ax.set_yticks(range(len(MODES))); ax.set_yticklabels([LABELS[m] for m in MODES])
ax.set_xlabel("occlusion length"); ax.set_title("Where learning beats every fair baseline\n(V = learned accuracy - best baseline)", fontsize=11)
for i in range(len(MODES)):
    for j in range(len(LS)):
        if not np.isnan(Vmat[i, j]):
            ax.text(j, i, f"{Vmat[i,j]:+.2f}", ha="center", va="center", fontsize=9,
                    color="black", fontweight="bold")
cb = fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04); cb.set_label("learning advantage")
# highlight the headline cell
for i, m in enumerate(MODES):
    for j, L in enumerate(LS):
        if m == "direction_change" and L == 4:
            ax.add_patch(plt.Rectangle((j-0.5, i-0.5), 1, 1, fill=False, edgecolor=ACCENT, lw=3))
fig.tight_layout(); fig.savefig("figures/fig1_phase.png", dpi=140); plt.close(fig)

# ---------- FIG 2: two failure modes (d_min vs accuracy) ----------
pts = []  # (d_min, learned, velocity, mode, L)
for m in MODES:
    for L in LS:
        vd = G.get((m, L))
        if not vd: continue
        lr = mean(vd.get(LEARN, [])); ve = mean(vd.get(VEL, []))
        if np.isnan(lr): continue
        dmin = reappear_distance(m, L)[0]
        pts.append((dmin, lr, ve, m, L))

fig, ax = plt.subplots(figsize=(7.2, 4.4))
xs = [p[0] for p in pts]
ax.scatter(xs, [p[1] for p in pts], s=70, c=ACCENT, edgecolor="k", zorder=3, label="learned memory")
ax.scatter(xs, [p[2] for p in pts], s=55, c="#888", marker="s", zorder=2, label="velocity (physics)")
ax.axvspan(0, 4.5, color="#d9534f", alpha=0.08)
ax.axvline(4.5, ls="--", c="#777", lw=1.1)
ax.text(4.62, 1.03, "= 1 object diameter", fontsize=7.5, color="#777")
ax.axhline(0.75, ls=":", c="#d9534f", lw=1)
ax.text(4.7, 0.77, "dynamics-oracle ceiling at tight separation (0.75)", fontsize=8, color="#d9534f")
ax.text(3.35, 0.28, "SEPARATION-LIMITED (n=4)\nlearned 0.40 < velocity 0.76:\nthe clever model loses", fontsize=8, color="#a33", ha="center")
ax.text(10.4, 0.30, "learning's regime (n=18)\nlearned 0.96, velocity 0.14", fontsize=8.5, color="#1f7a4d", ha="left")
# annotate the headline win
for d, lr, ve, m, L in pts:
    if m == "direction_change" and L == 4:
        ax.annotate("direction change, L=4:\nlearned 1.00, physics 0.18\n= DYNAMICS-LIMITED", (d, lr),
                    xytext=(d+1.5, 0.55), fontsize=8.5, color="#2a7",
                    arrowprops=dict(arrowstyle="->", color="#2a7"))
ax.set_xlabel("separation margin d_min at reappearance (px)"); ax.set_ylabel("identity accuracy after occlusion")
ax.set_ylim(-0.05, 1.08); ax.set_title("Two failure modes: geometry vs dynamics", fontsize=11)
ax.legend(loc="lower right"); ax.grid(alpha=0.2)
fig.tight_layout(); fig.savefig("figures/fig2_mechanisms.png", dpi=140); plt.close(fig)

print("wrote figures/fig1_phase.png and figures/fig2_mechanisms.png")
print(f"cells with data: {int(np.sum(~np.isnan(Vmat)))} | separation points: {len(pts)}")
