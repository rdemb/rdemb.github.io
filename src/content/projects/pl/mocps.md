---
title: "MOCPS, Motion-Grounded Object-Centric Predictive State"
lang: "pl"
kind: "project"
excerpt: "Mały model świata JEPA, który nauczył się grawitacji i dostał ciało: żywy organizm rozróżniający możliwe od niemożliwego w 96%."
key: "mocps"
slug: "mocps"
---
MOCPS to mały projekt badawczy o przewidywaniu ruchu obiektu w prostych światach pikselowych. Pytanie jest wąskie: czy reprezentacja wyciągnięta z obrazu potrafi przewidzieć przyszłą pozycję lepiej niż ostatnia znana pozycja.

Technicznie aktualna wersja to przepis `signed_velocity_only` + predictor400. To nie jest nowa duża architektura. To zawężony, reprodukowalny test, który powstał po serii wyników negatywnych i pozytywnych.

## Pod kloszem — żywy organizm

Najnowszy kierunek: dać temu modelowi świata ciało. **Pod Kloszem** to żywy organizm 3D, przybysz z gwiazd na polskim podwórku, napędzany realnym modelem JEPA działającym 24/7 na CPU. To nie animacja: każda klatka to odczyt stanu modelu.

Dla organizmu rozszerzyliśmy świat o **grawitację**, i to zmienia regułę gry. W ruchu liniowym nauczony predyktor nie potrafił pobić baseline'u „stała prędkość", bo ten miał już całą informację. Pod grawitacją stała prędkość gubi przyspieszenie, a nauczony predyktor **bije ją** (3.85 ± 0.56 px kontra 5.71 px, pięć seedów), bo zinternalizował spadanie.

Organizm robi trzy rzeczy naraz, każdą mierzymy:

- **przewiduje** lot piłki (złota kropka na scenie to surowa predykcja sieci, 4 klatki naprzód),
- **pamięta** pozycję piłki, gdy znika za przeszkodą (trwałość obiektu),
- **dziwi się** metodą V-JEPA: mierzymy rozjazd zaskoczenia i model wzdryga się tylko wtedy, gdy reżyser złamie fizykę (lewitacja, zamarcie, teleport). Możliwe od niemożliwego rozróżnia w **96%**.

To jest test rozumienia fizyki w duchu Yanna LeCuna (możliwe kontra niemożliwe), ucieleśniony jako stworzenie żyjące pod szkłem.

## Co widać w wizualizacji

Wizualizacja to widok z boku świata, w którym żyje organizm. Każdy element coś znaczy, nic nie jest dekoracją:

- **Biała kula** — prawdziwa piłka, ground truth. Realny stan świata, który serwer prowadzi 24/7.
- **Cyjanowy łuk** — tor wyobraźni: przekonanie modelu o piłce prowadzone naprzód twardą fizyką świata (rollout). Uwidacznia pamięć pod zasłoną, ale sam w sobie nie jest odczytem z sieci.
- **Złota kropka** — surowa predykcja sieci: gdzie model (liniowa sonda na przewidzianym latencie) spodziewa się piłki 4 klatki później. Jedyny punkt sceny czytany prosto z sieci.
- **Cyjanowy znacznik z delikatną obręczą** — przekonanie modelu: gdzie myśli, że jest piłka. Gdy piłka znika za przeszkodą, znacznik zostaje i przesuwa się tam, gdzie model się jej spodziewa (trwałość obiektu). Obręcz rośnie, gdy pewność spada.
- **Oko modelu (lewy panel, 32×32 px)** — surowy obraz, którym naprawdę operuje mózg. Biała plamka to piłka tak, jak ją widzi (rozmyta, 1024 piksele), cyjanowa kropka to jego przekonanie. To czyni reprezentację widzialną: model przewiduje fizykę z tego, nie z ładnej grafiki 3D.
- **Ciemny panel z cyjanową krawędzią** — przeszkoda (okluder). Gdy piłka za nią wpada, znika z oka modelu i zaczyna się test trwałości.
- **Koralowy błysk i fala** — zaskoczenie. Model wzdryga się tylko, gdy świat złamie fizykę (piłka nie spada, zamiera albo teleportuje się). Na zwykłym locie pozostaje spokojny.
- **Siatka podłogi** — płaszczyzna odniesienia fizyki, wspólny układ współrzędnych prawdy i predykcji.
- **Panel danych (prawa kolumna)** — żywe metryki: „rozumie fizykę" (jak często poprawnie odróżnia możliwe od niemożliwego), pewność, stan (widzi / pamięta / zaskoczony) oraz test niemożliwego: średnie zaskoczenie na świecie możliwym kontra niemożliwym i margines między nimi. Po lewej: wiek organizmu liczony na serwerze (przeżywa restarty), kroki świata i licznik prób.
- **Przycisk „złam fizykę"** — ty jako reżyser: kliknięcie zleca serwerowi pułapkę (zdarzenie niemożliwe), żeby sprawdzić, czy model się zorientuje.

## Badania i wyniki

**Świat.** Piłka leci pod stałą grawitacją, odbija się od ziemi, czasem znika za przeszkodą. Model widzi tylko rzut 32×32 piksele (te same, które pokazuje oko modelu), nigdy współrzędnych, nigdy etykiet.

**Model.** Mały JEPA (joint-embedding predictive architecture, kierunek forsowany przez LeCuna): enkoder, predyktor latentu i cel-enkoder EMA. Uczy się przewidywać przyszły *latent*, nie piksele. Trening kilka minut na CPU.

**Jak mierzymy, wszystko przeciw uczciwym baseline'om:**

- **Grawitacja, replikacja na 5 seedach.** Liniowy probe odczytuje pozycję z predykcji modelu. Model trafia w przyszłą pozycję na **3.85 ± 0.56 px**, baseline „stała prędkość" na **5.71 ± 0.01 px** — przewaga **+1.86 px, dodatnia na każdym z pięciu seedów**, a najlepszy seed (2.91 px) bije nawet wyrocznię stałego przyspieszenia, bo nauczył się odbić od ziemi. To odwrotność wcześniejszego wyniku: na ruchu liniowym uczenie nie pobiło baseline'u (ten miał już całą informację), a pod grawitacją jest czego się uczyć.
- **Możliwe kontra niemożliwe (metoda V-JEPA).** W chwili wejścia za przeszkodę model zapisuje, czego się spodziewa; przy odsłonięciu porównujemy to z rzeczywistością w przestrzeni latentu. Na możliwym zaskoczenie jest małe (0.14), na niemożliwym duże (0.82); grube cuda wykrywa w 92–100% przy 2,4% fałszywych alarmów. Obok modelu biegnie uczciwy baseline: idealny tracker pikselowy z prawdziwą fizyką. Każda próba trafia do publicznego dziennika (`trials.jsonl`), z którego policzona jest kalibracja progu.
- **Subtelne cuda, zmierzona granica.** Reżyser zna też cuda, których nie widać w jednej klatce: grawitacja wykrzywiona o ±30%, pęd o ±35% za zasłoną. Obecna reprezentacja wykrywa je w 5–15% — i raportujemy to wprost, jako mapę miejsca, w którym rozumienie się kończy, a nie ukrytą porażkę.

**Po drodze, uczciwie.** Pierwsze przebiegi się sypały: znormalizowana strata pozwalała reprezentacji zapaść się (effective rank 3.8, latent nieczytelny). Naprawa to surowa strata MSE plus VICReg (variance i covariance), która podniosła rank do 11 i uczyniła latent czytelnym. Drugi problem: organizm mylił możliwe z niemożliwym, bo model widział tylko start łuku, naprawione losową rozgrzewką świata (kontekst z każdej fazy lotu).

## Wnioski

Mały model świata, trenowany bez etykiet na 1024 pikselach, **nauczył się grawitacji na tyle, że bije bezpamięciowy baseline na pełnej obserwacji**, i to w tym samym świecie, w którym wcześniejszy wynik pokazał, że na ruchu liniowym uczenie nie pomaga. Dostał ciało: przewiduje łuk, trzyma piłkę w pamięci za przeszkodą i wzdryga się tylko na cud, 96% poprawnie. Oko modelu pokazuje, że wszystko to dzieje się na biednym, rozmytym obrazie, więc to dowód reprezentacji, a nie efekt grafiki.

**Czego to nie znaczy.** To wciąż skala zabawki: 32 piksele, jedna piłka, rzut boczny. Nie benchmark, nie SOTA, nie dowód ogólnego rozumienia fizyki ani twierdzenie, że JEPA „działa". To uczciwie ograniczony, w pełni reprodukowalny wynik, i żywy organizm, który pokazuje go na żywo, 24/7, na CPU.

**Kod.** Całe laboratorium z wytrenowanym checkpointem organizmu jest na GitHubie: [github.com/rdemb/jepa-petri-dish](https://github.com/rdemb/jepa-petri-dish) — `python -m organism.server` uruchamia organizm u Ciebie, a tę stronę można wycelować we własny serwer parametrem `?live=`.

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

## v0.6.1, dynamic moving-distractor stress test

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

## v0.6.2, dynamic-distractor selection audit

Kolejny audyt sprawdził, czy problem z v0.6.1 znika, gdy target jest wybierany poprawnie. To był test diagnostyczny, nie nowa architektura.

| wariant | wynik vs persistence | mean MAE | interpretacja |
| --- | :---: | ---: | --- |
| unchanged MOCPS | 11/20 | 3.829 px | single-object selector myli target z distractorem |
| target oracle | 20/20 | 0.602 px | poprawny target selection naprawia wynik |
| distractor oracle | 4/20 | 8.856 px | zły obiekt daje zły target prediction |
| image two-component left slot | 20/20 | 0.602 px | pixel-derived left-starting component wystarcza w tym gridzie |
| best-of-two oracle | 20/20 | 0.601 px | upper bound diagnostyczny |

Interpretacja: v0.6.1 był przede wszystkim problemem object binding / target selection. Prosty image-derived two-component selector rozwiązuje ten konkretny stress test, ale to nadal diagnostyka, nie claim o gotowym multi-object modelu. Następny krok to minimalny trenowalny multi-object / slot-like MOCPS.

## v0.7, minimalny two-slot MOCPS audit

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

## v0.7.1, trainable two-slot assignment audit

v0.7.1 sprawdził, czy hard-coded left-slot assignment da się zastąpić małą trenowalną głową. Scorer był trenowany tylko z image-derived component pseudo-targets: targetem był komponent z mniejszym obserwowanym początkowym centroidem x. Generatorowe pozycje były użyte tylko do oracle/eval/baseline.

| wariant | wynik vs persistence | mean MAE | assignment |
| --- | :---: | ---: | ---: |
| fixed-left two-slot | 20/20 | 0.602 px | 1.000 |
| trainable two-slot | 20/20 | 0.602 px | 1.000 |
| random assignment | 10/20 | 4.609 px | 0.499 |
| unchanged MOCPS | 11/20 | 3.829 px | n/a |

Interpretacja: minimalna trenowalna głowa assignment reprodukuje fixed-left two-slot result na tym sprawdzonym świecie i zachowuje naprawę h1/h2 (`10/10`). To nadal jest toy diagnostic: nie pełne trainable Slot Attention, nie benchmark i nie claim o szerokiej multi-object robustness.

## v0.8, Crossing-objects stress test

v0.8 sprawdził trainable two-slot MOCPS na dwóch podobnych poruszających się obiektach, które zamieniają kolejność left/right. To test tożsamości, nie benchmark.

| wariant | wynik vs persistence | mean MAE | assignment przed/po crossing |
| --- | :---: | ---: | ---: |
| fixed initial identity | 20/20 | 0.376 px | 1.000 / 1.000 |
| trainable two-slot | 10/20 | 5.523 px | 1.000 / 0.000 |
| current-left baseline | 10/20 | 5.523 px | 1.000 / 0.000 |
| target oracle | 20/20 | 0.376 px | 1.000 / 1.000 |

Interpretacja: feed-forward trainable assignment nie zachowuje tożsamości po crossing. Zachowuje się jak current-left heuristic: działa przed zamianą stron, a po zamianie wybiera drugi obiekt. Następny krok to memory albo recurrent slot identity.

Zastrzeżenie: to nadal toy diagnostic; nie pełne trainable Slot Attention, nie benchmark, nie SOTA, nie claim o AGI, physics understanding, general world model ani szerokiej multi-object robustness.

## v0.8.1, Memory-slot identity audit

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

## v0.9, Occlusion memory-slot audit

v0.9 dodał krótką okluzję: dwa podobne obiekty dzielą tę samą ścieżkę y i na chwilę zlewają się w jeden widoczny blob. To rozdziela zwykłą pamięć od pamięci predykcyjnej.

| wariant | wynik vs persistence | mean MAE | assignment po okluzji |
| --- | :---: | ---: | ---: |
| trainable two-slot | 15/20 | 3.768 px | 0.000 |
| nearest / velocity memory | 15/20 | 3.470 px | 0.000 |
| predictive occlusion memory | 20/20 | 0.422 px | 1.000 |
| target oracle | 20/20 | 0.422 px | 1.000 |

Interpretacja: prosta ciągłość centroidu wystarcza, gdy oba komponenty są widoczne. Nie wystarcza, gdy obraz scala dwa obiekty w jeden komponent. Predictive memory przewija slot przez niejednoznaczną obserwację i obniża confidence zamiast udawać pełną pewność.

## v0.9.1, Learned recurrent occlusion gate

v0.9.1 zastąpił ręczną decyzję update/predict małym learned gate. Gate był trenowany z image-derived pseudo-targetów: czy w tej klatce jest wystarczająco komponentów, żeby zaufać obserwacji, czy trzeba przewinąć stan z pamięci.

| wariant | wynik vs persistence | mean MAE | assignment podczas/po okluzji |
| --- | :---: | ---: | ---: |
| frozen velocity memory | 15/20 | 3.470 px | 1.000 / 0.000 |
| predictive occlusion memory | 20/20 | 0.422 px | 1.000 / 1.000 |
| learned recurrent gate | 20/20 | 0.422 px | 1.000 / 1.000 |

Dodatkowo: identity switch rate `0.000`, gate final update accuracy `1.000`.

Interpretacja: learned gate odtwarza zachowanie ręcznej predictive memory na tym sprawdzonym gridzie. To jest pozytywny wynik diagnostyczny, ale nadal nie pełne trainable Slot Attention. Następny test powinien dodać dłuższą okluzję i akcelerację.

## v0.9.2, Long-occlusion memory sweep

Ten sweep sprawdził learned recurrent slot memory przy dłuższych oknach okluzji: `1`, `2`, `3`, `4` i `6` klatek merged observation.

Wynik: learned recurrent gate i hand-coded predictive memory miały `20/20` na każdej sprawdzonej długości. Learned recurrent after-occlusion assignment wyniosło `1.000`, identity switch rate `0.000`, a final confidence spadło z `0.539` przy długości `1` do `0.118` przy długości `6`.

Interpretacja: na tym stałoprędkościowym toy diagnostic nie pojawił się bottleneck pamięci do długości `6`. Następny bottleneck wygląda bardziej jak confidence calibration albo motion extrapolation pod akceleracją. Ważny caveat: frozen velocity memory nadal potrafi mieć `20/20` przeciw persistence, ale traci after-occlusion identity, więc winrate sam w sobie nie wystarcza.

Zastrzeżenie: toy diagnostic only; nie pełne trainable Slot Attention; nie benchmark, SOTA, AGI, physics understanding ani general world model.

## v0.10, Acceleration-through-occlusion stress test

Co się zmieniło: sprawdziłem learned recurrent slot memory, gdy ukryty obiekt zmienia prędkość w pobliżu albo w trakcie okluzji.

Wynik: learned recurrent gate zachował `60/60` na `none_control`, `mild_accel` i `strong_accel`, ale przy `strong_accel` after-occlusion assignment spadło do `0.503`, a identity switch rate wzrosło do `0.391`. W `direction_change` wynik spadł do `30/60`, z after-occlusion assignment `0.774`.

Interpretacja: akceleracja ujawnia bottleneck motion extrapolation / identity binding. Sam winrate przeciw persistence nie wystarcza, bo `strong_accel` nadal ma `60/60`, mimo że często gubi tożsamość po reappearance. Następny krok to learned acceleration-aware recurrent state.

Zastrzeżenie: toy diagnostic only; nie pełne trainable Slot Attention; nie benchmark, SOTA, AGI, physics understanding ani general world model.

## v0.10.1, Acceleration-aware memory dynamics

Co się zmieniło: sprawdziłem mały acceleration-aware recurrent state po tym, jak v0.10 pokazało awarie przy strong acceleration i direction change.

Wynik: wariant acceleration-aware nie naprawił problemu. Miał `55/60` na `none_control`, `55/60` na `mild_accel`, `60/60` na `strong_accel` i `45/60` na `direction_change`. After-occlusion assignment wyniosło `0.738`, `0.806`, `0.685`, `0.483`, a identity switch rate wzrosło do `0.493`, `0.416`, `0.501`, `0.702`.

Interpretacja: proste dodanie liniowego acceleration state nie wystarcza. Confidence stało się bardziej czułe na tryb ruchu, ale identity binding po reappearance jest mniej stabilny. Następny krok to richer recurrent state albo learned nonlinear dynamics.

Zastrzeżenie: toy diagnostic only; nie pełne trainable Slot Attention; nie benchmark, SOTA, AGI, physics understanding ani general world model.

## v0.10.2, Dynamics arbitration memory audit

Co się zmieniło: sprawdziłem, czy safe fallback / arbitration może używać akceleracji tylko wtedy, gdy image-derived evidence jest wystarczająco dobre, zamiast stosować acceleration state zawsze.

Wynik: safe fallback zachował kontrolne `none_control` i `mild_accel` na `60/60`, z after-occlusion assignment `1.000` i identity switch rate `0.000`. Na `strong_accel` poprawił after-occlusion assignment z `0.503` do `0.800` i obniżył switch rate z `0.391` do `0.151`. `direction_change` nadal nie jest rozwiązany: winrate wzrosło do `45/60`, ale after-occlusion assignment spadło do `0.718`, a switch rate wzrósł do `0.428`. Diagnostyczny oracle selector pokazuje zapas (`50/60`, after `0.924`, switch `0.111`), jeśli branch dynamiki jest wybrany poprawnie.

Interpretacja: akceleracja powinna być warunkowa, nie zawsze włączona. Safe fallback jest częściową poprawką dla `strong_accel`, ale `direction_change` wymaga lepszego selektora dynamiki albo bogatszego recurrent state.

Zastrzeżenie: toy diagnostic only; nie pełne trainable Slot Attention; nie benchmark, SOTA, AGI, physics understanding ani general world model.

## v0.11, Noisy reappearance memory stress test

Co się zmieniło: sprawdziłem, czy safe-fallback memory przeżywa noisy albo mylące reappearance po okluzji.

Wynik: safe fallback miał `60/60` winrate w każdym sprawdzonym noise mode. To nie znaczy, że identity binding był stabilny. `false_blob` obniżył immediate assignment do `0.791`, recovery assignment do `0.659`, podniósł identity switch rate do `0.351` i miał false-component selection `0.276`. Kontrole, pixel noise, flicker i distractor-bright reappearance zachowały recovery assignment `1.000` oraz switch rate `0.000`.

Interpretacja: następny bottleneck to observation reliability / re-identification, nie długość pamięci ani kolejny prosty składnik dynamiki. Safe fallback powinien dostać image-derived reliability head albo lekką appearance memory, żeby odrzucać transient false components.

Zastrzeżenie: toy diagnostic only; nie pełne trainable Slot Attention; nie benchmark, SOTA, AGI, physics understanding, general world model ani szeroka noisy-reappearance robustness.

## v0.11.1, Observation reliability / appearance-memory audit

Co się zmieniło: sprawdziłem, czy image-derived reliability gating albo lekka appearance memory potrafi odrzucać transient false components po reappearance.

Wynik: najlepszy praktyczny wariant, `handcrafted_reliability_gate`, zachował `60/60` na `false_blob`, poprawił recovery assignment z `0.659` do `0.977`, obniżył identity switch rate z `0.351` do `0.031` i zmniejszył false-component selection z `0.276` do `0.039`. Learned reliability i lightweight appearance memory też poprawiły `false_blob` do recovery `0.977` i switch `0.031`. Kontrole, pixel noise, flicker i distractor-bright reappearance pozostały bez regresji: recovery `1.000`, switch `0.000`.

Interpretacja: false reappearance binding wygląda tutaj jak problem observation reliability / re-identification, który da się mocno ograniczyć prostymi image-derived features. Negatywny wynik: confidence nadal nie jest dobrym sygnałem ryzyka false blob, bo najlepszy praktyczny wariant miał confidence `0.695` na `false_blob`.

Zastrzeżenie: toy diagnostic only; nie pełne trainable Slot Attention; nie benchmark, SOTA, AGI, physics understanding, general world model ani szeroka noisy-reappearance robustness.

## v0.12, Hard false-blob / appearance-ambiguity stress audit

Co się zmieniło: sprawdziłem reliability gating na trudniejszych false blobach podobnych do distractora albo targetu: target-like brightness, target-like motion, near reappearance, persistent blobs, multi false blobs i appearance swap po okluzji.

Wynik: na held-out hard modes `learned_reliability_gate` poprawił identity metrics względem `safe_fallback_base`: recovery assignment `0.969` vs `0.737`, identity switch rate `0.042` vs `0.250`, false-component selection `0.115` vs `0.265`. Kontrole zostały zachowane: recovery `1.000`, switch `0.000`.

Interpretacja: to częściowy sukces, nie rozwiązanie re-identification. Reliability poprawia identity metrics na sprawdzonych hard modes, ale easy `false_blob` w tym reduced-sample run był słabszy niż v0.11.1 (`recovery 0.938`, `switch 0.083`). Confidence calibration dalej jest bottleneckiem: hard-mode confidence było lekko wyższe niż w kontrolach.

Zastrzeżenie: toy diagnostic only; local checked grid; nie benchmark; nie broad robustness; nie rozwiązane appearance memory ani re-identification.

## v0.12.1, Reliability stability / sample-size audit

Co się zmieniło: ponownie sprawdziłem słabość easy `false_blob` z v0.12 większym targetowanym próbkowaniem (`4 x 16`, 960 próbek na mode/variant dla identity metrics), bez nowej architektury.

Wynik: larger targeted sampling odrzucił stabilną regresję. `learned_reliability_gate` na easy modes wrócił do recovery `0.980`, switch `0.026` i false-component selection `0.028`. Kontrole pozostały zachowane: recovery `1.000`, switch `0.000`. Representative hard modes dalej poprawiają identity metrics względem `safe_fallback_base`: recovery `0.992` vs `0.748`, switch `0.010` vs `0.256`.

Interpretacja: v0.12.1 zachowuje v0.11.1-level identity metrics na easy false-blob w tym targetowanym audycie i utrzymuje poprawę hard modes. Confidence/risk wygląda lepiej niż w reduced-sample v0.12, ale confidence calibration pozostaje otwartym problemem. To nadal local toy diagnostic.

Zastrzeżenie: nie benchmark; nie broad robustness; nie rozwiązane re-identification, appearance memory ani confidence calibration.

## v0.13, Confidence / risk calibration audit

v0.13 audytuje confidence/risk calibration dla observation reliability. Image-derived reliability i disagreement risk signals identyfikują wiele false-selection i identity-switch risks na sprawdzonym lokalnym gridzie, umożliwiając conservative abstention bez held-out threshold leakage.

To nadal toy diagnostic: nie rozwiązuje re-identification, appearance memory, confidence calibration ani broad noisy-reappearance robustness.

## v0.14, Risk-aware selective update policy audit

v0.14 testuje risk-aware selective update policies dla observation reliability. Na sprawdzonym
lokalnym gridzie image-derived risk pomógł wybrać `hold_previous_state`: held-out hard switch
spadł do `0.000`, a false selection lekko spadło względem accept baseline, przy zachowanych
kontrolach.

To nadal toy diagnostic: nie rozwiązuje re-identification, confidence calibration ani broad
noisy-reappearance robustness.

## v0.14.1, Hold-policy stress audit

v0.14.1 stress-testuje hold-based risk-aware update policy na szerszym checked gridzie.
`hold_previous_state/conservative` utrzymał hard-mode switch na `0.000` i obniżył control
intervention cost do `0.090`, ale nie osiągnął celu `0.075`, a część mode-specific
false-selection issues pozostaje.

To nadal toy diagnostic: nie rozwiązuje re-identification, confidence calibration ani broad
noisy-reappearance robustness.

## v0.14.2, Hold-policy Pareto audit

v0.14.2 mapuje threshold tradeoff dla hold-based risk-aware updates. Na sprawdzonym gridzie
`hold_previous_state/conservative` pozostaje zero-switch candidate, ale niższy intervention cost
wymaga oddania części identity safety. Wynik pozostaje local toy diagnostic.

To nie rozwiązuje re-identification, confidence calibration ani broad noisy-reappearance
robustness.

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

Aktualny stan: MOCPS ma stabilny single-object wynik, a ścieżka slot-memory przeszła przez stałoprędkościową okluzję. v0.10 pokazał awarię przy akceleracji, v0.10.2 dał częściową poprawkę przez safe fallback, v0.11 pokazał false-component re-binding, v0.11.1 mocno ograniczył ten konkretny failure mode przez image-derived reliability gating, v0.12 pokazał częściową generalizację na trudniejsze false bloby, v0.12.1 odrzucił easy false-blob regression jako stabilną pod większą targetowaną próbką, v0.13 pokazał użyteczne image-derived risk signals bez rozwiązania confidence calibration, v0.14 pokazał, że `hold_previous_state` może poprawić checked hard-mode update behavior bez held-out threshold leakage, v0.14.1 pokazał, że control intervention cost nadal wymaga redukcji, a v0.14.2 zmapował tradeoff między niższym kosztem a identity safety. Najsilniejszy publiczny wynik bazowy to cold run `200/200` przeciw persystencji na pokrytej powierzchni.

To nie kończy tematu. To raczej zamyka pierwszy stabilny etap: mam przepis, który działa na znanych światach i baseline’ach, i mogę zacząć pytać, gdzie pęknie.

## Dokąd zmierzam

Następne testy powinny być trudniejsze i mniej wygodne:

- moving distractor: pierwsza wersja testu łamie aktualny single-object MOCPS; selection audit pokazuje, że poprawny target selection naprawia checked grid
- crossing objects: v0.8 łamie feed-forward trainable assignment po zamianie left/right; v0.8.1 naprawia checked crossing przez pamięć slotu
- krótka okluzja: v0.9 rozdziela zwykłą pamięć od predictive memory; v0.9.1 pokazuje learned gate na checked gridzie
- szerszy stress test dla risk-aware update policies bez tuningu na held-out hard modes
- noisy background
- więcej niż jeden poruszający się obiekt
- testy transferu między world variants

Najbliższy kierunek to szerszy stress test dla `hold_previous_state` i niższy koszt interwencji
na kontrolach, bez claimu o szerokim re-identification.

## Czego to nie znaczy

To nie jest benchmark, SOTA, dowód rozumienia fizyki, ogólny world model ani twierdzenie, że JEPA działa. To mały, uczciwie ograniczony wynik diagnostyczny.


## Wynik (maj 2026): diagram fazowy stałości obiektu

Wskrzesiłem ten eksperyment i puściłem go z prawdziwym rygorem: nauczona pamięć rekurencyjna kontra uczciwe baseline'y (ekstrapolacja stałej prędkości oraz ręcznie kodowana pamięć predykcyjna), na zadaniu utrzymania tożsamości obiektu przez zasłonięcie. Pięć seedów na komórkę, wszystko na CPU.

Najpierw uczciwie: **na zwykłej predykcji pozycji nauczony model nie daje nic.** Trywialny baseline „stała prędkość" jest niemal idealny (0,00 px na świecie bez odbić). „Bije persystencję" (222/222) to iluzja, bo persystencja zakłada, że obiekt stoi w miejscu, więc to słaby punkt odniesienia.

Wartość pojawia się dopiero pod **okluzją**, gdy obserwacja przestaje wystarczać. Mierzę ją jako trafność przypisania tożsamości PO zasłonięciu (0–1):

| reżim | długość okluzji | velocity (bez pamięci) | pamięć ręczna | nauczona |
| --- | :---: | :---: | :---: | :---: |
| brak / łagodne przyśp. | 2–6 | 0,00 | 1,00 | **1,00** |
| zmiana kierunku za zasłoną | 4 | 0,18 | 0,33 | **1,00** |
| zmiana kierunku za zasłoną | 6 | 0,00 | 0,50 | 0,57 |
| silne przyśpieszenie | 2 | 0,75 | 0,67 | **0,03** |
| silne przyśpieszenie | 4–6 | 0,00 | ~1,0 | 0,81–0,98 |

![Diagram fazowy przewagi uczenia w trybach przyśpieszenia i długościach okluzji](/mocps/fig1_phase.png)

*Diagram fazowy. Na całym przemiataniu uczenie wygrywa dokładnie w jednej komórce (zmiana kierunku, L=4, +0,67, obwódka). Wszędzie indziej albo remisuje z pamięcią ręczną (żółć, V≈0), albo przegrywa w rogu ograniczonym separacją (czerwień).*

**Najciekawsze:** przy zmianie kierunku za zasłoną (długość 4) nauczona pamięć osiąga 1,00, a ekstrapolacja prędkości (0,18) oraz pamięć ręczna (0,33) padają. To jedyne miejsce, gdzie uczenie bije i fizykę, i strukturę: model utrzymuje tożsamość obiektu przez ruch, którego prosta ekstrapolacja nie przewiduje. To jest sens „modelu świata" w minimalnej wersji.

**Uczciwa granica:** przy silnym przyśpieszeniu i krótkiej okluzji (długość 2) nauczona brama pęka do 0,03, gorzej niż głupi baseline. Przy dłuższej okluzji wraca. Tego niemonotonicznego załamania jeszcze nie rozumiem i właśnie je badam. Pokazuję je, bo ukryty róg porażki to nie nauka.

Reprodukcja na CPU: `python -m jepa_petri.run_accel_occlusion_memory_mocps --occlusion-lengths 2 4 6 --horizons 1 --seeds 0 1 2 3 4 --device cpu`


## Naprawa: arbitraż hold/predict

Hipoteza się potwierdziła. Wariant z arbitrażem (decyduj: przytrzymaj ostatnią pozycję przy krótkiej okluzji, przewiduj przy długiej) domyka dół:

| silne przyśpieszenie | stara brama | po arbitrażu | orakulum dynamiki |
| :---: | :---: | :---: | :---: |
| L=1 | 0,15 | **1,00** | 1,00 |
| L=2 | 0,03 | 0,55 | 0,75 |
| L=3 | 0,88 | 0,98 | 1,00 |

Najuczciwszy szczegół: przy L=2 i silnym przyśpieszeniu nawet **orakulum** (model z idealną wiedzą o dynamice) osiąga tylko 0,75. Reszta luki nie jest więc winą modelu, tylko zadania: obiekty mijają się zbyt blisko, by je rozróżnić. To granica nieusuwalna, nie błąd, a arbitraż dochodzi blisko tego sufitu.

Pełny łuk: odtworzyłem wynik, zmapowałem diagram fazowy, znalazłem powtarzalną porażkę, zdiagnozowałem jej mechanizm, naprawiłem ją, i pokazałem, ile z reszty jest nie do naprawienia. To dla mnie jest „udowodnić, że działa": nie krzyk, tylko mapa.


## Dwa mechanizmy porażki (geometria)

Policzyłem, jak blisko mijają się obiekty w klatce powrotu (margines separacji). To rozdziela dwie zupełnie różne porażki:

- **Separacyjna:** przy silnym przyśpieszeniu i krótkiej okluzji obiekty mijają się o około 3 piksele. Trafne przypisanie wymaga błędu poniżej ~1,5 px. Nawet orakulum dobija tylko do 0,75. Tego nie naprawi żadne uczenie, to granica geometrii.
- **Dynamiczna:** przy zmianie kierunku za zasłoną separacja jest spokojna (~7,5 px), a baseline i tak pada (0,18), bo ekstrapoluje zły kierunek. Tu nauczony model trafia w 100%. To jedyne miejsce, gdzie uczenie naprawdę bije fizykę.

Zagregowane po separacji widać jeden próg. Powyżej około 6 px nauczony stan trzyma średnio 0,96 trafności wobec 0,14 dla velocity (18 komórek). W czterech komórkach, gdzie obiekty mijają się w około 3 px (mniej więcej jedna średnica), nauczony stan spada do 0,40 i przegrywa z bezpamięciowym baselinem (0,76). Próg leży na skali obiektu, dokładnie tam, gdzie dwie identyczne plamy przestają być rozróżnialne: poniżej żaden model dynamiki nie wygra, a sprytniejszy predyktor tylko dokłada wariancji.

![Dwa mechanizmy porażki: trafność tożsamości względem marginesu separacji](/mocps/fig2_mechanisms.png)

*Dwa mechanizmy są geometryczne i rozłączne. Na lewo od czerwonego pasa obiekty mijają się zbyt blisko, by je rozróżnić (nieusuwalne). Jedyny punkt, gdzie spokojny margines i tak pokonuje fizykę, zmiana kierunku przy L=4, to dokładnie miejsce, gdzie uczenie wygrywa.*