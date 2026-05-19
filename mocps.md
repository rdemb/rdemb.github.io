---
layout: page
title: "MOCPS — Motion-Grounded Object-Centric Predictive State"
lang: pl
en_url: /en/mocps/
de_url: /de/mocps/
permalink: /mocps/
---

MOCPS to mały projekt badawczy o przewidywaniu ruchu obiektu w prostych światach pikselowych. Pytanie jest wąskie: czy reprezentacja wyciągnięta z obrazu potrafi przewidzieć przyszłą pozycję lepiej niż ostatnia znana pozycja.

Technicznie aktualna wersja to przepis `signed_velocity_only` + predictor400. To nie jest nowa duża architektura. To zawężony, reprodukowalny test, który powstał po serii wyników negatywnych i pozytywnych.

## Co to jest

MOCPS oznacza **Motion-Grounded Object-Centric Predictive State**. W praktyce jest to mały CPU-friendly diagnostyk sprawdzający, czy da się zbudować predykcyjny stan latentny, który:

- wybiera poruszający się obiekt z obrazu,
- zachowuje jego pozycję w reprezentacji,
- dostaje kierunek ruchu z pikseli,
- przewiduje przyszły stan lepiej niż prosta persystencja.

Persystencja to mocny, prosty baseline: zakłada, że przyszła pozycja obiektu będzie taka sama jak ostatnia znana pozycja. MOCPS ma sens tylko wtedy, gdy konsekwentnie bije taki baseline.

## Cel

Celem nie jest pokazanie ogólnego world modelu. Celem jest zrozumienie jednego małego pytania:

> kiedy predykcyjny latent naprawdę niesie użyteczny stan obiektu, a kiedy wynik jest tylko efektem zbyt słabego baseline'u?

Dlatego eksperymenty są małe, lokalne i CPU-first. Każdy wynik jest mierzony przeciw prostym baseline’om, a nie oceniany po opisie.

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

Ten test dodał trudniejszy świat: jeden poruszający się target i jeden podobnie jasny poruszający się distractor. Architektura MOCPS nie była zmieniana ani dostrajana pod ten przypadek.

Pytanie było proste: czy single-object MOCPS radzi sobie, gdy rusza się więcej niż jeden obiekt?

| horyzont | wynik vs persistence | MOCPS MAE | persistence MAE | target mass | distractor mass |
| ---: | :---: | ---: | ---: | ---: | ---: |
| h1 | 0/5 | 4.177 px | 2.189 px | 0.168 | 0.333 |
| h2 | 1/5 | 3.497 px | 3.273 px | 0.219 | 0.239 |
| h4 | 5/5 | 3.769 px | 5.429 px | 0.262 | 0.280 |
| h6 | 5/5 | 3.873 px | 7.478 px | 0.268 | 0.287 |
| total | 11/20 | 3.829 px | 4.592 px | 0.229 | 0.285 |

Interpretacja: dynamiczny distractor łamie obecną single-object wersję MOCPS. Najbardziej prawdopodobny problem to object selection: przy dwóch podobnie jasnych poruszających się obiektach masa objectness częściej przechyla się w stronę distractora niż targetu. To jest negatywny wynik i dobry następny kierunek: multi-object / slot-like state.

## v0.6.2 — dynamic-distractor selection audit

Kolejny audyt sprawdził, czy problem z v0.6.1 znika, gdy target jest wybierany poprawnie. To był test diagnostyczny, nie nowa architektura.

| wariant | wynik vs persistence | mean MAE | interpretacja |
| --- | :---: | ---: | --- |
| unchanged MOCPS | 11/20 | 3.829 px | single-object selector myli target z distractorem |
| target oracle | 20/20 | 0.602 px | poprawny target selection naprawia wynik |
| distractor oracle | 4/20 | 8.856 px | zły obiekt daje zły target prediction |
| image two-component left slot | 20/20 | 0.602 px | pixel-derived left-starting component wystarcza w tym gridzie |
| best-of-two oracle | 20/20 | 0.601 px | upper bound diagnostyczny |

Interpretacja: v0.6.1 był przede wszystkim problemem object binding / target selection. Prosty image-derived two-component selector rozwiązuje ten konkretny stress test, ale to nadal diagnostyka, nie claim o gotowym multi-object modelu. Następny krok to minimalny trenowalny multi-object / slot-like MOCPS.

## v0.7 — minimalny two-slot MOCPS audit

v0.7 zamienił diagnostykę z v0.6.2 w powtarzalny minimalny two-slot pipeline. Nadal nie jest to pełne trenowalne Slot Attention. Sloty są wyciągane z image-derived motion components, a target w tym świecie jest lewym startującym komponentem.

| wariant | wynik vs persistence | mean MAE | interpretacja |
| --- | :---: | ---: | --- |
| single-object MOCPS | 11/20 | 3.829 px | baseline z v0.6.1 nadal nie wiąże stabilnie targetu |
| image two-component left slot | 20/20 | 0.602 px | diagnostyczny selector z pikseli działa w tym gridzie |
| two-slot MOCPS | 20/20 | 0.602 px | minimalny two-slot pipeline odtwarza wynik diagnostyczny |
| target oracle | 20/20 | 0.602 px | poprawny target selection jest wystarczający tutaj |
| distractor oracle | 4/20 | 8.856 px | wybranie złego obiektu psuje target prediction |

Dodatkowo: h1/h2 zostały naprawione z `1/10` w single-object MOCPS do `10/10` w two-slot MOCPS, a assignment accuracy wyniosło `1.000`.

Interpretacja: na tym sprawdzonym dynamic-distractor gridzie explicit two-object state naprawia awarię single-object MOCPS. To jest pozytywny wynik diagnostyczny, ale nie dowód ogólnej multi-object robustness i nie gotowy trenowalny slot model. Następny krok to trainable slot assignment, a potem crossing objects, occlusion, acceleration i noisy backgrounds.

## v0.7.1 — trainable two-slot assignment audit

v0.7.1 sprawdził, czy hard-coded left-slot assignment da się zastąpić małą trenowalną głową. Scorer był trenowany tylko z image-derived component pseudo-targets: targetem był komponent z mniejszym obserwowanym początkowym centroidem x. Generatorowe pozycje były użyte tylko do oracle/eval/baseline.

| wariant | wynik vs persistence | mean MAE | assignment |
| --- | :---: | ---: | ---: |
| fixed-left two-slot | 20/20 | 0.602 px | 1.000 |
| trainable two-slot | 20/20 | 0.602 px | 1.000 |
| random assignment | 10/20 | 4.609 px | 0.499 |
| unchanged MOCPS | 11/20 | 3.829 px | n/a |

Interpretacja: minimalna trenowalna głowa assignment reprodukuje fixed-left two-slot result na tym sprawdzonym świecie i zachowuje naprawę h1/h2 (`10/10`). To nadal jest toy diagnostic: nie pełne trainable Slot Attention, nie benchmark i nie claim o szerokiej multi-object robustness.

## v0.8 — Crossing-objects stress test

v0.8 sprawdził trainable two-slot MOCPS na dwóch podobnych poruszających się obiektach, które zamieniają kolejność left/right. To test tożsamości, nie benchmark.

| wariant | wynik vs persistence | mean MAE | assignment przed/po crossing |
| --- | :---: | ---: | ---: |
| fixed initial identity | 20/20 | 0.376 px | 1.000 / 1.000 |
| trainable two-slot | 10/20 | 5.523 px | 1.000 / 0.000 |
| current-left baseline | 10/20 | 5.523 px | 1.000 / 0.000 |
| target oracle | 20/20 | 0.376 px | 1.000 / 1.000 |

Interpretacja: feed-forward trainable assignment nie zachowuje tożsamości po crossing. Zachowuje się jak current-left heuristic: działa przed zamianą stron, a po zamianie wybiera drugi obiekt. Następny krok to memory albo recurrent slot identity.

Zastrzeżenie: to nadal toy diagnostic; nie pełne trainable Slot Attention, nie benchmark, nie SOTA, nie claim o AGI, physics understanding, general world model ani szerokiej multi-object robustness.

## v0.8.1 — Memory-slot identity audit

v0.8.1 sprawdził, czy prosta pamięć slotu wystarczy tam, gdzie feed-forward assignment pękł przy crossing. Slot startuje od image-derived left-starting component i potem używa tylko historii obserwowanych komponentów: poprzedniego centroidu, prędkości i masy.

| wariant | wynik vs persistence | mean MAE | assignment po crossing |
| --- | :---: | ---: | ---: |
| trainable two-slot | 10/20 | 5.586 px | 0.000 |
| current-left baseline | 10/20 | 5.586 px | 0.000 |
| nearest memory | 20/20 | 0.423 px | 1.000 |
| velocity memory | 20/20 | 0.423 px | 1.000 |
| learned memory scorer | 20/20 | 0.423 px | 1.000 |
| target oracle | 20/20 | 0.423 px | 1.000 |

Interpretacja: w tym sprawdzonym toy świecie problem z v0.8 był problemem pamięci tożsamości, nie samej predykcji trajektorii. Najprostsza ciągłość centroidu wystarczyła; wariant velocity i mały learned scorer nie poprawiły wyniku ponad nearest memory.

Zastrzeżenie: to nadal diagnostyka. Nie jest to pełne trainable Slot Attention, benchmark, SOTA, AGI, physics understanding, general world model ani szeroka multi-object robustness.

## v0.9 — Occlusion memory-slot audit

v0.9 dodał krótką okluzję: dwa podobne obiekty dzielą tę samą ścieżkę y i na chwilę zlewają się w jeden widoczny blob. To rozdziela zwykłą pamięć od pamięci predykcyjnej.

| wariant | wynik vs persistence | mean MAE | assignment po okluzji |
| --- | :---: | ---: | ---: |
| trainable two-slot | 15/20 | 3.768 px | 0.000 |
| nearest / velocity memory | 15/20 | 3.470 px | 0.000 |
| predictive occlusion memory | 20/20 | 0.422 px | 1.000 |
| target oracle | 20/20 | 0.422 px | 1.000 |

Interpretacja: prosta ciągłość centroidu wystarcza, gdy oba komponenty są widoczne. Nie wystarcza, gdy obraz scala dwa obiekty w jeden komponent. Predictive memory przewija slot przez niejednoznaczną obserwację i obniża confidence zamiast udawać pełną pewność.

## v0.9.1 — Learned recurrent occlusion gate

v0.9.1 zastąpił ręczną decyzję update/predict małym learned gate. Gate był trenowany z image-derived pseudo-targetów: czy w tej klatce jest wystarczająco komponentów, żeby zaufać obserwacji, czy trzeba przewinąć stan z pamięci.

| wariant | wynik vs persistence | mean MAE | assignment podczas/po okluzji |
| --- | :---: | ---: | ---: |
| frozen velocity memory | 15/20 | 3.470 px | 1.000 / 0.000 |
| predictive occlusion memory | 20/20 | 0.422 px | 1.000 / 1.000 |
| learned recurrent gate | 20/20 | 0.422 px | 1.000 / 1.000 |

Dodatkowo: identity switch rate `0.000`, gate final update accuracy `1.000`.

Interpretacja: learned gate odtwarza zachowanie ręcznej predictive memory na tym sprawdzonym gridzie. To jest pozytywny wynik diagnostyczny, ale nadal nie pełne trainable Slot Attention. Następny test powinien dodać dłuższą okluzję i akcelerację.

## v0.9.2 — Long-occlusion memory sweep

Ten sweep sprawdził learned recurrent slot memory przy dłuższych oknach okluzji: `1`, `2`, `3`, `4` i `6` klatek merged observation.

Wynik: learned recurrent gate i hand-coded predictive memory miały `20/20` na każdej sprawdzonej długości. Learned recurrent after-occlusion assignment wyniosło `1.000`, identity switch rate `0.000`, a final confidence spadło z `0.539` przy długości `1` do `0.118` przy długości `6`.

Interpretacja: na tym stałoprędkościowym toy diagnostic nie pojawił się bottleneck pamięci do długości `6`. Następny bottleneck wygląda bardziej jak confidence calibration albo motion extrapolation pod akceleracją. Ważny caveat: frozen velocity memory nadal potrafi mieć `20/20` przeciw persistence, ale traci after-occlusion identity, więc winrate sam w sobie nie wystarcza.

Zastrzeżenie: toy diagnostic only; nie pełne trainable Slot Attention; nie benchmark, SOTA, AGI, physics understanding ani general world model.

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

Aktualny stan: MOCPS ma stabilny single-object wynik, a ścieżka slot-memory ma pierwszy pozytywny learned-gate wynik na krótkiej okluzji. Najsilniejszy publiczny wynik bazowy to cold run `200/200` przeciw persystencji na pokrytej powierzchni.

To nie kończy tematu. To raczej zamyka pierwszy stabilny etap: mam przepis, który działa na znanych światach i baseline’ach, i mogę zacząć pytać, gdzie pęknie.

## Dokąd zmierzam

Następne testy powinny być trudniejsze i mniej wygodne:

- moving distractor: pierwsza wersja testu łamie aktualny single-object MOCPS; selection audit pokazuje, że poprawny target selection naprawia checked grid
- crossing objects: v0.8 łamie feed-forward trainable assignment po zamianie left/right; v0.8.1 naprawia checked crossing przez pamięć slotu
- krótka okluzja: v0.9 rozdziela zwykłą pamięć od predictive memory; v0.9.1 pokazuje learned gate na checked gridzie
- dłuższa okluzja i acceleration zamiast stałej prędkości
- noisy background
- więcej niż jeden poruszający się obiekt
- testy transferu między world variants

Najbliższy kierunek to trudniejsza okluzja: dłuższe zasłonięcie, akceleracja i dopiero potem mocniejszy recurrent slot state, jeśli mały gate przestanie wystarczać.

## Czego to nie znaczy

To nie jest benchmark, SOTA, dowód rozumienia fizyki, ogólny world model ani twierdzenie, że JEPA działa. To mały, uczciwie ograniczony wynik diagnostyczny.
