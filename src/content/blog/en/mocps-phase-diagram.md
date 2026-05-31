---
title: "I revived my ML experiment and looked for where it breaks"
lang: "en"
kind: "project"
date: "2026-05-31"
excerpt: "An old project about predicting an object's motion. I brought it back after months and asked it the hardest question I could."
key: "mocps-phase-diagram"
slug: "mocps-phase-diagram"
---

I have a small research project, MOCPS. It asks one narrow thing: can a tiny learned model keep an object "in mind" when it disappears behind something and comes back. Object permanence, the same thing a one-year-old learns.

After months I returned to the code, set up the environment, and ran it again. First I did something that ruins many proud results: I added **fair baselines**.

## The first truth hurts

My model "beats persistence" in 222 cases out of 222. It sounds great until you ask: what about a dumber baseline? It turned out that a trivial "assume constant velocity" is near-perfect, and my model does worse against it. So "beats persistence" meant nothing. Persistence assumes the object stands still, so it is fortune-telling for the naive.

## Where it starts to matter

Value only appears where the observation itself stops being enough: under **occlusion**. When the object disappears, the velocity baseline loses its identity on return. The learned memory keeps it perfectly. That was predictable, but a hand-coded memory did just as well, so structure was winning, not learning.

Then I reached the hardest case: the object **changes direction while it is hidden**. Here velocity fails, the hand-coded memory fails, and the **learned one is right 100% of the time**. This is the only place where learning beats both the physics and the structure. The little model learned something about dynamics that simple extrapolation cannot do.

## And here it breaks

I will not tell you everything works, because it does not. Under strong acceleration and short occlusion the learned memory **breaks** to 3% accuracy, worse than the dumb baseline. With longer occlusion it is fine again. I do not yet understand this strange, non-monotonic break.

And that is exactly why I am writing about it. A result that hides its failure corner is not science, it is advertising. I have a clean, CPU-reproducible diagram of when a learned predictive state gives object permanence and when it falls apart. This is not a "breakthrough". It is an honest map, and honest maps are what you build something real on.
