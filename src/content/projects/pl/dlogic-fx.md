---
title: "D-LOGIC FX"
lang: "pl"
kind: "project"
excerpt: "Półautomatyczny koncept day-tradingu na FX. Maszyna mapuje strukturę dnia, kierunek bierze człowiek."
key: "dlogic-fx"
slug: "dlogic-fx"
---
D-LOGIC FX to mój koncept day-tradingu na rynku walutowym, zbudowany wokół jednej niewygodnej obserwacji: na danych detalicznych, po kosztach, cena nie przewiduje własnego kierunku. Sprawdziłem to na osiemnastu niezależnych frontach. Za każdym razem ten sam wynik.

Więc odwracam problem. Zamiast zmuszać maszynę, żeby zgadywała kierunek, każę jej mapować to, co naprawdę jest przewidywalne w strukturze dnia. Kierunek zostaje przy człowieku. Maszyna podaje kontekst, ryzyko i moment. Decyzję podejmuję ja.

Odnośnik powyżej otwiera ten koncept w nowej karcie jako żywą sieć 3D: rdzeń, sześć gałęzi i ich składowe. W środku obracasz scenę, przybliżasz i najeżdżasz na dowolny węzeł, żeby go odczytać.

## Teza

> Kierunek to szum. Struktura to sygnał.

Osiemnaście prób przewidzenia kierunku na danych detalicznych. Po uwzględnieniu spreadu i prowizji żadna nie przetrwała. To nie jest porażka. To jest wynik, i mówi mi, gdzie nie szukać przewagi.

Struktura dnia zachowuje się inaczej. Rytm zmienności, kolejność sesji, prawdopodobieństwo nowego maksimum albo minimum dnia z danego stanu. To są rzeczy mierzalne i powtarzalne. Na nich buduję.

## Dane

Fundamentem jest cena w wielu interwałach (M5, M15, D1) dla pięciu głównych par walutowych, zrekonstruowana w czasie brokera, z blisko dwudziestoma latami historii dziennej. Około sześciu tysięcy dni. Tyle potrzeba, żeby test poza próbą był uczciwy, a nie kosmetyczny.

## Pięć warstw

Każda warstwa to mechanicznie umotywowany odczyt dnia, który przeszedł swoją bramkę.

- **Mapa dnia (hazard)**. Żywe prawdopodobieństwo nowego ekstremum dnia z bieżącego stanu. Poza próbą AUC od 0,87 do 0,92, placebo 0,000. To najmocniejszy element konceptu.
- **Silnik zmienności**. Przewiduje zakres dnia, co daje sizing i poziomy stopów. R² od 0,12 do 0,30.
- **Budżet i timing**. Ile czasu warto siedzieć w ryzyku. Korelacja -0,48 z jakością okna.
- **VWAP-Fade**. Jedyny odczyt o zabarwieniu kierunkowym, który przeszedł poza próbą na wszystkich pięciu parach. Czy przetrwa koszty, rozstrzyga warstwa rygoru. Nie publikuję go jako sygnału.
- **Meta-labeling**. Warstwa, która uczy się mnie jako tradera. Obecnie w teście forward.

## Rygor

Nic nie wchodzi na wiarę. Każdy kandydat jest najpierw pre-rejestrowany, potem sądzony poza próbą, bity o placebo, filtrowany przez kontrolę false-discovery na całej siatce (q ≤ 0,10) i wyceniany po kosztach, zanim awansuje. Dochodzi do tego Deflated Sharpe Ratio, żeby nie nabrać się na samo przeszukiwanie.

Większość pomysłów ginie właśnie tutaj. Tak ma być.

## Mapa dnia w jednym panelu

Kokpit składa wszystkie warstwy w jeden widok. Na górze bias prawdopodobieństwa, niżej moja pozycja, magnesy ceny, zegar newsów. Na końcu jeden werdykt.

- **BIAS**. P w górę kontra w dół.
- **PULSE**. Zgodność wielu interwałów w skali od 0 do 100.
- **LEVELS**. Wczorajsze maksimum i minimum, cele.
- **NEWS**. Blackout ±15 minut wokół danych.
- **GO / NO-GO**. Jeden werdykt na wejściu.

Panel informuje. Nigdy nie pociąga za spust.

## Co pochowałem

Koncept jest tyle wart, ile pomysłów potrafi pogrzebać w świetle dnia. Te wyglądały mądrze i nie przewidywały niczego po rygorze:

- **Oscylator**. Information coefficient bliski zera.
- **Fibonacci**. Artefakt, znika przy uczciwym teście.
- **W-kształt na fixingu**. Ginie na kosztach.
- **Squeeze**. Nieistotny statystycznie.

Pokazuję je celowo. Uczciwość jest częścią tego konceptu.

## Rola człowieka

D-LOGIC FX działa w trybie OBSERVE_ONLY. Maszyna opisuje aukcję, wykrywa konflikt, mierzy koszt i moment. Kierunek, wielkość i sam fakt wejścia biorę na siebie. Żaden tekst modelu nie jest traktowany jak sygnał. Hot path jest deterministyczny, bez modelu językowego w runtime. Reguła rdzenia jest prosta: brak przewagi oznacza brak transakcji.

## Caveats

- To nie jest porada inwestycyjna.
- To nie jest autonomiczny bot tradingowy.
- To nie jest obietnica przewagi rynkowej.
- Wynik negatywny jest częścią projektu.
- Każdy awans z researchu do praktyki wymaga replay, kosztów, testu poza próbą i jawnych kill-switchy.
