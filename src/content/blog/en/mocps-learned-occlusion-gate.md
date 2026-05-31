---
title: "MOCPS: learned occlusion gate"
lang: "en"
kind: "project"
date: "2026-05-19"
excerpt: "Short occlusion separated simple memory from predictive memory. A small learned gate reproduced the hand-coded predictive behavior on the checked grid."
key: "mocps-learned-occlusion-gate"
slug: "mocps-learned-occlusion-gate"
---
After the crossing-object test, the next question was simple: what happens when two similar objects not only cross, but briefly merge into one visible component?

That is harder than ordinary crossing. When both objects stay visible, centroid continuity is enough. During a short occlusion the observation becomes ambiguous: the model has to keep an identity hypothesis without full confirmation from the image.

Audit result:

- frozen nearest / velocity / learned memory: `15/20`
- frozen velocity assignment after occlusion: `0.000`
- hand-coded predictive occlusion memory: `20/20`
- learned recurrent occlusion gate: `20/20`
- learned gate assignment during occlusion: `1.000`
- learned gate assignment after occlusion: `1.000`
- identity switch rate: `0.000`
- gate final update accuracy: `1.000`

The conclusion is narrow but useful: ordinary component memory is not enough when the image briefly collapses two objects into one. The state needs to roll the slot forward when the observation is not uniquely bindable. A small learned gate learned that decision from image-derived pseudo-targets: when to trust the observation, and when to predict the state from memory.

This is still not full trainable Slot Attention. The gate sits on top of the existing image-derived slot state and learned memory scorer. I am not claiming broad occlusion robustness. The next test should be less comfortable: longer occlusion and acceleration, where constant velocity is no longer an easy assumption.
