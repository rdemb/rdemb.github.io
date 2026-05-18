---
layout: project
title: "MOCPS — Motion-Grounded Object-Centric Predictive State"
description: "A tiny CPU-friendly diagnostic for motion-grounded object-centric predictive state."
permalink: /projects/mocps/
---

## One-line summary

A minimal diagnostic recipe for testing whether motion-grounded object-centric state can support predictive latent dynamics better than persistence in tiny procedural worlds.

## Problem

Plain latent prediction failed repeatedly in the toy lab:

- latent MSE JEPA-style path failed
- temporal contrastive predicted path failed
- temporal delta failed
- soft object token failed
- weak latents could not be rescued by predictor objectives

## Core idea

MOCPS separates the problem into:

1. objectness: what is the moving object?
2. coordinate-aware token: where is it?
3. signed velocity: which direction is it moving?
4. residual predictor: how does the object-centric state transition?

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

Diff-motion objectness selects the moving object. The coordinate-aware token keeps spatial structure. Signed velocity from positive and negative frame differences adds local direction. The predictor400 recipe stabilizes the context-to-future path.

## Current result

| metric | value |
| --- | --- |
| cold_run | true |
| reused_rows | false |
| rows | 200/200 against persistence |
| mean MAE | 1.574 px |
| mean persistence MAE | 3.903 px |
| no_bounce_ball | 50/50 |
| bouncing_ball | 50/50 |
| moving_ball_distractors | 100/100 |
| h1 | 50/50 |
| h4 | 50/50 |
| h6 | 100/100 |

Requested world/horizon pairs outside the supported stability surface were explicitly omitted, not silently counted.

## What was learned

- objectness is not automatic
- brightness can fail under static bright distractors
- motion is a useful objectness signal
- learned diff-motion objectness needs explicit frame-difference input
- signed velocity is the strongest signed residual component
- the analytic signed-motion baseline alone failed, so signed state alone is not sufficient
- the learned token path still matters

## What this is not

- not a benchmark
- not SOTA
- not evidence of physics understanding
- not a claim that JEPA works
- not a general world model
- not related to trading, finance, crypto, or market prediction

## Next research step

Hard-world stress tests: moving distractor, crossing objects, occlusion, acceleration, and noisy background.
