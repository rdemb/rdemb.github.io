---
layout: page
title: "MOCPS — Motion-Grounded Object-Centric Predictive State"
lang: en
pl_url: /mocps/
de_url: /de/mocps/
permalink: /en/mocps/
---

MOCPS is the v0.5 name for the promoted `signed_velocity_only` + predictor400 diagnostic recipe in a small procedural experiment family. It is not a large new architecture. It is a cleaned-up research recipe that came out of a long sequence of negative and positive tests.

## What it is

MOCPS means **Motion-Grounded Object-Centric Predictive State**. In practice, it is a small CPU-friendly diagnostic that tests whether a predictive latent state can:

- select the moving object from pixels,
- preserve its position in the representation,
- receive direction from image-derived signed velocity,
- predict the future state better than persistence.

Persistence is a strong simple baseline: it assumes the future position is the last observed position. MOCPS is only interesting when it consistently beats that baseline.

## Goal

The goal is not to claim a general world model. The goal is to answer one small question:

> when does a predictive latent actually carry useful object state, and when does it only look good because the baseline was weak?

That is why the experiments are small, local, and CPU-first. Every positive result is measured against simple baselines, not against narrative.

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

The latest test added a harder world: one moving target and one similarly bright moving distractor. The MOCPS architecture was not changed or tuned for this case.

The question was simple: can single-object MOCPS handle more than one moving object?

| horizon | result vs persistence | MOCPS MAE | persistence MAE | target mass | distractor mass |
| ---: | :---: | ---: | ---: | ---: | ---: |
| h1 | 0/5 | 4.177 px | 2.189 px | 0.168 | 0.333 |
| h2 | 1/5 | 3.497 px | 3.273 px | 0.219 | 0.239 |
| h4 | 5/5 | 3.769 px | 5.429 px | 0.262 | 0.280 |
| h6 | 5/5 | 3.873 px | 7.478 px | 0.268 | 0.287 |
| total | 11/20 | 3.829 px | 4.592 px | 0.229 | 0.285 |

Interpretation: the dynamic distractor breaks the current single-object MOCPS recipe. The likely failure mode is object selection: with two similarly bright moving objects, the objectness mass leans more toward the distractor than the target. This is a negative result and a useful next direction: multi-object / slot-like state.

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

MOCPS is now the canonical promoted learned diagnostic recipe for this small family of tests. The strongest public evidence is the cold run: `200/200` against persistence on the covered surface.

This does not finish the research. It closes the first stable stage: there is now a recipe that works on the known worlds and baselines, so the next question is where it breaks.

## Direction

The next tests should be harder and less comfortable:

- moving distractor: the first checked version breaks current single-object MOCPS
- crossing objects
- partial occlusion
- acceleration instead of constant velocity
- noisy background
- more than one moving object
- transfer between world variants

The nearest research direction is not further tuning of the same single-object recipe, but an audit of multi-object / slot-like state.

## What this does not mean

This is not a benchmark, not SOTA, not evidence of physics understanding, not a general world model, and not a claim that JEPA works. It is a small, explicitly limited diagnostic result.
