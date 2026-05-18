---
layout: page
title: "MOCPS — Motion-Grounded Object-Centric Predictive State"
lang: pl
en_url: /en/mocps/
de_url: /de/mocps/
permalink: /mocps/
---

MOCPS to nazwa v0.5 dla promowanego przepisu diagnostycznego `signed_velocity_only` + predictor400 w małej rodzinie eksperymentów proceduralnych. To nie jest nowa wielka architektura. To uporządkowany, minimalny przepis badawczy, który powstał po serii negatywnych i pozytywnych testów.

## Co to jest

MOCPS oznacza **Motion-Grounded Object-Centric Predictive State**. W praktyce jest to mały CPU-friendly diagnostyk sprawdzający, czy da się zbudować predykcyjny stan latentny, który:

- wybiera poruszający się obiekt z obrazu,
- zachowuje jego pozycję w reprezentacji,
- dostaje kierunek ruchu z pikseli,
- przewiduje przyszły stan lepiej niż prosta persystencja.

Persystencja to mocny, prosty baseline: zakłada, że przyszła pozycja obiektu będzie taka sama jak ostatnia znana pozycja. MOCPS ma sens tylko wtedy, gdy konsekwentnie bije taki baseline.

## Cel

Celem nie jest pokazanie ogólnego world modelu. Celem jest zrozumienie jednego małego pytania:

> kiedy predykcyjny latent naprawdę niesie użyteczny stan obiektu, a kiedy wygląda dobrze tylko dlatego, że baseline był za słaby?

Dlatego eksperymenty są małe, lokalne i CPU-first. Każdy wynik jest mierzony przeciw prostym baseline’om, a nie przeciw narracji.

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

- **Diff-motion objectness**: głowa objectness dostaje jawne różnice ramek, więc ma sygnał ruchu zamiast polegać tylko na jasności.
- **Coordinate-aware object token**: token zawiera informację przestrzenną, a nie tylko abstrakcyjny embedding.
- **Signed velocity residual**: kierunek ruchu pochodzi z dodatnich i ujemnych różnic pikseli, bez generatorowych labeli w treningu encodera/predictora.
- **Predictor400**: stabilniejszy przepis trenowania predyktora latentów. Wcześniejszy przepis miał rzadką wariancję treningową.

## Najważniejsze wyniki

<div class="metric-grid">
  <div class="metric"><strong>200/200</strong><span>cold run vs persistence</span></div>
  <div class="metric"><strong>1.574 px</strong><span>mean MAE</span></div>
  <div class="metric"><strong>3.903 px</strong><span>persistence MAE</span></div>
  <div class="metric"><strong>0</strong><span>failed rows</span></div>
</div>

| grupa | wynik | mean MAE | persistence MAE |
| --- | ---: | ---: | ---: |
| total covered surface | 200/200 | 1.574 px | 3.903 px |
| no_bounce_ball | 50/50 | 0.845 px | 1.444 px |
| bouncing_ball | 50/50 | 2.292 px | 5.504 px |
| moving_ball_distractors | 100/100 | 1.579 px | 4.332 px |
| horizon 1 | 50/50 | 0.845 px | 1.444 px |
| horizon 4 | 50/50 | 1.354 px | 3.610 px |
| horizon 6 | 100/100 | 2.048 px | 5.279 px |

Wynik pochodzi z cold reproducibility run:

- `cold_run: true`
- `reused_rows: false`
- `failed rows: 0`
- `rows worse than learned_diff: 0`
- runtime: `13260.8 s`

Żądane pary world/horizon poza obsługiwaną powierzchnią stabilności były jawnie pominięte, nie policzone po cichu.

## v0.6.1 — dynamic moving-distractor stress test

Najnowszy test dodał trudniejszy świat: jeden poruszający się target i jeden podobnie jasny poruszający się distractor. Architektura MOCPS nie była zmieniana ani dostrajana pod ten przypadek.

Pytanie było proste: czy single-object MOCPS radzi sobie, gdy rusza się więcej niż jeden obiekt?

| horyzont | wynik vs persistence | MOCPS MAE | persistence MAE | target mass | distractor mass |
| ---: | :---: | ---: | ---: | ---: | ---: |
| h1 | 0/5 | 4.177 px | 2.189 px | 0.168 | 0.333 |
| h2 | 1/5 | 3.497 px | 3.273 px | 0.219 | 0.239 |
| h4 | 5/5 | 3.769 px | 5.429 px | 0.262 | 0.280 |
| h6 | 5/5 | 3.873 px | 7.478 px | 0.268 | 0.287 |
| total | 11/20 | 3.829 px | 4.592 px | 0.229 | 0.285 |

Interpretacja: dynamiczny distractor łamie obecną single-object wersję MOCPS. Najbardziej prawdopodobny problem to object selection: przy dwóch podobnie jasnych poruszających się obiektach masa objectness częściej przechyla się w stronę distractora niż targetu. To jest negatywny wynik i dobry następny kierunek: multi-object / slot-like state.

## Baseline’y i odniesienia

| wariant | wynik / obserwacja | sens porównania |
| --- | --- | --- |
| persistence | mean MAE 3.903 px | prosty baseline: przyszłość = ostatnia znana pozycja |
| motion_coord | 200/200, mean MAE 1.966 px | mocny, ręcznie zdefiniowany motion-objectness reference |
| learned_diff | 200/200, mean MAE 2.443 px | learned diff-motion token bez promowanego przepisu MOCPS |
| MOCPS | 200/200, mean MAE 1.574 px | aktualny promowany learned diagnostic recipe |
| analytic signed-motion baseline | 0/60 w ablation | sam podpisany stan z pikseli nie wystarczył |

Najważniejsza interpretacja: signed velocity pomaga, ale nie zastępuje learned token path. Gdy analityczny signed-motion baseline działał samodzielnie, przegrał. MOCPS działa jako połączenie object-centric tokena, signed velocity residual i stabilniejszego predyktora.

## Środowisko obliczeniowe

Eksperymenty są projektowane jako CPU-first. Ostatni cold reproducibility run był wykonany lokalnie na:

- CPU: `AMD EPYC-Milan Processor`
- środowisko: KVM / QEMU
- 12 vCPU
- 6 rdzeni / 12 wątków
- L3 cache: 32 MiB

To jest celowe: mały eksperyment powinien dać się uruchomić bez klastra GPU i bez ciężkiego stacku MLOps.

## Droga do MOCPS

<div class="timeline">
  <div class="timeline-item">
    <h3>1. Plain latent prediction</h3>
    <p>Latent MSE, temporal contrastive i temporal delta nie pokonały uczciwych baseline’ów na ścieżce predicted latent. To był ważny negatywny wynik: sam objective predykcji latentów nie wystarczył.</p>
  </div>
  <div class="timeline-item">
    <h3>2. Object-state pretext</h3>
    <p>Pierwszy pozytywny sygnał pojawił się, gdy reprezentacja dostała presję na pixel-derived object state. To pokazało, że problemem nie jest tylko predictor, ale jakość stanu.</p>
  </div>
  <div class="timeline-item">
    <h3>3. Coordinate-aware tokens</h3>
    <p>Dodanie jawnej struktury współrzędnych pomogło w czystych światach. Jednocześnie brightness objectness załamał się przy statycznych jasnych distractorach.</p>
  </div>
  <div class="timeline-item">
    <h3>4. Motion objectness</h3>
    <p>Motion-derived objectness okazał się dużo bardziej odporny na statyczne distractory. To skierowało projekt w stronę objectness opartego na ruchu.</p>
  </div>
  <div class="timeline-item">
    <h3>5. Learned diff-motion objectness</h3>
    <p>Learned objectness zaczął działać dopiero po dostaniu jawnego frame-difference input. Wciąż nie był perfekcyjny, szczególnie na no_bounce h1.</p>
  </div>
  <div class="timeline-item">
    <h3>6. Signed residual</h3>
    <p>Signed positive/negative frame differences dodały informację o kierunku. Ablation pokazał, że signed velocity jest najmocniejszym minimalnym signed componentem.</p>
  </div>
  <div class="timeline-item">
    <h3>7. Stability forensics</h3>
    <p>Jedyny niestabilny przypadek w audycie signed_velocity_only okazał się wariancją treningu predyktora, nie błędem ewaluacji ani problemem probe.</p>
  </div>
  <div class="timeline-item">
    <h3>8. Predictor400</h3>
    <p>Więcej kroków treningu predyktora usunęło pozostałą niestabilność: predictor400 uzyskał 210/210 w audycie stabilności i 200/200 w cold MOCPS run.</p>
  </div>
</div>

## Gdzie jestem teraz

Aktualny stan: MOCPS jest kanonicznym, promowanym wariantem learned diagnostic recipe dla tej małej rodziny diagnostyków. Najsilniejszy publiczny wynik to cold run `200/200` przeciw persystencji na pokrytej powierzchni.

To nie kończy tematu. To raczej zamyka pierwszy stabilny etap: mam przepis, który działa na znanych światach i baseline’ach, i mogę zacząć pytać, gdzie pęknie.

## Dokąd zmierzam

Następne testy powinny być trudniejsze i mniej wygodne:

- moving distractor: pierwsza wersja testu łamie aktualny single-object MOCPS
- crossing objects
- częściowe occlusion
- acceleration zamiast stałej prędkości
- noisy background
- więcej niż jeden poruszający się obiekt
- testy transferu między world variants

Najbliższy kierunek to nie dalsze dostrajanie tego samego single-object przepisu, tylko sprawdzenie multi-object / slot-like state.

## Czego to nie znaczy

To nie jest benchmark, SOTA, dowód rozumienia fizyki, ogólny world model ani twierdzenie, że JEPA działa. To mały, uczciwie ograniczony wynik diagnostyczny.
