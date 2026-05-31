#!/usr/bin/env python3
"""Hero animation of the headline scenario (direction change under occlusion, L=4).
Faithful schematic of the actual 32x32 world: same positions and sizes as the data.
Honest by construction: it shows the GROUND-TRUTH trajectory and the MEASURED outcomes,
it does not fabricate any method's internal guess. Saves a looping GIF plus key stills.
"""
import torch
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle
from matplotlib.animation import FuncAnimation, PillowWriter
from separation_margin import _dataset_for, cfg

BG = "#0C0E12"; PANEL = "#14171C"; AMBER = "#E8B23A"; GREY = "#9AA1AB"; TEXT = "#E7E9EC"; MUT = "#6b7280"
R = 2.3  # ball radius (px), both balls identical

ds = _dataset_for(cfg, seed=4242, acceleration_mode="direction_change", occlusion_length=4)
b = ds.sample_batch(batch_size=32, batch_index=0)
i = 0
tpos = b["positions"][i].tolist()
dpos = b["distractor_positions"][i].tolist()
o0, o1 = int(b["occlusion_start"][i]), int(b["occlusion_end"][i])
reappear = o1 + 1
N = len(tpos)

# animation steps: (sim_frame, mode), with holds for suspense
steps = ([(0, "follow")] * 2 + [(0, "follow"), (1, "follow"), (2, "follow")]
         + [(t, "hide") for t in range(o0, o1 + 1)]
         + [(reappear, "quiz")] * 4
         + [(reappear, "reveal"), (reappear + 1, "reveal"), (min(reappear + 2, N - 1), "reveal")] * 1
         + [(N - 1, "reveal")] * 2
         + [(N - 1, "summary")] * 5)

fig, ax = plt.subplots(figsize=(8, 3.7))
fig.patch.set_facecolor(BG)


def draw(idx):
    sim, mode = steps[idx]
    ax.clear()
    ax.set_facecolor(PANEL)
    ax.set_xlim(-1, 33); ax.set_ylim(4.5, 20.5); ax.set_aspect("equal")
    ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values(): s.set_color("#23272E")

    # trails up to current sim frame
    tx = [p[0] for p in tpos[:sim + 1]]; ty = [p[1] for p in tpos[:sim + 1]]
    dx = [p[0] for p in dpos[:sim + 1]]; dy = [p[1] for p in dpos[:sim + 1]]
    ax.plot(dx, dy, color=GREY, lw=1.2, alpha=0.35, zorder=1)
    ax.plot(tx, ty, color=AMBER, lw=1.4, alpha=0.30, zorder=1)

    tp, dp = tpos[sim], dpos[sim]
    # distractor: always visible, grey
    quiz = (mode == "quiz")
    dcol = GREY
    ax.add_patch(Circle(dp, R, color=dcol, zorder=3))
    if mode == "hide":
        # target hidden from the model: dashed ghost at its true (secret) location
        ax.add_patch(Circle(tp, R, fill=False, ls=(0, (3, 2)), ec=AMBER, lw=1.6, alpha=0.55, zorder=3))
        ax.text(tp[0], tp[1] - 4.2, "hidden", color=AMBER, fontsize=8, ha="center", alpha=0.8)
    elif quiz:
        # reappeared: to a memoryless observer both look identical -> grey + "?"
        ax.add_patch(Circle(tp, R, color=GREY, zorder=3))
        ax.text(tp[0], tp[1] + 3.6, "?", color=TEXT, fontsize=15, ha="center", va="center", fontweight="bold")
        ax.text(dp[0], dp[1] + 3.6, "?", color=TEXT, fontsize=15, ha="center", va="center", fontweight="bold")
    else:
        # follow / reveal / summary: true target highlighted amber
        ax.add_patch(Circle(tp, R, color=AMBER, zorder=3))
        if mode in ("reveal", "summary"):
            ax.add_patch(Circle(tp, R + 1.1, fill=False, ec=AMBER, lw=2.0, zorder=4))
            ax.text(tp[0], tp[1] + 4.0, "target", color=AMBER, fontsize=8.5, ha="center", fontweight="bold")

    # captions
    cap = {
        "follow": "Follow the amber target. A distractor crosses its path.",
        "hide": "The target is hidden for 4 frames, and changes its motion while hidden.",
        "quiz": "To the model, both balls look identical. Which one is the target?",
        "reveal": "Memoryless velocity gets this right 18% of the time.",
        "summary": "",
    }[mode]
    ax.set_title(cap, color=TEXT, fontsize=11, pad=10, loc="left")

    if mode == "summary":
        ax.add_patch(plt.Rectangle((-1, 4.5), 34, 16, color=BG, alpha=0.72, zorder=8))
        ax.text(16, 15.2, "object permanence through occlusion", color=MUT, fontsize=10, ha="center", zorder=9)
        ax.text(16, 12.0, "memoryless velocity:  18%", color=GREY, fontsize=13, ha="center", zorder=9, fontweight="bold")
        ax.text(16, 8.6, "learned recurrent state:  100%", color=AMBER, fontsize=13, ha="center", zorder=9, fontweight="bold")

    # small persistent label
    ax.text(32.5, 5.4, "32x32 world  |  direction change, L=4", color=MUT, fontsize=7.5, ha="right", va="bottom")
    return []


anim = FuncAnimation(fig, draw, frames=len(steps), interval=520, blit=False)
anim.save("figures/mocps_hero.gif", writer=PillowWriter(fps=2), savefig_kwargs={"facecolor": BG})
print(f"wrote figures/mocps_hero.gif  ({len(steps)} frames)")

# key stills for verification
for name, idx in [("follow", 3), ("hide", 7), ("quiz", 11), ("reveal", 16), ("summary", 20)]:
    draw(idx); fig.savefig(f"figures/_still_{name}.png", dpi=110, facecolor=BG)
print("wrote key stills: _still_follow/hide/quiz/reveal/summary.png")
