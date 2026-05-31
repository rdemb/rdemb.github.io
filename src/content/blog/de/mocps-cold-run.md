---
title: "MOCPS: Cold Run 200/200"
lang: "de"
kind: "project"
date: "2026-05-18"
excerpt: "Cold Reproducibility für MOCPS: dasselbe Rezept von null neu gestartet, 200/200 gegen Persistenz auf der geprüften diagnostischen Fläche."
key: "mocps-cold-run"
slug: "mocps-cold-run"
---
Man kann ein Experiment leicht überschätzen. Man nutzt eine bequeme Tabelle, wählt einen angenehmen Ausschnitt oder vergisst, dass ein Run ungewöhnlich gut war.

Deshalb geht es hier um einen Cold Run: MOCPS von null auf der geprüften Fläche neu gestartet, ohne frühere predictor400-Audit-Zeilen wiederzuverwenden.

Ergebnis:

- `cold_run: true`
- `reused_rows: false`
- Ergebnis: `200/200` gegen Persistenz
- mean MAE: `1.574 px`
- mean persistence MAE: `3.903 px`
- failed rows: `0`
- rows worse than learned_diff: `0`

Persistenz ist hier der einfache Gegner: Sie nimmt an, dass das Objekt dort bleibt, wo es zuletzt beobachtet wurde. Wenn ein prädiktiver Zustand diesen Baseline nicht regelmäßig schlägt, ist der Rest der Beschreibung wenig wert.

Das macht MOCPS nicht zu einem Benchmark und nicht zu einem breiten World Model. Der nützliche Punkt ist kleiner: Der kanonische Befehl reproduziert das Ergebnis ohne speziellen Wiederverwendungspfad. Damit haben die nächsten härteren Tests einen stabilen Ausgangspunkt.
