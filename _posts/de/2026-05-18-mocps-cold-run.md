---
title: "MOCPS: Cold Run 200/200"
lang: de
kind: project
project: mocps
pl_url: /pl/2026/05/18/mocps-cold-run/
en_url: /en/2026/05/18/mocps-cold-run/
excerpt: "Cold Reproducibility für MOCPS: 200/200 gegen Persistenz auf der abgedeckten diagnostischen Fläche."
---

MOCPS hat jetzt Cold-Run-Evidence ohne Wiederverwendung früherer predictor400-Audit-Zeilen.

Kurzfassung:

- `cold_run: true`
- `reused_rows: false`
- Ergebnis: `200/200` gegen Persistenz
- mean MAE: `1.574 px`
- mean persistence MAE: `3.903 px`
- failed rows: `0`
- rows worse than learned_diff: `0`

Das ist weiterhin eine kleine Diagnostik in prozeduralen Welten, kein Benchmark und keine breite Behauptung. Wichtig ist, dass der kanonische Befehl das abgedeckte Ergebnis ohne spezielle Wiederverwendung reproduziert.
