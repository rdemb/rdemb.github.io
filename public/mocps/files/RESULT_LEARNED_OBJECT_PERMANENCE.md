# When does a learned predictive state earn its keep?

### A minimal, CPU-reproducible phase diagram of learned object permanence

**TL;DR.** In a 32×32 two-ball pixel world, a learned recurrent predictive state gives *no*
advantage over a constant-velocity baseline on fully observed prediction (it loses on 222/222
fair comparisons). Its value is confined to **occlusion**, where it maintains object identity that
a velocity baseline loses. Across an acceleration × occlusion sweep we find the learned state beats
*both* a physics baseline *and* a hand-coded predictive memory in exactly one regime, **direction
change while hidden**, and we show *why*: the two failure modes that bound every method are
**separation-limited** (objects pass too close to disambiguate, irreducible even for an oracle) and
**dynamics-limited** (the baseline extrapolates the wrong trajectory, which learning can fix). A
simple hold/predict arbitration closes the learnable part of the gap and lands near the oracle
ceiling. Everything runs on CPU and reproduces with one command.

This is not SOTA, not a benchmark, and not a claim that JEPA "works." It is an honest map.

---

## 1. Setup

- **World.** Two balls cross paths; one is the target (image-derived left-starting component at t=0).
  The target is hidden for `L` frames (occlusion), then reappears. Optional acceleration modes:
  `none_control`, `mild_accel`, `strong_accel`, `direction_change` (the ball reverses while hidden).
- **Task.** After reappearance, re-assign the slot to the correct ball (object permanence /
  identity), measured as `assignment_accuracy_after_occlusion ∈ [0,1]`.
- **Methods compared.** A memoryless **constant-velocity** baseline; a **hand-coded predictive
  memory**; a **learned recurrent gate**; and a hold/predict **arbitration** variant. Oracles
  (true mask, dynamics selector) give upper bounds. 4–6 seeds per cell, all on CPU.

## 2. Fully observed prediction: learning buys nothing (and that is a theorem, not a shame)

On un-occluded position prediction the learned latent predictor loses to a trivial
constant-velocity baseline on **222/222** audited cells (mean MAE 1.0–2.6 px for the model vs ~0 px
for constant velocity on the no-bounce world). "Beats persistence" (also 222/222) is an illusion:
persistence assumes the object does not move, so it is a weak reference.

**Why it must be so.** Define the value of memory as the MMSE gap between a memoryless and a
history-conditioned predictor,
`V = MMSE(s_{t+h} | o_t) − MMSE(s_{t+h} | o_{1:t}) ≥ 0`. Under full observation with frame-difference
input (which exposes velocity), the current observation `o_t` is a near-sufficient statistic, so
`V ≈ 0`. A learned state cannot beat physics where physics already has all the information.

## 3. Occlusion: object permanence, and where value appears

When the target is hidden, `o_t` stops being sufficient and `V` grows. Measuring identity after
occlusion (mean ± sd over seeds, no acceleration):

| occlusion L | velocity (memoryless) | hand-coded memory | learned | V(L)=learned−velocity |
| ---: | :---: | :---: | :---: | :---: |
| 1 | 0.234 ± 0.000 | 1.000 | 1.000 | +0.766 |
| 2 | 0.000 ± 0.000 | 1.000 | 1.000 | +1.000 |
| 3–6 | 0.000 ± 0.000 | 1.000 | 1.000 | +1.000 |

The velocity baseline collapses (0.000 from L≥2); a predictive state holds identity perfectly,
deterministically across seeds. But a *hand-coded* predictive memory does just as well, so here the
win is **structure** (having a predictive state), not **learning**.

## 4. The phase diagram: where learning beats both physics and structure

Sweeping acceleration × occlusion (identity after occlusion, 5–6 seeds):

| mode | L | velocity | hand-coded | learned |
| --- | :---: | :---: | :---: | :---: |
| none / mild_accel | 2–6 | 0.00 | 1.00 | **1.00** |
| direction_change | 4 | 0.18 | 0.33 | **1.00** |
| direction_change | 6 | 0.00 | 0.50 | 0.57 |
| strong_accel | 1 | 0.37 | 1.00 | 0.15 |
| strong_accel | 2 | 0.75 | 0.67 | **0.03** |
| strong_accel | 3–6 | 0.00 | ~1.0 | 0.81–0.98 |

![Phase diagram: learning advantage V = learned accuracy − best fair baseline, across acceleration mode (rows) and occlusion length (columns). Green is the only regime where learning beats both physics and a hand-coded predictive memory; red is the geometrically-bounded brittleness corner.](figures/fig1_phase.png)

*Figure 1. The phase diagram. Across the whole sweep, learning earns a positive advantage in exactly one cell (direction change, L=4, +0.67, highlighted). Everywhere else it either ties a hand-coded memory (yellow, V≈0) or loses in the separation-limited corner (red).*

Two things stand out: a **headline** (direction_change, L=4: learned 1.00 where velocity 0.18 and
hand-coded memory 0.33 both fail) and a **brittleness** (strong_accel, short L: learned 0.03–0.15,
worse than the dumb baseline). Both are robust across seeds.

## 5. Why: two distinct, geometric failure modes

We compute the target↔distractor distance at the reappearance frame (the separation margin
`d_min`). Correct assignment requires prediction error `< d_min/2`.

| mode | L | d (reappearance) | assignment outcome |
| --- | :---: | :---: | --- |
| strong_accel | 1–2 | **3.2** | learned 0.03–0.15; **oracle only 0.75** |
| direction_change | 1–2 | 3.2 | all modest (~0.71) |
| direction_change | 4 | 7.5 | velocity 0.18, **learned 1.00** |
| strong_accel | 3 | 9.0 | learned recovers 0.88 |
| none / mild | 1–6 | 6.3–17.3 | easy |

![Two failure modes: identity accuracy versus separation margin d_min at the reappearance frame. Amber circles are the learned state, grey squares the velocity baseline. In the shaded region (d_min ≈ 3 px) even an oracle caps at 0.75 (separation-limited). At d_min ≈ 7.5 px the velocity baseline still fails while the learned state reaches 1.00 (dynamics-limited).](figures/fig2_mechanisms.png)

*Figure 2. The two failure modes are geometric and separable. Left of the red band, the objects pass too close to disambiguate (irreducible). The single point where a comfortable margin still defeats physics, direction change at L=4, is exactly where learning wins.*

This separates the two failure modes cleanly:

- **Separation-limited** (`strong_accel`, short L): `d_min ≈ 3.2 px`, so assignment needs error
  `< 1.6 px`. Even the dynamics **oracle** caps at 0.75 here. This part of the brittleness is
  **irreducible geometry**, not a model defect.
- **Dynamics-limited** (`direction_change`, L=4): `d_min ≈ 7.5 px` is comfortable, yet the velocity
  baseline still fails (0.18) because it extrapolates the *wrong* direction through the occlusion.
  The learned state predicts the reversal, keeps error small, and wins (1.00). **This is the only
  regime where learning genuinely beats both physics and hand-coded structure.**

**One threshold, both modes.** Aggregating all 22 cells by separation makes the boundary
quantitative. Above `d_min ≈ 6 px` the learned state averages **0.96** identity accuracy against
**0.14** for velocity (n=18): this is learning's regime. In the four cells where the objects pass
within `~3 px`, about one object-diameter, the learned state collapses to **0.40** and is *beaten by
the memoryless baseline* (**0.76**, n=4). The crossover sits at the object scale, exactly where two
identical blobs stop being resolvable: below it no dynamics model can win and the extra machinery of
a learned predictor only adds variance; above it, learning is decisive. The separation margin, a
single geometric quantity, predicts which of the two regimes a cell falls into.

## 6. The fix, and its ceiling

The brittleness is a wrong inductive choice: the learned gate *predicts* under short occlusion where
*holding* the last position would be correct. A hold/predict **arbitration** recovers it:

| strong_accel | old gate | arbitration | dynamics oracle |
| :---: | :---: | :---: | :---: |
| L=1 | 0.15 | **1.00** | 1.00 |
| L=2 | 0.03 | 0.55 | 0.75 |
| L=3 | 0.88 | 0.98 | 1.00 |

At L=1 the fix is complete (0.15 → 1.00). At L=2 it reaches 0.55 against an oracle ceiling of 0.75:
the remaining gap is the separation limit of §5, not a learnable failure.

## 7. What this is and is not

A clean, minimal, CPU-reproducible characterization of *when* a learned predictive state provides
object permanence: useless on observed prediction (provably), decisive under occlusion with
non-linear dynamics (direction change), brittle in a geometrically-bounded corner that a simple
arbitration mostly fixes. It is **not** a benchmark, not SOTA, not evidence the model "understands
physics," and not a general world model.

## 8. Limitations, and the sharpest next test

This is deliberately a petri dish: 32×32, two balls, frame-difference input, one distractor. Three honest limits follow from that.

- **One distractor.** Identity here is a two-body assignment. The obvious next cell is **N distractors**, which makes the reappearance frame more confusable and should *widen* the dynamics-limited regime, exactly the regime where learning is the only method that wins. We did not run it: it needs an extension to the world generator, and we would rather name it as the sharp next test than ship a half-instrumented version. We predict the green region of Figure 1 grows and the V≈0 (tie) region shrinks as distractors are added; that is a falsifiable claim, not a result we are claiming.
- **Assignment as a proxy for value.** We report the value of memory as the *assignment gap* (learned − baseline accuracy), not as a trajectory MMSE in nats. A direct mutual-information estimate of `V(L)` would be the principled quantity, but our CPU MI estimates were too high-variance to report honestly, so we report the operational gap and leave the nat-valued version open rather than print a noisy number.
- **Minimal dynamics.** Linear motion with three acceleration perturbations is enough to expose the two failure modes, not enough to claim anything about real video. Scaling the *same* arbitration and the *same* separation-margin diagnostic to richer dynamics is the open direction.

None of these soften the core claim. They sharpen where it is allowed to apply.

## 9. Reproduce (CPU)

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-cpu.txt && pip install -e . --no-deps --no-build-isolation
# phase diagram
python -m jepa_petri.run_accel_occlusion_memory_mocps \
  --occlusion-lengths 2 4 6 --horizons 1 --seeds 0 1 2 3 4 --device cpu --output runs/phase
# the fix
python -m jepa_petri.run_dynamics_arbitration_memory_mocps \
  --acceleration-modes strong_accel direction_change --occlusion-lengths 1 2 3 \
  --seeds 0 1 2 3 4 5 --device cpu --output runs/fix
# V(L) and the separation margin
python analyze_phase.py runs/phase/summary.json
python separation_margin.py
# Figures 1 and 2 (phase diagram + two-mechanism scatter)
python make_figures.py   # writes figures/fig1_phase.png and figures/fig2_mechanisms.png
```

**Figures.** Figure 1 (the phase diagram) and Figure 2 (the two failure modes, with the separation
threshold at ≈1 object-diameter) are produced by `make_figures.py` from the run summaries and the
`separation_margin.py` geometry. They are the two images embedded in §4 and §5.
