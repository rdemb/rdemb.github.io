# Does a learned predictive state learn gravity?

### A minimal, CPU-reproducible gravity-world probe

**TL;DR.** In a 32×32 side-view world where a ball moves under constant gravity
(arcing, bouncing off the floor with restitution), a tiny JEPA latent predictor
**beats a memoryless constant-velocity baseline** at predicting the ball's
future position, `4.36 px` vs `5.81 px` at horizon 4 — because it learned the
downward acceleration the baseline structurally lacks. In latent space the model
expects the *gravitational* future over a straight-line future in **98%** of
held-out cases (surprise margin `+0.45`). This is the mirror image of the
object-permanence result: there, on fully observed linear motion, learning could
not beat constant velocity because velocity already had all the information
(`V ≈ 0`). Under gravity, constant velocity is missing the acceleration, so a
learned predictor earns its keep *on full observation*.

This is a toy diagnostic, not a benchmark, not SOTA, not a general world model.

---

## Setup

- **World** (`jepa_petri/data/gravity_ball.py`): a ball is launched with a random
  lateral + upward kick and falls under constant gravity, bouncing off the floor
  (restitution `0.72`) and walls. Image y grows downward, so gravity is a constant
  positive acceleration on the vertical velocity. Side-view, depth frozen.
- **Model**: the repo's `TinyJEPA` (online encoder + EMA target + MLP predictor),
  `context_len=2` (two frames expose velocity), `horizon=4`.
- **Probe**: a linear probe maps the *target* latent (clean encoding of the future
  frame) to the future position; the same probe is applied to the model's
  *predicted* latent. Generator positions are probe/eval/baseline only, never in
  the JEPA objective.

## The collapse that had to be fixed first

The repo's default `normalized_prediction_loss` L2-normalizes latents, so it
supervises only direction. On this world that let the raw latent space drift:
scale exploded (`std 5–13`), dimensions correlated, `effective_rank` fell to
`~3.8`, and a linear probe could not read position (`5.5–9 px` recon). The
predicted latent also drifted to `~2.5×` the target scale, so a probe trained on
targets read the prediction at `40–116 px`.

The fix is a raw-MSE objective plus a VICReg-lite variance floor and covariance
penalty (`--loss raw --variance-weight 1.0 --covariance-weight 0.04`): it forces
the prediction to match the target in scale and decorrelates dimensions.

| | normalized (default) | **raw + VICReg** |
| --- | ---: | ---: |
| effective_rank (target) | `3.8` | `11.2` |
| linear probe recon | `5.5–9 px` | `1.39 px` |
| linear model prediction | `40–116 px` | `4.36 px` |

## Result (held-out, 1024 samples, horizon 4)

| predictor | future-position MAE |
| --- | ---: |
| persistence (no motion) | `5.73 px` |
| constant velocity (memoryless) | `5.81 px` |
| **learned JEPA (linear probe on prediction)** | **`4.36 px`** |
| constant-acceleration oracle (ceiling) | `1.57 px` |

- Learned beats constant velocity by `+1.44 px` and persistence by `+1.37 px`.
- Probe readability ceiling (linear probe on the clean target latent): `1.39 px`.

### Probe-free latent check

Comparing the predicted latent (by cosine, matching the directional objective) to
three candidate futures rendered as frames:

| candidate future | surprise (1 − cos) |
| --- | ---: |
| **real gravitational future** | **`0.077`** |
| straight-line (no gravity) | `0.527` |
| frozen (persistence) | `0.711` |

The model is closer to the gravitational future than to the straight-line future
in **98%** of cases; gravity margin `+0.45`, frozen margin `+0.63`. It is not
copying the present and not extrapolating a straight line: it expects the arc.

## What this is and is not

A clean, minimal, CPU-reproducible demonstration that a learned latent predictor
acquires constant acceleration and beats a memoryless baseline *on full
observation*, exactly where the linear-motion object-permanence result said
learning cannot help. It is **not** a benchmark, not SOTA, not evidence of
general physics understanding, and not a real-video claim. Single side-view
gravity world, frozen depth, one ball.

## Reproduce (CPU)

```bash
python -m jepa_petri.train --world gravity_ball --context-len 2 --horizon 4 \
  --seq-len 8 --steps 2500 --batch-size 64 --loss raw \
  --variance-weight 1.0 --covariance-weight 0.04 --run-name gravity_v2 --seed 0
python -m jepa_petri.run_gravity_world --run-name gravity_v2 --probe-steps 500
```
