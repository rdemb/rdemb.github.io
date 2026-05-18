---
title: "MOCPS: cold run 200/200"
lang: en
kind: project
project: mocps
pl_url: /pl/2026/05/18/mocps-cold-run/
de_url: /de/2026/05/18/mocps-cold-run/
excerpt: "Cold reproducibility for MOCPS: 200/200 against persistence on the covered diagnostic surface."
---

MOCPS now has cold-run evidence without relying on reused predictor400 audit rows.

Short version:

- `cold_run: true`
- `reused_rows: false`
- result: `200/200` against persistence
- mean MAE: `1.574 px`
- mean persistence MAE: `3.903 px`
- failed rows: `0`
- rows worse than learned_diff: `0`

This is still a small diagnostic in procedural worlds, not a benchmark and not a broad claim. The important part is that the canonical command reproduces the covered result without a special reuse path.
