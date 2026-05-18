---
layout: page
title: "MOCPS evidence chain"
description: "Compact MOCPS evidence summary."
permalink: /research/mocps-evidence/
---

A compact public summary of the diagnostic path that led to MOCPS.

| step | result | interpretation |
| --- | --- | --- |
| latent MSE JEPA | failed | Plain predicted-latent MSE did not beat simple baselines. |
| temporal contrastive | predicted path failed | Target latents improved partly, but the predicted future path remained weak. |
| temporal delta | failed | Delta consistency alone did not provide enough pressure. |
| object-state pretext | first positive diagnostic | Pixel-derived object state created useful object-centric latents in the toy setting. |
| soft object token | failed | A learned soft object token did not recover the hand-designed object-state advantage. |
| coordinate-aware brightness | works in clean worlds | Coordinate basis plus brightness objectness was useful, but brittle. |
| objectness stress | motion beats brightness under distractors | Static bright distractors break brightness objectness; frame motion is more reliable. |
| learned diff-motion objectness | strong but not perfect | Explicit frame-difference input lets a learned head recover motion-grounded selection. |
| signed residual | 60/60 | Adding signed pixel-motion state as residual input fixed the measured cross-world grid. |
| signed velocity ablation | strongest minimal signed component | Velocity-only signed residual had the best learned mean MAE in the ablation. |
| predictor400 | stabilized remaining path variance | More predictor steps fixed the remaining repeated-seed instability. |
| MOCPS cold run | 200/200 | Canonical reproducible evidence for the covered diagnostic surface. |

The v0.5.1 cold run reproduced the covered MOCPS result with reuse disabled: **200/200**, mean MAE **1.574 px**, mean persistence MAE **3.903 px**, failed rows **0**, and rows worse than learned_diff **0**.

This is a toy diagnostic result. It is not a benchmark, not SOTA, not evidence of physics understanding, and not a broad world-modeling claim.
