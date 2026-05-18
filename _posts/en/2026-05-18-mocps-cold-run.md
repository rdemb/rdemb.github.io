---
title: "MOCPS: cold run 200/200"
lang: en
kind: project
project: mocps
pl_url: /pl/2026/05/18/mocps-cold-run/
de_url: /de/2026/05/18/mocps-cold-run/
excerpt: "Cold reproducibility for MOCPS: the same recipe rerun from scratch, 200/200 against persistence on the checked diagnostic surface."
---

It is easy to overestimate an experiment. You can reuse a convenient table, pick a comfortable slice, or forget that one run was unusually good.

That is why this note is about a cold run: MOCPS rerun from scratch on the checked surface, without relying on earlier predictor400 audit rows.

Result:

- `cold_run: true`
- `reused_rows: false`
- result: `200/200` against persistence
- mean MAE: `1.574 px`
- mean persistence MAE: `3.903 px`
- failed rows: `0`
- rows worse than learned_diff: `0`

Persistence is the simple opponent here: it assumes the object will stay where it was last observed. If a predictive state cannot regularly beat that baseline, the rest of the description is not worth much.

This does not turn MOCPS into a benchmark or a broad world model. The useful part is smaller: the canonical command reproduces the result without a special reuse path. That gives the next harder tests a stable starting point.
