---
layout: page
title: "MOCPS — Motion-Grounded Object-Centric Predictive State"
lang: en
pl_url: /mocps/
permalink: /en/mocps/
---

MOCPS is the v0.5 name for the promoted `signed_velocity_only` + predictor400 diagnostic recipe in a small procedural experiment family.

## One-line summary

A minimal recipe for testing whether motion-grounded object-centric state helps predictive latents beat a persistence baseline in tiny procedural worlds.

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

- diff-motion objectness selects the moving object
- the coordinate-aware token keeps spatial structure
- signed velocity from positive and negative frame differences adds direction
- predictor400 stabilizes the context-to-future path

## Cold reproducibility result

| metric | value |
| --- | --- |
| cold_run | true |
| reused_rows | false |
| result | 200/200 against persistence |
| mean MAE | 1.574 px |
| mean persistence MAE | 3.903 px |
| no_bounce_ball | 50/50 |
| bouncing_ball | 50/50 |
| moving_ball_distractors | 100/100 |
| h1 | 50/50 |
| h4 | 50/50 |
| h6 | 100/100 |

Requested world/horizon pairs outside the supported stability surface were explicitly omitted, not silently counted.

## What this does not mean

This is not a benchmark, not SOTA, not evidence of physics understanding, not a general world model, and not a claim that JEPA works. It is a small diagnostic result.

## Next step

Harder tests: moving distractor, crossing objects, occlusion, acceleration, noisy background.
