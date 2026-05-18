---
layout: page
title: "MOCPS — Motion-Grounded Object-Centric Predictive State"
lang: pl
en_url: /en/mocps/
permalink: /mocps/
---

MOCPS to nazwa v0.5 dla promowanego przepisu diagnostycznego `signed_velocity_only` + predictor400 w małej rodzinie eksperymentów proceduralnych.

## Jednozdaniowo

Minimalny przepis do sprawdzania, czy motion-grounded object-centric state pomaga predykcyjnym latentom pokonać baseline persystencji w małych światach proceduralnych.

## Mechanizm

```text
frames t,t+1
  -> diff-motion objectness
  -> coordinate-aware object token
  -> signed velocity residual
  -> predictor400
  -> predicted future state
  -> probe/eval only
```

- diff-motion objectness wybiera poruszający się obiekt
- coordinate-aware token zachowuje strukturę przestrzenną
- signed velocity z dodatnich i ujemnych różnic ramek dodaje kierunek
- predictor400 stabilizuje ścieżkę context-to-future

## Wynik cold reproducibility

| metryka | wartość |
| --- | --- |
| cold_run | true |
| reused_rows | false |
| wynik | 200/200 przeciw persystencji |
| mean MAE | 1.574 px |
| mean persistence MAE | 3.903 px |
| no_bounce_ball | 50/50 |
| bouncing_ball | 50/50 |
| moving_ball_distractors | 100/100 |
| h1 | 50/50 |
| h4 | 50/50 |
| h6 | 100/100 |

Żądane pary world/horizon poza obsługiwaną powierzchnią stabilności były jawnie pominięte, nie policzone po cichu.

## Czego to nie znaczy

To nie jest benchmark, SOTA, dowód rozumienia fizyki, ogólny world model ani twierdzenie, że JEPA działa. To mały wynik diagnostyczny.

## Następny krok

Trudniejsze testy: moving distractor, crossing objects, occlusion, acceleration, noisy background.
