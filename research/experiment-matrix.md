---
layout: page
title: "Compact experiment matrix"
description: "Compressed public experiment matrix."
permalink: /research/experiment-matrix/
---

A compressed public version of the internal matrix. It keeps the failures visible.

| experiment | outcome | why it mattered |
| --- | --- | --- |
| latent MSE JEPA | failed | Predicted latents did not beat fair baselines. |
| temporal contrastive | predicted path failed | Improving target latents was not enough. |
| temporal delta | failed | Delta-only pressure was too weak. |
| object-state pretext | first positive diagnostic | Image-derived object state gave a useful representation path. |
| soft object token | failed | Learned objectness was not automatic. |
| coordinate-aware brightness | worked in clean worlds | Coordinates helped, but brightness was not robust. |
| objectness stress | motion beat brightness under distractors | Motion-derived objectness handled static bright distractors. |
| learned diff-motion objectness | strong but not perfect | Explicit frame differences recovered much of the motion signal. |
| signed residual | 60/60 | Signed pixel-motion residual improved the learned diff path. |
| signed velocity ablation | strongest minimal signed component | Velocity-only was the best learned signed residual input. |
| predictor400 | stabilized remaining path variance | More predictor training fixed the one repeated-seed instability. |
| MOCPS cold run | 200/200 | Canonical reproducible evidence on the covered diagnostic surface. |
