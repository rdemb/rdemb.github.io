---
layout: page
title: "MOCPS — Motion-Grounded Object-Centric Predictive State"
lang: en
pl_url: /mocps/
de_url: /de/mocps/
permalink: /en/mocps/
---

MOCPS is a small research project about predicting object motion in simple pixel worlds. The question is narrow: can a representation extracted from images predict a future position better than the last known position?

Technically, the current version is the `signed_velocity_only` + predictor400 recipe. It is not a large new architecture. It is a narrow reproducible test that came out of a sequence of negative and positive results.

## What it is

MOCPS means **Motion-Grounded Object-Centric Predictive State**. In practice, it is a small CPU-friendly diagnostic that tests whether a predictive latent state can:

- select the moving object from pixels,
- preserve its position in the representation,
- receive direction from image-derived signed velocity,
- predict the future state better than persistence.

Persistence is a strong simple baseline: it assumes the future position is the last observed position. MOCPS is only interesting when it consistently beats that baseline.

## Goal

The goal is not to claim a general world model. The goal is to answer one small question:

> when does a predictive latent actually carry useful object state, and when is the result only caused by a weak baseline?

That is why the experiments are small, local, and CPU-first. Every positive result is measured against simple baselines, not judged by description.

## Mechanism

```text
frames t,t+1
  -> diff-motion objectness
  -> coordinate-aware object token
  -> signed velocity residual
  -> predictor400
  -> predicted future state
  -> probe/eval only
```

- **Diff-motion objectness**: the objectness head receives explicit frame differences, so it can use motion instead of brightness alone.
- **Coordinate-aware object token**: the token keeps spatial structure instead of being only an abstract embedding.
- **Signed velocity residual**: direction comes from positive and negative pixel differences, with no generator labels in encoder or predictor training.
- **Predictor400**: a more stable latent-predictor training recipe. The earlier recipe had rare training variance.

## Main result

<div class="metric-grid">
  <div class="metric"><strong>200/200</strong><span>cold run vs persistence</span></div>
  <div class="metric"><strong>1.574 px</strong><span>mean MAE</span></div>
  <div class="metric"><strong>3.903 px</strong><span>persistence MAE</span></div>
  <div class="metric"><strong>0</strong><span>failed rows</span></div>
</div>

| group | result | mean MAE | persistence MAE |
| --- | ---: | ---: | ---: |
| total covered surface | 200/200 | 1.574 px | 3.903 px |
| no_bounce_ball | 50/50 | 0.845 px | 1.444 px |
| bouncing_ball | 50/50 | 2.292 px | 5.504 px |
| moving_ball_distractors | 100/100 | 1.579 px | 4.332 px |
| horizon 1 | 50/50 | 0.845 px | 1.444 px |
| horizon 4 | 50/50 | 1.354 px | 3.610 px |
| horizon 6 | 100/100 | 2.048 px | 5.279 px |

The result comes from the cold reproducibility run:

- `cold_run: true`
- `reused_rows: false`
- `failed rows: 0`
- `rows worse than learned_diff: 0`
- runtime: `13260.8 s`

Requested world/horizon pairs outside the supported stability surface were explicitly omitted, not silently counted.

## v0.6.1 — dynamic moving-distractor stress test

This test added a harder world: one moving target and one similarly bright moving distractor. The MOCPS architecture was not changed or tuned for this case.

The question was simple: can single-object MOCPS handle more than one moving object?

| horizon | result vs persistence | MOCPS MAE | persistence MAE | target mass | distractor mass |
| ---: | :---: | ---: | ---: | ---: | ---: |
| h1 | 0/5 | 4.177 px | 2.189 px | 0.168 | 0.333 |
| h2 | 1/5 | 3.497 px | 3.273 px | 0.219 | 0.239 |
| h4 | 5/5 | 3.769 px | 5.429 px | 0.262 | 0.280 |
| h6 | 5/5 | 3.873 px | 7.478 px | 0.268 | 0.287 |
| total | 11/20 | 3.829 px | 4.592 px | 0.229 | 0.285 |

Interpretation: the dynamic distractor breaks the current single-object MOCPS recipe. The likely failure mode is object selection: with two similarly bright moving objects, the objectness mass leans more toward the distractor than the target. This is a negative result and a useful next direction: multi-object / slot-like state.

## v0.6.2 — dynamic-distractor selection audit

The next audit checked whether the v0.6.1 failure disappears when the target is selected correctly. This was a diagnostic test, not a new architecture.

| variant | result vs persistence | mean MAE | interpretation |
| --- | :---: | ---: | --- |
| unchanged MOCPS | 11/20 | 3.829 px | the single-object selector confuses target and distractor |
| target oracle | 20/20 | 0.602 px | correct target selection fixes the result |
| distractor oracle | 4/20 | 8.856 px | selecting the wrong object gives bad target prediction |
| image two-component left slot | 20/20 | 0.602 px | a pixel-derived left-starting component is enough on this grid |
| best-of-two oracle | 20/20 | 0.601 px | diagnostic upper bound |

Interpretation: v0.6.1 was primarily an object binding / target selection failure. A simple image-derived two-component selector solves this specific stress test, but this is still a diagnostic result, not a claim of a finished multi-object model. The next step is a minimal trainable multi-object / slot-like MOCPS.

## v0.7 — minimal two-slot MOCPS audit

v0.7 turned the v0.6.2 diagnostic into a reproducible minimal two-slot pipeline. This is still not full trainable Slot Attention. The slots are extracted from image-derived motion components, and the target in this world is the left-starting component.

| variant | result vs persistence | mean MAE | interpretation |
| --- | :---: | ---: | --- |
| single-object MOCPS | 11/20 | 3.829 px | the v0.6.1 baseline still does not bind the target reliably |
| image two-component left slot | 20/20 | 0.602 px | the pixel-derived diagnostic selector works on this grid |
| two-slot MOCPS | 20/20 | 0.602 px | the minimal two-slot pipeline reproduces the diagnostic result |
| target oracle | 20/20 | 0.602 px | correct target selection is sufficient here |
| distractor oracle | 4/20 | 8.856 px | selecting the wrong object breaks target prediction |

The short-horizon h1/h2 rows improved from `1/10` in single-object MOCPS to `10/10` in two-slot MOCPS, with assignment accuracy `1.000`.

Interpretation: on this checked dynamic-distractor grid, explicit two-object state fixes the single-object MOCPS failure. This is a positive diagnostic result, not a claim of general multi-object robustness and not a finished trainable slot model. The next step is trainable slot assignment, then crossing objects, occlusion, acceleration, and noisy backgrounds.

## v0.7.1 — Trainable two-slot assignment audit

v0.7.1 checked whether hard-coded left-slot assignment can be replaced by a tiny trainable head. The scorer was trained only from image-derived component pseudo-targets: the target was the component with the smaller observed initial x centroid. Generator positions were used only for oracle/eval/baseline.

| variant | result vs persistence | mean MAE | assignment |
| --- | :---: | ---: | ---: |
| fixed-left two-slot | 20/20 | 0.602 px | 1.000 |
| trainable two-slot | 20/20 | 0.602 px | 1.000 |
| random assignment | 10/20 | 4.609 px | 0.499 |
| unchanged MOCPS | 11/20 | 3.829 px | n/a |

Interpretation: a minimal trainable assignment head reproduces the fixed-left two-slot result on this checked world and preserves the h1/h2 fix (`10/10`). This is still a toy diagnostic: not full trainable Slot Attention, not a benchmark, and not a broad multi-object robustness claim.

## v0.8 — Crossing-objects stress test

v0.8 tested trainable two-slot MOCPS on two similar moving objects that exchange left/right order. This is an identity stress test, not a benchmark.

| variant | result vs persistence | mean MAE | assignment before/after crossing |
| --- | :---: | ---: | ---: |
| fixed initial identity | 20/20 | 0.376 px | 1.000 / 1.000 |
| trainable two-slot | 10/20 | 5.523 px | 1.000 / 0.000 |
| current-left baseline | 10/20 | 5.523 px | 1.000 / 0.000 |
| target oracle | 20/20 | 0.376 px | 1.000 / 1.000 |

Interpretation: the feed-forward trainable assignment does not preserve identity after crossing. It behaves like the current-left heuristic: it works before the left/right swap, then selects the other object after the swap. The next step is memory or recurrent slot identity.

Caveat: this is still a toy diagnostic; not full trainable Slot Attention, not a benchmark, not SOTA, and not a claim about AGI, physics understanding, a general world model, or broad multi-object robustness.

## v0.8.1 — Memory-slot identity audit

v0.8.1 checked whether simple slot memory is enough where feed-forward assignment broke under crossing. The slot starts from the image-derived left-starting component, then uses only observed component history: previous centroid, velocity, and mass.

| variant | result vs persistence | mean MAE | assignment after crossing |
| --- | :---: | ---: | ---: |
| trainable two-slot | 10/20 | 5.586 px | 0.000 |
| current-left baseline | 10/20 | 5.586 px | 0.000 |
| nearest memory | 20/20 | 0.423 px | 1.000 |
| velocity memory | 20/20 | 0.423 px | 1.000 |
| learned memory scorer | 20/20 | 0.423 px | 1.000 |
| target oracle | 20/20 | 0.423 px | 1.000 |

Interpretation: in this checked toy world, the v0.8 failure was an identity-memory failure, not a trajectory-prediction failure. The simplest centroid continuity was enough; velocity memory and the small learned scorer did not improve over nearest memory.

Caveat: this is still a diagnostic. It is not full trainable Slot Attention, a benchmark, SOTA, AGI, physics understanding, a general world model, or broad multi-object robustness.

## v0.9 — Occlusion memory-slot audit

v0.9 added short occlusion: two similar objects share the same y path and briefly merge into one visible blob. This separates simple memory from predictive memory.

| variant | result vs persistence | mean MAE | assignment after occlusion |
| --- | :---: | ---: | ---: |
| trainable two-slot | 15/20 | 3.768 px | 0.000 |
| nearest / velocity memory | 15/20 | 3.470 px | 0.000 |
| predictive occlusion memory | 20/20 | 0.422 px | 1.000 |
| target oracle | 20/20 | 0.422 px | 1.000 |

Interpretation: centroid continuity is enough while both components stay visible. It is not enough when the image merges two objects into one component. Predictive memory rolls the slot through the ambiguous observation and lowers confidence instead of pretending full certainty.

## v0.9.1 — Learned recurrent occlusion gate

v0.9.1 replaced the hand-coded update/predict decision with a small learned gate. The gate was trained from image-derived pseudo-targets: whether the frame exposes enough components to trust the observation, or whether the state should be rolled forward from memory.

| variant | result vs persistence | mean MAE | assignment during/after occlusion |
| --- | :---: | ---: | ---: |
| frozen velocity memory | 15/20 | 3.470 px | 1.000 / 0.000 |
| predictive occlusion memory | 20/20 | 0.422 px | 1.000 / 1.000 |
| learned recurrent gate | 20/20 | 0.422 px | 1.000 / 1.000 |

Additional checks: identity switch rate `0.000`, gate final update accuracy `1.000`.

Interpretation: the learned gate reproduces the hand-coded predictive-memory behavior on this checked grid. This is a positive diagnostic result, not full trainable Slot Attention. The next test should add longer occlusion and acceleration.

## v0.9.2 — Long-occlusion memory sweep

This sweep tested learned recurrent slot memory under longer occlusion windows: `1`, `2`, `3`, `4`, and `6` merged-observation frames.

Result: the learned recurrent gate and the hand-coded predictive memory both reached `20/20` at every checked length. Learned recurrent after-occlusion assignment was `1.000`, identity switch rate was `0.000`, and final confidence dropped from `0.539` at length `1` to `0.118` at length `6`.

Interpretation: on this constant-velocity toy diagnostic, no learned memory-horizon bottleneck appeared through length `6`. The next bottleneck looks more like confidence calibration or motion extrapolation under acceleration. Important caveat: frozen velocity memory can still show `20/20` against persistence while losing after-occlusion identity, so winrate alone is not enough.

Caveat: toy diagnostic only; not full trainable Slot Attention; not a benchmark, SOTA, AGI, physics understanding, or a general world model.

## v0.10 — Acceleration-through-occlusion stress test

What changed: I tested learned recurrent slot memory when the hidden object changes velocity near or through occlusion.

Result: the learned recurrent gate stayed at `60/60` on `none_control`, `mild_accel`, and `strong_accel`, but under `strong_accel` after-occlusion assignment fell to `0.503` and identity switch rate rose to `0.391`. Under `direction_change`, the result fell to `30/60`, with after-occlusion assignment `0.774`.

Interpretation: acceleration exposes a motion-extrapolation / identity-binding bottleneck. Winrate against persistence is not enough: `strong_accel` still reports `60/60`, while often losing identity after reappearance. The next step is a learned acceleration-aware recurrent state.

Caveat: toy diagnostic only; not full trainable Slot Attention; not a benchmark, SOTA, AGI, physics understanding, or a general world model.

## Baselines and references

| variant | result / observation | why it matters |
| --- | --- | --- |
| persistence | mean MAE 3.903 px | simple baseline: future = last known position |
| motion_coord | 200/200, mean MAE 1.966 px | strong hand-defined motion-objectness reference |
| learned_diff | 200/200, mean MAE 2.443 px | learned diff-motion token without the promoted MOCPS recipe |
| MOCPS | 200/200, mean MAE 1.574 px | current promoted learned diagnostic recipe |
| analytic signed-motion baseline | 0/60 in the ablation | signed pixel state alone was not enough |

The important interpretation: signed velocity helps, but it does not replace the learned token path. The analytic signed-motion baseline failed when used alone. MOCPS works as a combination of object-centric token, signed velocity residual, and stabilized predictor training.

## Compute environment

The experiments are designed to be CPU-first. The latest cold reproducibility run was executed locally on:

- CPU: `AMD EPYC-Milan Processor`
- environment: KVM / QEMU
- 12 vCPU
- 6 cores / 12 threads
- L3 cache: 32 MiB

This is deliberate: a small diagnostic should be runnable without a GPU cluster and without a heavy MLOps stack.

## Path to MOCPS

<div class="timeline">
  <div class="timeline-item">
    <h3>1. Plain latent prediction</h3>
    <p>Latent MSE, temporal contrastive, and temporal delta did not beat fair baselines on the predicted-latent path. This was the first important negative result.</p>
  </div>
  <div class="timeline-item">
    <h3>2. Object-state pretext</h3>
    <p>The first positive signal appeared when the representation was pressured toward pixel-derived object state. This showed that representation quality mattered as much as the predictor.</p>
  </div>
  <div class="timeline-item">
    <h3>3. Coordinate-aware tokens</h3>
    <p>Explicit coordinate structure helped in clean worlds. Brightness objectness, however, broke under static bright distractors.</p>
  </div>
  <div class="timeline-item">
    <h3>4. Motion objectness</h3>
    <p>Motion-derived objectness was more robust to static distractors. This moved the project toward motion-grounded object selection.</p>
  </div>
  <div class="timeline-item">
    <h3>5. Learned diff-motion objectness</h3>
    <p>Learned objectness started to work only when given explicit frame-difference input. It was strong but still imperfect, especially on no_bounce h1.</p>
  </div>
  <div class="timeline-item">
    <h3>6. Signed residual</h3>
    <p>Signed positive and negative frame differences added direction. The ablation showed signed velocity was the strongest minimal signed component.</p>
  </div>
  <div class="timeline-item">
    <h3>7. Stability forensics</h3>
    <p>The only unstable signed_velocity_only case was diagnosed as predictor-training variance, not probe variance or an evaluation artifact.</p>
  </div>
  <div class="timeline-item">
    <h3>8. Predictor400</h3>
    <p>More predictor training removed the remaining instability: predictor400 reached 210/210 in the stability audit and 200/200 in the cold MOCPS run.</p>
  </div>
</div>

## Current position

MOCPS now has a stable single-object result, and the slot-memory path survives constant-velocity occlusion, but v0.10 shows a failure under acceleration. The strongest public base result is still the cold run: `200/200` against persistence on the covered surface.

This does not finish the research. It closes the first stable stage: there is now a recipe that works on the known worlds and baselines, so the next question is where it breaks.

## Direction

The next tests should be harder and less comfortable:

- moving distractor: the first checked version breaks current single-object MOCPS; the selection audit shows that correct target selection fixes the checked grid
- crossing objects: v0.8 breaks feed-forward trainable assignment after the left/right swap; v0.8.1 fixes the checked crossing case with slot memory
- short occlusion: v0.9 separates simple memory from predictive memory; v0.9.1 shows a learned gate on the checked grid
- acceleration-aware recurrent state after v0.10
- noisy background
- more than one moving object
- transfer between world variants

The nearest research direction is a learned acceleration-aware recurrent state, then noisy reappearance.

## What this does not mean

This is not a benchmark, not SOTA, not evidence of physics understanding, not a general world model, and not a claim that JEPA works. It is a small, explicitly limited diagnostic result.
