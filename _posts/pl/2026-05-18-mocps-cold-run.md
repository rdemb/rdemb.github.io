---
title: "MOCPS: cold run 200/200"
lang: pl
kind: project
project: mocps
en_url: /en/2026/05/18/mocps-cold-run/
de_url: /de/2026/05/18/mocps-cold-run/
excerpt: "Cold reproducibility dla MOCPS: 200/200 przeciw persystencji na pokrytej powierzchni diagnostycznej."
---

MOCPS ma teraz cold-run evidence bez korzystania z wcześniejszych wierszy audytu predictor400.

Najkrócej:

- `cold_run: true`
- `reused_rows: false`
- wynik: `200/200` przeciw persystencji
- mean MAE: `1.574 px`
- mean persistence MAE: `3.903 px`
- failed rows: `0`
- rows worse than learned_diff: `0`

To nadal jest mały diagnostyk w proceduralnych światach, nie benchmark i nie szeroki claim. Dla mnie najważniejsze jest to, że kanoniczna komenda odtwarza wynik bez specjalnego reuse ścieżek z poprzedniego audytu.
