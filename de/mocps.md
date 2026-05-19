---
layout: page
title: "MOCPS — Motion-Grounded Object-Centric Predictive State"
lang: de
pl_url: /mocps/
en_url: /en/mocps/
permalink: /de/mocps/
---

MOCPS ist ein kleines Forschungsprojekt zur Vorhersage von Objektbewegung in einfachen Pixelwelten. Die Frage ist eng: Kann eine aus Bildern extrahierte Repräsentation eine zukünftige Position besser vorhersagen als die letzte bekannte Position?

Technisch ist die aktuelle Version das Rezept `signed_velocity_only` + predictor400. Es ist keine große neue Architektur, sondern ein enger reproduzierbarer Test, der aus einer Reihe negativer und positiver Ergebnisse entstanden ist.

## Was es ist

MOCPS bedeutet **Motion-Grounded Object-Centric Predictive State**. Praktisch ist es eine kleine CPU-freundliche Diagnostik, die prüft, ob ein prädiktiver latenter Zustand:

- das bewegte Objekt aus Pixeln auswählt,
- seine Position in der Repräsentation erhält,
- Richtung über bildabgeleitete signed velocity bekommt,
- den zukünftigen Zustand besser vorhersagt als Persistenz.

Persistenz ist ein starker einfacher Baseline: die zukünftige Position ist die letzte bekannte Position. MOCPS ist nur interessant, wenn es diesen Baseline konsequent schlägt.

## Ziel

Das Ziel ist nicht, einen allgemeinen World Model zu behaupten. Das Ziel ist eine kleine Frage:

> wann trägt ein prädiktiver Latent wirklich nützlichen Objektzustand, und wann entsteht das Ergebnis nur durch einen schwachen Baseline?

Deshalb sind die Experimente klein, lokal und CPU-first. Positive Ergebnisse werden gegen einfache Baselines gemessen, nicht nach Beschreibung bewertet.

## Mechanismus

```text
frames t,t+1
  -> diff-motion objectness
  -> coordinate-aware object token
  -> signed velocity residual
  -> predictor400
  -> predicted future state
  -> probe/eval only
```

- **Diff-motion objectness**: die Objectness-Komponente bekommt explizite Frame-Differenzen und kann Bewegung statt nur Helligkeit nutzen.
- **Coordinate-aware object token**: der Token behält räumliche Struktur.
- **Signed velocity residual**: Richtung kommt aus positiven und negativen Pixeldifferenzen, ohne Generator-Labels im Encoder- oder Predictor-Training.
- **Predictor400**: ein stabileres Rezept für das Training des latenten Predictors.

## Hauptresultat

<div class="metric-grid">
  <div class="metric"><strong>200/200</strong><span>cold run vs persistence</span></div>
  <div class="metric"><strong>1.574 px</strong><span>mean MAE</span></div>
  <div class="metric"><strong>3.903 px</strong><span>persistence MAE</span></div>
  <div class="metric"><strong>0</strong><span>failed rows</span></div>
</div>

| Gruppe | Ergebnis | mean MAE | persistence MAE |
| --- | ---: | ---: | ---: |
| total covered surface | 200/200 | 1.574 px | 3.903 px |
| no_bounce_ball | 50/50 | 0.845 px | 1.444 px |
| bouncing_ball | 50/50 | 2.292 px | 5.504 px |
| moving_ball_distractors | 100/100 | 1.579 px | 4.332 px |
| horizon 1 | 50/50 | 0.845 px | 1.444 px |
| horizon 4 | 50/50 | 1.354 px | 3.610 px |
| horizon 6 | 100/100 | 2.048 px | 5.279 px |

Das Resultat stammt aus dem Cold-Reproducibility-Run:

- `cold_run: true`
- `reused_rows: false`
- `failed rows: 0`
- `rows worse than learned_diff: 0`
- runtime: `13260.8 s`

Angefragte world/horizon-Paare außerhalb der unterstützten Stabilitätsfläche wurden explizit ausgelassen, nicht still mitgezählt.

## v0.6.1 — dynamic moving-distractor stress test

Dieser Test fügte eine schwierigere Welt hinzu: ein bewegtes Target und ein ähnlich heller bewegter Distraktor. Die MOCPS-Architektur wurde für diesen Fall nicht geändert und nicht darauf optimiert.

Die Frage war einfach: kann single-object MOCPS mehr als ein bewegtes Objekt handhaben?

| Horizont | Ergebnis vs persistence | MOCPS MAE | persistence MAE | target mass | distractor mass |
| ---: | :---: | ---: | ---: | ---: | ---: |
| h1 | 0/5 | 4.177 px | 2.189 px | 0.168 | 0.333 |
| h2 | 1/5 | 3.497 px | 3.273 px | 0.219 | 0.239 |
| h4 | 5/5 | 3.769 px | 5.429 px | 0.262 | 0.280 |
| h6 | 5/5 | 3.873 px | 7.478 px | 0.268 | 0.287 |
| total | 11/20 | 3.829 px | 4.592 px | 0.229 | 0.285 |

Interpretation: der dynamische Distraktor bricht das aktuelle single-object MOCPS-Rezept. Der wahrscheinlichste Fehlermodus ist object selection: bei zwei ähnlich hellen bewegten Objekten liegt die Objectness-Masse stärker beim Distraktor als beim Target. Das ist ein negatives Ergebnis und ein nützlicher nächster Schritt: multi-object / slot-like state.

## v0.6.2 — dynamic-distractor selection audit

Der nächste Audit prüfte, ob der v0.6.1-Fehler verschwindet, wenn das Target korrekt ausgewählt wird. Das war ein diagnostischer Test, keine neue Architektur.

| Variante | Ergebnis vs persistence | mean MAE | Interpretation |
| --- | :---: | ---: | --- |
| unchanged MOCPS | 11/20 | 3.829 px | der single-object Selector verwechselt Target und Distraktor |
| target oracle | 20/20 | 0.602 px | korrekte Target-Auswahl repariert das Ergebnis |
| distractor oracle | 4/20 | 8.856 px | das falsche Objekt ergibt schlechte Target-Prediction |
| image two-component left slot | 20/20 | 0.602 px | eine pixel-derived left-starting Komponente reicht in diesem Grid |
| best-of-two oracle | 20/20 | 0.601 px | diagnostische obere Grenze |

Interpretation: v0.6.1 war primär ein object-binding / target-selection Fehler. Ein einfacher image-derived two-component Selector löst diesen konkreten Stress-Test, aber das ist weiter nur ein diagnostisches Ergebnis, keine Behauptung eines fertigen Multi-Object-Modells. Der nächste Schritt ist ein minimal trainierbares multi-object / slot-like MOCPS.

## v0.7 — minimaler two-slot MOCPS Audit

v0.7 machte aus der v0.6.2-Diagnostik eine reproduzierbare minimale two-slot Pipeline. Das ist weiterhin kein vollständig trainierbares Slot Attention. Die Slots werden aus image-derived motion components extrahiert, und das Target in dieser Welt ist die links startende Komponente.

| Variante | Ergebnis vs persistence | mean MAE | Interpretation |
| --- | :---: | ---: | --- |
| single-object MOCPS | 11/20 | 3.829 px | der v0.6.1-Baseline bindet das Target weiterhin nicht stabil |
| image two-component left slot | 20/20 | 0.602 px | der pixel-derived diagnostische Selector funktioniert in diesem Grid |
| two-slot MOCPS | 20/20 | 0.602 px | die minimale two-slot Pipeline reproduziert das diagnostische Ergebnis |
| target oracle | 20/20 | 0.602 px | korrekte Target-Auswahl reicht hier aus |
| distractor oracle | 4/20 | 8.856 px | Auswahl des falschen Objekts bricht die Target-Prediction |

Die kurzen Horizonte h1/h2 verbesserten sich von `1/10` in single-object MOCPS auf `10/10` in two-slot MOCPS, mit assignment accuracy `1.000`.

Interpretation: auf diesem geprüften dynamic-distractor Grid repariert expliziter two-object state den single-object MOCPS-Fehler. Das ist ein positives diagnostisches Ergebnis, aber keine Behauptung allgemeiner Multi-Object-Robustheit und kein fertiges trainierbares Slot-Modell. Der nächste Schritt ist trainable slot assignment, danach crossing objects, occlusion, acceleration und noisy backgrounds.

## v0.7.1 — Trainable two-slot assignment audit

v0.7.1 prüfte, ob die hard-coded left-slot assignment durch einen kleinen trainierbaren Kopf ersetzt werden kann. Der Scorer wurde nur mit image-derived component pseudo-targets trainiert: Target war die Komponente mit dem kleineren beobachteten initialen x-Zentroid. Generator-Positionen wurden nur für Oracle/Eval/Baseline verwendet.

| Variante | Ergebnis vs persistence | mean MAE | assignment |
| --- | :---: | ---: | ---: |
| fixed-left two-slot | 20/20 | 0.602 px | 1.000 |
| trainable two-slot | 20/20 | 0.602 px | 1.000 |
| random assignment | 10/20 | 4.609 px | 0.499 |
| unchanged MOCPS | 11/20 | 3.829 px | n/a |

Interpretation: ein minimaler trainierbarer Assignment-Kopf reproduziert das fixed-left two-slot Ergebnis auf dieser geprüften Welt und erhält den h1/h2-Fix (`10/10`). Das bleibt eine Toy-Diagnostik: kein vollständiges trainable Slot Attention, kein Benchmark und keine breite Multi-Object-Robustheitsbehauptung.

## v0.8 — Crossing-objects stress test

v0.8 testete trainable two-slot MOCPS mit zwei ähnlichen bewegten Objekten, die ihre left/right-Reihenfolge tauschen. Das ist ein Identitäts-Stresstest, kein Benchmark.

| Variante | Ergebnis vs persistence | mean MAE | assignment vor/nach crossing |
| --- | :---: | ---: | ---: |
| fixed initial identity | 20/20 | 0.376 px | 1.000 / 1.000 |
| trainable two-slot | 10/20 | 5.523 px | 1.000 / 0.000 |
| current-left baseline | 10/20 | 5.523 px | 1.000 / 0.000 |
| target oracle | 20/20 | 0.376 px | 1.000 / 1.000 |

Interpretation: das feed-forward trainable assignment erhält die Identität nach dem Crossing nicht. Es verhält sich wie die current-left Heuristik: vor dem left/right-Tausch funktioniert es, danach wählt es das andere Objekt. Der nächste Schritt ist Memory oder recurrent slot identity.

Einschränkung: Das bleibt eine Toy-Diagnostik; kein vollständiges trainable Slot Attention, kein Benchmark, kein SOTA und keine Behauptung zu AGI, Physikverständnis, einem allgemeinen World Model oder breiter Multi-Object-Robustheit.

## v0.8.1 — Memory-slot identity audit

v0.8.1 prüfte, ob einfache Slot-Memory dort reicht, wo feed-forward assignment beim Crossing bricht. Der Slot startet mit der image-derived links startenden Komponente und nutzt danach nur beobachtete Komponenten-Historie: vorherigen Zentroid, Geschwindigkeit und Masse.

| Variante | Ergebnis vs persistence | mean MAE | assignment nach crossing |
| --- | :---: | ---: | ---: |
| trainable two-slot | 10/20 | 5.586 px | 0.000 |
| current-left baseline | 10/20 | 5.586 px | 0.000 |
| nearest memory | 20/20 | 0.423 px | 1.000 |
| velocity memory | 20/20 | 0.423 px | 1.000 |
| learned memory scorer | 20/20 | 0.423 px | 1.000 |
| target oracle | 20/20 | 0.423 px | 1.000 |

Interpretation: in dieser geprüften Toy-Welt war der v0.8-Fehler ein Identitäts-Memory-Fehler, kein Trajektorien-Prediction-Fehler. Die einfachste Zentroid-Kontinuität reichte; Velocity-Memory und der kleine learned scorer verbesserten nearest memory nicht.

Einschränkung: Das bleibt eine Diagnostik. Es ist kein vollständiges trainable Slot Attention, kein Benchmark, kein SOTA, kein AGI, kein Physikverständnis, kein allgemeines World Model und keine breite Multi-Object-Robustheit.

## v0.9 — Occlusion memory-slot audit

v0.9 fügte kurze Okklusion hinzu: Zwei ähnliche Objekte teilen denselben y-Pfad und verschmelzen kurz zu einem sichtbaren Blob. Das trennt einfache Memory von prädiktiver Memory.

| Variante | Ergebnis vs persistence | mean MAE | assignment nach Okklusion |
| --- | :---: | ---: | ---: |
| trainable two-slot | 15/20 | 3.768 px | 0.000 |
| nearest / velocity memory | 15/20 | 3.470 px | 0.000 |
| predictive occlusion memory | 20/20 | 0.422 px | 1.000 |
| target oracle | 20/20 | 0.422 px | 1.000 |

Interpretation: Zentroid-Kontinuität reicht, solange beide Komponenten sichtbar bleiben. Sie reicht nicht, wenn das Bild zwei Objekte in eine Komponente verschmilzt. Predictive Memory rollt den Slot durch die mehrdeutige Beobachtung und senkt die Confidence, statt volle Sicherheit vorzutäuschen.

## v0.9.1 — Learned recurrent occlusion gate

v0.9.1 ersetzte die handcodierte update/predict-Entscheidung durch ein kleines learned Gate. Das Gate wurde mit image-derived Pseudo-Targets trainiert: ob die Frame genug Komponenten zeigt, um der Beobachtung zu vertrauen, oder ob der Zustand aus Memory weitergerollt werden soll.

| Variante | Ergebnis vs persistence | mean MAE | assignment während/nach Okklusion |
| --- | :---: | ---: | ---: |
| frozen velocity memory | 15/20 | 3.470 px | 1.000 / 0.000 |
| predictive occlusion memory | 20/20 | 0.422 px | 1.000 / 1.000 |
| learned recurrent gate | 20/20 | 0.422 px | 1.000 / 1.000 |

Zusätzliche Checks: identity switch rate `0.000`, gate final update accuracy `1.000`.

Interpretation: Das learned Gate reproduziert das handcodierte predictive-memory-Verhalten auf diesem geprüften Grid. Das ist ein positives diagnostisches Ergebnis, kein vollständiges trainable Slot Attention. Der nächste Test sollte längere Okklusion und Beschleunigung hinzufügen.

## v0.9.2 — Long-occlusion memory sweep

Dieser Sweep testete learned recurrent slot memory mit längeren Okklusionsfenstern: `1`, `2`, `3`, `4` und `6` Frames merged observation.

Ergebnis: Das learned recurrent Gate und die handcodierte predictive memory erreichten beide `20/20` bei jeder geprüften Länge. Learned recurrent after-occlusion assignment war `1.000`, identity switch rate war `0.000`, und final confidence fiel von `0.539` bei Länge `1` auf `0.118` bei Länge `6`.

Interpretation: In dieser Constant-Velocity-Toy-Diagnostik zeigte sich bis Länge `6` kein learned memory-horizon Bottleneck. Der nächste Bottleneck wirkt eher wie confidence calibration oder motion extrapolation unter Beschleunigung. Wichtige Einschränkung: frozen velocity memory kann weiter `20/20` gegen persistence zeigen und trotzdem after-occlusion identity verlieren; winrate allein reicht also nicht.

Einschränkung: nur Toy-Diagnostik; kein vollständiges trainable Slot Attention; kein Benchmark, SOTA, AGI, Physikverständnis oder allgemeines World Model.

## v0.10 — Acceleration-through-occlusion stress test

Was sich geändert hat: Ich habe learned recurrent slot memory getestet, wenn das verdeckte Objekt nahe an oder während der Okklusion seine Geschwindigkeit ändert.

Ergebnis: Das learned recurrent Gate blieb bei `60/60` für `none_control`, `mild_accel` und `strong_accel`, aber bei `strong_accel` fiel after-occlusion assignment auf `0.503`, und identity switch rate stieg auf `0.391`. Bei `direction_change` fiel das Ergebnis auf `30/60`, mit after-occlusion assignment `0.774`.

Interpretation: Beschleunigung zeigt einen Bottleneck in motion extrapolation / identity binding. Winrate gegen persistence reicht nicht: `strong_accel` bleibt bei `60/60`, verliert aber oft die Identität nach dem Wiederauftauchen. Der nächste Schritt ist ein learned acceleration-aware recurrent state.

Einschränkung: nur Toy-Diagnostik; kein vollständiges trainable Slot Attention; kein Benchmark, SOTA, AGI, Physikverständnis oder allgemeines World Model.

## Baselines und Referenzen

| Variante | Ergebnis / Beobachtung | Bedeutung |
| --- | --- | --- |
| persistence | mean MAE 3.903 px | einfacher Baseline: Zukunft = letzte bekannte Position |
| motion_coord | 200/200, mean MAE 1.966 px | starke handdefinierte motion-objectness Referenz |
| learned_diff | 200/200, mean MAE 2.443 px | learned diff-motion Token ohne das promovierte MOCPS-Rezept |
| MOCPS | 200/200, mean MAE 1.574 px | aktuelles promoviertes learned diagnostic recipe |
| analytic signed-motion baseline | 0/60 in der Ablation | signed pixel state allein war nicht genug |

Die wichtigste Interpretation: signed velocity hilft, ersetzt aber nicht den learned token path. Der analytische signed-motion Baseline scheiterte allein. MOCPS funktioniert als Kombination aus object-centric token, signed velocity residual und stabilisiertem Predictor-Training.

## Rechenumgebung

Die Experimente sind CPU-first. Der letzte Cold-Reproducibility-Run lief lokal auf:

- CPU: `AMD EPYC-Milan Processor`
- Umgebung: KVM / QEMU
- 12 vCPU
- 6 Kerne / 12 Threads
- L3 Cache: 32 MiB

Das ist Absicht: eine kleine Diagnostik sollte ohne GPU-Cluster und ohne schweren MLOps-Stack laufen.

## Der Weg zu MOCPS

<div class="timeline">
  <div class="timeline-item">
    <h3>1. Plain latent prediction</h3>
    <p>Latent MSE, temporal contrastive und temporal delta schlugen faire Baselines im predicted-latent path nicht. Das war das erste wichtige negative Ergebnis.</p>
  </div>
  <div class="timeline-item">
    <h3>2. Object-state pretext</h3>
    <p>Das erste positive Signal kam, als die Repräsentation Druck in Richtung pixel-derived object state bekam. Repräsentationsqualität war also genauso wichtig wie der Predictor.</p>
  </div>
  <div class="timeline-item">
    <h3>3. Coordinate-aware tokens</h3>
    <p>Explizite Koordinatenstruktur half in sauberen Welten. Brightness objectness brach jedoch bei statischen hellen Distraktoren.</p>
  </div>
  <div class="timeline-item">
    <h3>4. Motion objectness</h3>
    <p>Motion-derived objectness war robuster gegen statische Distraktoren. Dadurch verschob sich das Projekt zu motion-grounded object selection.</p>
  </div>
  <div class="timeline-item">
    <h3>5. Learned diff-motion objectness</h3>
    <p>Learned objectness begann erst mit explizitem frame-difference input zu funktionieren. Es war stark, aber noch nicht perfekt.</p>
  </div>
  <div class="timeline-item">
    <h3>6. Signed residual</h3>
    <p>Positive und negative Frame-Differenzen brachten Richtung. Die Ablation zeigte, dass signed velocity die stärkste minimale signed component war.</p>
  </div>
  <div class="timeline-item">
    <h3>7. Stability forensics</h3>
    <p>Der einzige instabile signed_velocity_only-Fall wurde als Predictor-Trainingsvarianz diagnostiziert, nicht als Probe-Varianz oder Evaluationsartefakt.</p>
  </div>
  <div class="timeline-item">
    <h3>8. Predictor400</h3>
    <p>Mehr Predictor-Training entfernte die restliche Instabilität: predictor400 erreichte 210/210 im Stabilitätsaudit und 200/200 im cold MOCPS run.</p>
  </div>
</div>

## Aktueller Stand

MOCPS hat jetzt ein stabiles Single-Object-Ergebnis, und der Slot-Memory-Pfad übersteht Constant-Velocity-Okklusion, aber v0.10 zeigt einen Fehler unter Beschleunigung. Das stärkste öffentliche Basisergebnis bleibt der Cold Run: `200/200` gegen Persistenz auf der abgedeckten Fläche.

Das beendet die Forschung nicht. Es schließt nur die erste stabile Etappe ab: ein Rezept funktioniert auf den bekannten Welten und Baselines; die nächste Frage ist, wo es bricht.

## Richtung

Die nächsten Tests sollten schwieriger und unbequemer sein:

- moving distractor: die erste geprüfte Version bricht das aktuelle single-object MOCPS; der Selection Audit zeigt, dass korrekte Target-Auswahl das geprüfte Grid repariert
- crossing objects: v0.8 bricht feed-forward trainable assignment nach dem left/right-Tausch; v0.8.1 repariert den geprüften Crossing-Fall mit Slot-Memory
- kurze Okklusion: v0.9 trennt einfache Memory von predictive memory; v0.9.1 zeigt ein learned Gate auf dem geprüften Grid
- acceleration-aware recurrent state nach v0.10
- noisy background
- mehr als ein bewegtes Objekt
- Transfer zwischen world variants

Die nächste Forschungsrichtung ist ein learned acceleration-aware recurrent state, danach noisy reappearance.

## Was das nicht bedeutet

Das ist kein Benchmark, kein SOTA, kein Beleg für Physikverständnis, kein allgemeines World Model und keine Behauptung, dass JEPA funktioniert. Es ist ein kleines, klar begrenztes diagnostisches Resultat.
