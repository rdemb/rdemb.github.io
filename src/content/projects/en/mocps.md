---
title: "MOCPS, Motion-Grounded Object-Centric Predictive State"
lang: "en"
kind: "project"
excerpt: "A small JEPA world model that learned gravity and got a body: a living organism that flinches at broken physics, not at ordinary flight (AUC 0.82)."
key: "mocps"
slug: "mocps"
---
MOCPS is a small research project about predicting object motion in simple pixel worlds. The question is narrow: can a representation extracted from images predict a future position better than the last known position?

Technically, the current version is the `signed_velocity_only` + predictor400 recipe. It is not a large new architecture. It is a narrow reproducible test that came out of a sequence of negative and positive results.

## Under the bell jar: a living organism

The newest direction: give this world model a body. **Pod Kloszem** ("Under the Bell Jar") is a living 3D organism, a star visitor in a Polish backyard, driven by a real JEPA model running 24/7 on CPU. Not an animation: every frame is a readout of the model's state.

For the organism we extended the world with **gravity**, and that changes the game. On linear motion a learned predictor could not beat a constant-velocity baseline, because the baseline already had all the information. Under gravity, constant velocity misses the acceleration, and the learned predictor **beats it** (3.85 ± 0.56 px vs 5.71 px, five seeds), because it internalized falling.

The organism does three things at once, each measured:

- it **predicts** the ball's flight (the gold dot in the scene is the network's raw prediction, 4 frames ahead),
- it **remembers** the ball's position when it hides behind an occluder (object permanence),
- it **is surprised** the V-JEPA way: we measure the surprise gap, and the model flinches only when the director breaks physics (levitation, freeze, teleport). It catches blatant physics breaks 86–100% of the time, at about 3% false alarms (AUC 0.82).

A small corner panel, the "model's eye", shows the raw 32×32 image the brain actually works with, so you can see it predicts physics from ~1000 pixels, not from the pretty 3D. This is a physics-understanding test in Yann LeCun's spirit (possible vs impossible), embodied as a creature living under glass.

## What you see in the visualization

The visualization is a side view of the world the organism lives in. Every element means something, nothing is decoration:

- **White ball**: the real ball, ground truth. The actual world state the server runs 24/7.
- **Cyan arc**: the imagination track. The model's belief about the ball rolled forward with the world's hard physics (a rollout). It makes the memory under occlusion visible, but is not itself a network readout.
- **Gold dot**: the raw network prediction. Where the model (a linear probe on the predicted latent) expects the ball 4 frames later. The only point in the scene read straight from the network.
- **Cyan marker with a faint ring**: the model's belief about where the ball is. When the ball hides behind the occluder, the marker stays and moves to where the model expects it (object permanence). The ring grows as confidence drops.
- **Model's eye (left panel, 32×32 px)**: the raw image the brain actually works with. The white blob is the ball as it sees it (blurry, 1024 pixels), the cyan dot is its belief. This makes the representation visible: the model predicts physics from this, not from the pretty 3D.
- **Dark panel with a cyan edge**: the obstacle (occluder). When the ball passes behind it, it disappears from the model's eye and the permanence test begins.
- **Coral flash and ripple**: surprise. The model flinches only when the world breaks physics (the ball does not fall, freezes, or teleports). On an ordinary flight it stays calm.
- **Floor grid**: the physics reference plane, the shared coordinate frame of truth and prediction.
- **Data panel (right column)**: live metrics. "Physics grasp" (how often it correctly tells possible from impossible), confidence, state (sees / holds / surprised), and the impossible test: mean surprise on possible vs impossible worlds and the margin between them. On the left: the organism's age counted on the server (it survives restarts), world steps and the trial counter.
- **"Break physics" button**: you as the director. A click asks the server for a trap (an impossible event), to test whether the model notices.

## Research and results

**World.** A ball flies under constant gravity, bounces off the floor, sometimes hides behind an obstacle. The model only sees a 32×32 pixel projection (the same one the model's eye shows), never coordinates, never labels.

**Model.** A tiny JEPA (joint-embedding predictive architecture, the direction Yann LeCun champions): an encoder, a latent predictor, and an EMA target encoder. It learns to predict the future *latent*, not pixels. A few minutes of training on CPU.

**How we measure, everything against honest baselines:**

- **Gravity, replicated over 5 seeds.** A linear probe reads the position out of the model's prediction. The model hits the future position to **3.85 ± 0.56 px**, the constant-velocity baseline to **5.71 ± 0.01 px**, an advantage of **+1.86 px, positive on every one of five seeds**. The best seed (2.91 px) even beats the constant-acceleration oracle, because it learned floor bounces. This is the mirror image of the earlier result: on linear motion learning could not beat the baseline (it already had all the information), under gravity there is something to learn.
- **Possible vs impossible (the V-JEPA way).** At the moment of entering the occluder the model records what it expects; on reveal we compare that to reality in latent space. On possible events the surprise is small (0.14), on impossible ones large (0.82); gross miracles are detected at 86–100% with about a 3% false-alarm rate (AUC 0.82, current ledger n>5000). An honest baseline runs alongside: an idealized pixel tracker with the true physics. Every trial is appended to a public log (`trials.jsonl`), from which the threshold calibration is computed.
- **Subtle miracles, a measured edge.** The director also knows miracles invisible in a single frame: gravity bent by ±30%, momentum by ±35% behind the cover. The current representation catches 10–17% of those, and we report it plainly, as a map of where understanding ends, not a hidden failure.

**Along the way, honestly.** The first runs collapsed: the normalized loss let the representation fold in on itself (effective rank 3.8, latent unreadable). The fix is a raw MSE loss plus VICReg (variance and covariance), which raised the rank to 11 and made the latent readable. The second problem: the organism confused possible with impossible because the model only ever saw the start of the arc, fixed with a random world warm-up (context from every phase of flight).

## Conclusions

A tiny world model, trained without labels on 1024 pixels, **learned gravity well enough to beat a memoryless baseline on full observation**, in the very world where the earlier result showed learning does not help on linear motion. It got a body: it predicts the arc, holds the ball in mind behind cover, and flinches only at the impossible (AUC 0.82, blatant miracles 86–100%). The model's eye shows all of this happens on a poor, blurry image, so it is a proof about the representation, not a graphics effect.

**What it does not mean.** This is still toy scale: 32 pixels, one ball, a side view. Not a benchmark, not SOTA, not proof of general physics understanding, not a claim that JEPA "works". It is an honestly bounded, fully reproducible result, and a living organism that shows it live, 24/7, on CPU.

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

## v0.6.1, dynamic moving-distractor stress test

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

## v0.6.2, dynamic-distractor selection audit

The next audit checked whether the v0.6.1 failure disappears when the target is selected correctly. This was a diagnostic test, not a new architecture.

| variant | result vs persistence | mean MAE | interpretation |
| --- | :---: | ---: | --- |
| unchanged MOCPS | 11/20 | 3.829 px | the single-object selector confuses target and distractor |
| target oracle | 20/20 | 0.602 px | correct target selection fixes the result |
| distractor oracle | 4/20 | 8.856 px | selecting the wrong object gives bad target prediction |
| image two-component left slot | 20/20 | 0.602 px | a pixel-derived left-starting component is enough on this grid |
| best-of-two oracle | 20/20 | 0.601 px | diagnostic upper bound |

Interpretation: v0.6.1 was primarily an object binding / target selection failure. A simple image-derived two-component selector solves this specific stress test, but this is still a diagnostic result, not a claim of a finished multi-object model. The next step is a minimal trainable multi-object / slot-like MOCPS.

## v0.7, minimal two-slot MOCPS audit

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

## v0.7.1, Trainable two-slot assignment audit

v0.7.1 checked whether hard-coded left-slot assignment can be replaced by a tiny trainable head. The scorer was trained only from image-derived component pseudo-targets: the target was the component with the smaller observed initial x centroid. Generator positions were used only for oracle/eval/baseline.

| variant | result vs persistence | mean MAE | assignment |
| --- | :---: | ---: | ---: |
| fixed-left two-slot | 20/20 | 0.602 px | 1.000 |
| trainable two-slot | 20/20 | 0.602 px | 1.000 |
| random assignment | 10/20 | 4.609 px | 0.499 |
| unchanged MOCPS | 11/20 | 3.829 px | n/a |

Interpretation: a minimal trainable assignment head reproduces the fixed-left two-slot result on this checked world and preserves the h1/h2 fix (`10/10`). This is still a toy diagnostic: not full trainable Slot Attention, not a benchmark, and not a broad multi-object robustness claim.

## v0.8, Crossing-objects stress test

v0.8 tested trainable two-slot MOCPS on two similar moving objects that exchange left/right order. This is an identity stress test, not a benchmark.

| variant | result vs persistence | mean MAE | assignment before/after crossing |
| --- | :---: | ---: | ---: |
| fixed initial identity | 20/20 | 0.376 px | 1.000 / 1.000 |
| trainable two-slot | 10/20 | 5.523 px | 1.000 / 0.000 |
| current-left baseline | 10/20 | 5.523 px | 1.000 / 0.000 |
| target oracle | 20/20 | 0.376 px | 1.000 / 1.000 |

Interpretation: the feed-forward trainable assignment does not preserve identity after crossing. It behaves like the current-left heuristic: it works before the left/right swap, then selects the other object after the swap. The next step is memory or recurrent slot identity.

Caveat: this is still a toy diagnostic; not full trainable Slot Attention, not a benchmark, not SOTA, and not a claim about AGI, physics understanding, a general world model, or broad multi-object robustness.

## v0.8.1, Memory-slot identity audit

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

## v0.9, Occlusion memory-slot audit

v0.9 added short occlusion: two similar objects share the same y path and briefly merge into one visible blob. This separates simple memory from predictive memory.

| variant | result vs persistence | mean MAE | assignment after occlusion |
| --- | :---: | ---: | ---: |
| trainable two-slot | 15/20 | 3.768 px | 0.000 |
| nearest / velocity memory | 15/20 | 3.470 px | 0.000 |
| predictive occlusion memory | 20/20 | 0.422 px | 1.000 |
| target oracle | 20/20 | 0.422 px | 1.000 |

Interpretation: centroid continuity is enough while both components stay visible. It is not enough when the image merges two objects into one component. Predictive memory rolls the slot through the ambiguous observation and lowers confidence instead of pretending full certainty.

## v0.9.1, Learned recurrent occlusion gate

v0.9.1 replaced the hand-coded update/predict decision with a small learned gate. The gate was trained from image-derived pseudo-targets: whether the frame exposes enough components to trust the observation, or whether the state should be rolled forward from memory.

| variant | result vs persistence | mean MAE | assignment during/after occlusion |
| --- | :---: | ---: | ---: |
| frozen velocity memory | 15/20 | 3.470 px | 1.000 / 0.000 |
| predictive occlusion memory | 20/20 | 0.422 px | 1.000 / 1.000 |
| learned recurrent gate | 20/20 | 0.422 px | 1.000 / 1.000 |

Additional checks: identity switch rate `0.000`, gate final update accuracy `1.000`.

Interpretation: the learned gate reproduces the hand-coded predictive-memory behavior on this checked grid. This is a positive diagnostic result, not full trainable Slot Attention. The next test should add longer occlusion and acceleration.

## v0.9.2, Long-occlusion memory sweep

This sweep tested learned recurrent slot memory under longer occlusion windows: `1`, `2`, `3`, `4`, and `6` merged-observation frames.

Result: the learned recurrent gate and the hand-coded predictive memory both reached `20/20` at every checked length. Learned recurrent after-occlusion assignment was `1.000`, identity switch rate was `0.000`, and final confidence dropped from `0.539` at length `1` to `0.118` at length `6`.

Interpretation: on this constant-velocity toy diagnostic, no learned memory-horizon bottleneck appeared through length `6`. The next bottleneck looks more like confidence calibration or motion extrapolation under acceleration. Important caveat: frozen velocity memory can still show `20/20` against persistence while losing after-occlusion identity, so winrate alone is not enough.

Caveat: toy diagnostic only; not full trainable Slot Attention; not a benchmark, SOTA, AGI, physics understanding, or a general world model.

## v0.10, Acceleration-through-occlusion stress test

What changed: I tested learned recurrent slot memory when the hidden object changes velocity near or through occlusion.

Result: the learned recurrent gate stayed at `60/60` on `none_control`, `mild_accel`, and `strong_accel`, but under `strong_accel` after-occlusion assignment fell to `0.503` and identity switch rate rose to `0.391`. Under `direction_change`, the result fell to `30/60`, with after-occlusion assignment `0.774`.

Interpretation: acceleration exposes a motion-extrapolation / identity-binding bottleneck. Winrate against persistence is not enough: `strong_accel` still reports `60/60`, while often losing identity after reappearance. The next step is a learned acceleration-aware recurrent state.

Caveat: toy diagnostic only; not full trainable Slot Attention; not a benchmark, SOTA, AGI, physics understanding, or a general world model.

## v0.10.1, Acceleration-aware memory dynamics

What changed: I tested a small acceleration-aware recurrent state after v0.10 exposed failures under strong acceleration and direction change.

Result: the acceleration-aware variant did not fix the problem. It scored `55/60` on `none_control`, `55/60` on `mild_accel`, `60/60` on `strong_accel`, and `45/60` on `direction_change`. After-occlusion assignment was `0.738`, `0.806`, `0.685`, `0.483`, while identity switch rate rose to `0.493`, `0.416`, `0.501`, `0.702`.

Interpretation: simply adding a linear acceleration state is not enough. Confidence became more sensitive to motion mode, but identity binding after reappearance became less stable. The next step is a richer recurrent state or learned nonlinear dynamics.

Caveat: toy diagnostic only; not full trainable Slot Attention; not a benchmark, SOTA, AGI, physics understanding, or a general world model.

## v0.10.2, Dynamics arbitration memory audit

What changed: I tested whether safe fallback / arbitration can use acceleration only when image-derived evidence is strong enough, instead of always using an acceleration state.

Result: safe fallback preserved the `none_control` and `mild_accel` controls at `60/60`, with after-occlusion assignment `1.000` and identity switch rate `0.000`. On `strong_accel`, it improved after-occlusion assignment from `0.503` to `0.800` and reduced switch rate from `0.391` to `0.151`. `direction_change` is still not solved: winrate rose to `45/60`, but after-occlusion assignment fell to `0.718`, and switch rate rose to `0.428`. The diagnostic oracle selector shows remaining upside (`50/60`, after `0.924`, switch `0.111`) if the dynamics branch is selected correctly.

Interpretation: acceleration should be conditional, not always on. Safe fallback is a partial fix for `strong_accel`, but `direction_change` still needs a better dynamics selector or richer recurrent state.

Caveat: toy diagnostic only; not full trainable Slot Attention; not a benchmark, SOTA, AGI, physics understanding, or a general world model.

## v0.11, Noisy reappearance memory stress test

What changed: I tested whether safe-fallback memory survives noisy or misleading reappearance after occlusion.

Result: safe fallback reached `60/60` winrate in every checked noise mode. That does not mean identity binding was stable. `false_blob` reduced immediate assignment to `0.791`, recovery assignment to `0.659`, raised identity switch rate to `0.351`, and had false-component selection `0.276`. Controls, pixel noise, flicker, and distractor-bright reappearance kept recovery assignment `1.000` and switch rate `0.000`.

Interpretation: the next bottleneck is observation reliability / re-identification, not memory length or another simple dynamics term. Safe fallback needs an image-derived reliability head or lightweight appearance memory to reject transient false components.

Caveat: toy diagnostic only; not full trainable Slot Attention; not a benchmark, SOTA, AGI, physics understanding, a general world model, or broad noisy-reappearance robustness.

## v0.11.1, Observation reliability / appearance-memory audit

What changed: I tested whether image-derived reliability gating or lightweight appearance memory can reject transient false components after reappearance.

Result: the best practical variant, `handcrafted_reliability_gate`, kept `60/60` on `false_blob`, improved recovery assignment from `0.659` to `0.977`, reduced identity switch rate from `0.351` to `0.031`, and reduced false-component selection from `0.276` to `0.039`. Learned reliability and lightweight appearance memory also improved `false_blob` to recovery `0.977` and switch `0.031`. Controls, pixel noise, flicker, and distractor-bright reappearance stayed regression-free: recovery `1.000`, switch `0.000`.

Interpretation: false reappearance binding looks like an observation reliability / re-identification issue here, and simple image-derived features can reduce it sharply. Negative result: confidence still is not a good false-blob risk signal, because the best practical variant had confidence `0.695` on `false_blob`.

Caveat: toy diagnostic only; not full trainable Slot Attention; not a benchmark, SOTA, AGI, physics understanding, a general world model, or broad noisy-reappearance robustness.

## v0.12, Hard false-blob / appearance-ambiguity stress audit

What changed: I stress-tested reliability gating on harder false blobs that look more like distractors or targets: target-like brightness, target-like motion, near reappearance, persistent blobs, multi false blobs, and appearance swap after occlusion.

Result: on held-out hard modes, `learned_reliability_gate` improved identity metrics over `safe_fallback_base`: recovery assignment `0.969` vs `0.737`, identity switch rate `0.042` vs `0.250`, and false-component selection `0.115` vs `0.265`. Controls were preserved: recovery `1.000`, switch `0.000`.

Interpretation: this is a partial success, not solved re-identification. Reliability improves identity metrics on the checked hard modes, but easy `false_blob` in this reduced-sample run was weaker than v0.11.1 (`recovery 0.938`, `switch 0.083`). Confidence calibration remains a bottleneck: hard-mode confidence was slightly higher than controls.

Caveat: toy diagnostic only; local checked grid; not a benchmark; not broad robustness; not solved appearance memory or re-identification.

## v0.12.1, Reliability stability / sample-size audit

What changed: I rechecked the v0.12 easy `false_blob` weakness with larger targeted sampling (`4 x 16`, 960 samples per mode/variant for identity metrics), without adding a new architecture.

Result: the larger targeted sample rejected a stable regression. `learned_reliability_gate` on easy modes returned to recovery `0.980`, switch `0.026`, and false-component selection `0.028`. Controls stayed preserved: recovery `1.000`, switch `0.000`. Representative hard modes still improved identity metrics over `safe_fallback_base`: recovery `0.992` vs `0.748`, switch `0.010` vs `0.256`.

Interpretation: v0.12.1 preserves v0.11.1-level identity metrics on easy false blobs in this targeted audit and keeps the hard-mode improvement. Confidence/risk looks better than in the reduced-sample v0.12 run, but confidence calibration remains open. This remains a local toy diagnostic.

Caveat: not a benchmark; not broad robustness; not solved re-identification, appearance memory, or confidence calibration.

## v0.13, Confidence / risk calibration audit

v0.13 audits confidence/risk calibration for observation reliability. Image-derived reliability and disagreement risk signals identify many false-selection and identity-switch risks on the checked local grid, enabling conservative abstention without held-out threshold leakage.

This is still a toy diagnostic: it does not solve re-identification, appearance memory, confidence calibration, or broad noisy-reappearance robustness.

## v0.14, Risk-aware selective update policy audit

v0.14 tests risk-aware selective update policies for observation reliability. On the checked local
grid, image-derived risk helped choose `hold_previous_state`: held-out hard switch fell to `0.000`,
and false selection edged down versus the accept baseline, while controls stayed preserved.

This remains a toy diagnostic and does not solve re-identification, confidence calibration, or
broad noisy-reappearance robustness.

## v0.14.1, Hold-policy stress audit

v0.14.1 stress-tests the hold-based risk-aware update policy on a broader checked grid.
`hold_previous_state/conservative` kept hard-mode switch at `0.000` and reduced control
intervention cost to `0.090`, but it did not reach the `0.075` cost target and some mode-specific
false-selection issues remain.

This remains a toy diagnostic and does not solve re-identification, confidence calibration, or
broad noisy-reappearance robustness.

## v0.14.2, Hold-policy Pareto audit

v0.14.2 maps the threshold tradeoff for hold-based risk-aware updates. On the checked grid,
`hold_previous_state/conservative` remains the zero-switch candidate, but lower intervention cost
trades off against identity safety. The result remains a local toy diagnostic.

It does not solve re-identification, confidence calibration, or broad noisy-reappearance
robustness.

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

MOCPS now has a stable single-object result, and the slot-memory path survives constant-velocity occlusion. v0.10 showed an acceleration failure, v0.10.2 gave a partial safe-fallback fix, v0.11 exposed false-component re-binding, v0.11.1 sharply reduced that specific failure mode with image-derived reliability gating, v0.12 showed partial generalization to harder false blobs, v0.12.1 rejected the easy false-blob regression as stable under larger targeted sampling, v0.13 found useful image-derived risk signals without solving confidence calibration, v0.14 showed that `hold_previous_state` can improve checked hard-mode update behavior without held-out threshold leakage, v0.14.1 showed that control intervention cost still needs reduction, and v0.14.2 mapped the tradeoff between lower cost and identity safety. The strongest public base result is still the cold run: `200/200` against persistence on the covered surface.

This does not finish the research. It closes the first stable stage: there is now a recipe that works on the known worlds and baselines, so the next question is where it breaks.

## Direction

The next tests should be harder and less comfortable:

- moving distractor: the first checked version breaks current single-object MOCPS; the selection audit shows that correct target selection fixes the checked grid
- crossing objects: v0.8 breaks feed-forward trainable assignment after the left/right swap; v0.8.1 fixes the checked crossing case with slot memory
- short occlusion: v0.9 separates simple memory from predictive memory; v0.9.1 shows a learned gate on the checked grid
- broader stress for risk-aware update policies without tuning on held-out hard modes
- noisy background
- more than one moving object
- transfer between world variants

The nearest research direction is broader stress for `hold_previous_state` and lower control
intervention cost, without making a broad re-identification claim.

## What this does not mean

This is not a benchmark, not SOTA, not evidence of physics understanding, not a general world model, and not a claim that JEPA works. It is a small, explicitly limited diagnostic result.


## Result (May 2026): a phase diagram of object permanence

I revived this experiment and ran it with real rigor: a learned recurrent memory against fair baselines (constant-velocity extrapolation and a hand-coded predictive memory), on the task of keeping an object's identity through occlusion. Five seeds per cell, all on CPU.

Honestly first: **on plain position prediction the learned model gives nothing.** The trivial constant-velocity baseline is near-perfect (0.00 px on the no-bounce world). "Beats persistence" (222/222) is an illusion, because persistence assumes the object stands still, so it is a weak reference.

Value only appears under **occlusion**, when the observation stops being enough. I measure it as identity-assignment accuracy AFTER occlusion (0–1):

| regime | occlusion length | velocity (no memory) | hand-coded memory | learned |
| --- | :---: | :---: | :---: | :---: |
| none / mild acceleration | 2–6 | 0.00 | 1.00 | **1.00** |
| direction change while hidden | 4 | 0.18 | 0.33 | **1.00** |
| direction change while hidden | 6 | 0.00 | 0.50 | 0.57 |
| strong acceleration | 2 | 0.75 | 0.67 | **0.03** |
| strong acceleration | 4–6 | 0.00 | ~1.0 | 0.81–0.98 |

![Phase diagram of the learning advantage across acceleration modes and occlusion lengths](/mocps/fig1_phase.png)

*The phase diagram. Across the whole sweep, learning wins in exactly one cell (direction change, L=4, +0.67, outlined). Everywhere else it either ties the hand-coded memory (yellow, V≈0) or loses in the separation-limited corner (red).*

**The interesting part:** under a direction change while hidden (length 4) the learned memory reaches 1.00, while velocity extrapolation (0.18) and the hand-coded memory (0.33) both fail. This is the only place where learning beats both the physics and the structure: the model keeps the object's identity through a motion that simple extrapolation does not predict. That is what a world model means in miniature.

**An honest limit:** under strong acceleration and short occlusion (length 2) the learned gate breaks to 0.03, worse than the dumb baseline. With longer occlusion it recovers. I do not yet understand this non-monotonic break, and I am studying it. I show it, because a hidden failure corner is not science.

Reproduce on CPU: `python -m jepa_petri.run_accel_occlusion_memory_mocps --occlusion-lengths 2 4 6 --horizons 1 --seeds 0 1 2 3 4 --device cpu`


## The fix: a hold/predict arbitration

The hypothesis held. A variant with arbitration (decide: hold the last position under short occlusion, predict under long occlusion) closes the dip:

| strong acceleration | old gate | with arbitration | dynamics oracle |
| :---: | :---: | :---: | :---: |
| L=1 | 0.15 | **1.00** | 1.00 |
| L=2 | 0.03 | 0.55 | 0.75 |
| L=3 | 0.88 | 0.98 | 1.00 |

The most honest detail: under L=2 and strong acceleration, even the **oracle** (a model with perfect knowledge of the dynamics) only reaches 0.75. So the remaining gap is not the model's fault, it is the task's: the objects pass too close to be told apart. That is an irreducible limit, not a bug, and the arbitration gets close to that ceiling.

The full arc: I reproduced the result, mapped the phase diagram, found a repeatable failure, diagnosed its mechanism, fixed it, and showed how much of the rest cannot be fixed. To me that is what "proving it works" means: not a shout, a map.


## Two failure mechanisms (geometry)

I measured how close the objects pass at the reappearance frame (the separation margin). It cleanly separates two very different failures:

- **Separation-limited:** under strong acceleration and short occlusion the objects pass about 3 pixels apart. Correct assignment needs error below ~1.5 px. Even the oracle only reaches 0.75. No amount of learning fixes this, it is a limit of geometry.
- **Dynamics-limited:** under a direction change while hidden the separation is comfortable (~7.5 px), yet the baseline still fails (0.18) because it extrapolates the wrong direction. Here the learned model is right 100% of the time. This is the only place where learning genuinely beats physics.

Aggregated by separation, one threshold appears. Above about 6 px the learned state holds 0.96 accuracy on average against 0.14 for velocity (18 cells). In the four cells where the objects pass within about 3 px (roughly one diameter), the learned state drops to 0.40 and loses to the memoryless baseline (0.76). The threshold sits at the object scale, exactly where two identical blobs stop being resolvable: below it no dynamics model wins, and the cleverer predictor only adds variance.

![Two failure mechanisms: identity accuracy versus the separation margin](/mocps/fig2_mechanisms.png)

*The two mechanisms are geometric and separable. Left of the red band the objects pass too close to disambiguate (irreducible). The one point where a comfortable margin still defeats physics, direction change at L=4, is exactly where learning wins.*