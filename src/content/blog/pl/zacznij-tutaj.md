---
title: "Zacznij tutaj: mała szkoła uczciwego algotradingu"
lang: "pl"
kind: "trading"
date: "2026-06-12"
excerpt: "Mapa tego bloga dla kogoś, kto chce budować automaty na rynku i nie okłamywać się po drodze. Kolejność czytania, kod do pobrania i jedna zasada, która spina całość."
key: "zacznij-tutaj"
slug: "zacznij-tutaj"
---

Ten blog urósł i pora na mapę. Jeśli interesuje cię budowanie automatów na rynku, a przy tym wolisz wiedzieć niż wierzyć, poniżej jest kolejność, w jakiej sam bym to czytał. Jedna zasada spina całość: najpierw nauczyć się odrzucać złe pomysły, dopiero potem budować na tych, które przetrwały.

## Krok 1: skala oczekiwań

Zacznij od [prawdy o day tradingu](/blog/day-trading-truth/), bo wszystko dalej zakłada, że nie szukasz drogi na skróty. Potem [czego nauczyły mnie wskaźniki](/blog/indicators-i-trusted/) i [jak testuję pomysł](/blog/testing-a-trading-idea/), żeby zobaczyć, jak wygląda praca z hipotezą zamiast z przeczuciem.

## Krok 2: rynek mierzony, nie zgadywany

Cztery wpisy o tym, co w rynku naprawdę daje się policzyć i co z tego wynika. [Zegar zmienności](/blog/zegar-zmiennosci/): rynek ma rozkład dnia i świeca bez godziny to wybrakowana informacja. [Mapa dnia](/blog/mapa-dnia/): zamiast pytać dokąd pójdzie, pytaj, czy dzisiejsze ekstremum już jest. [Czas w ryzyku](/blog/czas-w-ryzyku/): metryka, której nie ma w żadnym raporcie brokera. I [podział pracy między człowieka i maszynę](/blog/czlowiek-i-maszyna/), czyli czego automat nie powinien robić nigdy, bo sprawdziłem dziewięcioma frontami badań.

## Krok 3: warsztat z kodem

Tu zaczyna się część do kopiowania, w kolejności montażu. Najpierw [test placebo](/blog/test-placebo/), bo to jest sito, przez które przepuszczasz wszystko dalej. Potem [szkielet EA](/blog/szkielet-ea/), hydraulika bez sygnału. Na szkielet nakładasz filtry: [zegar zmienności w praktyce](/blog/zegar-zmiennosci-w-praktyce/) i [budżet dnia](/blog/budzet-dnia-filtr/). Na koniec zarządzanie: [trailing krokowy](/blog/ea-trailing-krokowy/), [cisza wokół newsów](/blog/ea-blackout-newsow/) i [wiele par ze wspólnym ryzykiem](/blog/ea-wiele-par/).

Kod z tych wpisów leży też w plikach, razem z syntetycznymi danymi do ćwiczeń:

- [dlogic-szkielet-ea.mq5](/code/dlogic-szkielet-ea.mq5), szkielet EA do MetaEditora,
- [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), wszystkie funkcje warsztatu w jednym include,
- [test_placebo.py](/code/test_placebo.py) i [zegar_zmiennosci.py](/code/zegar_zmiennosci.py),
- [EURUSD_H1_syntetyk.csv](/code/EURUSD_H1_syntetyk.csv), dane wygenerowane do nauki, z ostrzeżeniem w nagłówku.

Uprzedzam, bo o to pytacie: te pliki celowo nie są gotowym systemem. Sygnał jest pusty, progi są przykładowe, a parametry dobiera się na danych własnego brokera, nie moich. To jest warsztat i materiał do rozwijania, nie produkt. Gotowych systemów z internetu nie polecam, włącznie z moim, gdybym kiedyś osłabł i jakiś wystawił.

## Krok 4: głębiej

Jak działa [ukryty model Markowa](/blog/hmm-tryb-rynku/) i czemu tryb rynku to kontekst, nie sygnał. [Rynek jako aukcja](/blog/market-as-auction/) i [rynek jako organizm](/blog/market-as-organism/), czyli rama pojęciowa. A kiedy zechcesz zobaczyć, jak te same zasady rygoru wyglądają poza rynkiem, obejrzyj [żywy model świata](/projekty/mocps/), który uczy się fizyki i jest mierzony tym samym duchem: baseline, placebo, uczciwe granice.

Codzienny rytm dochodzi w [briefach FX](/blog/fx-brief-2026-06-12/), a całość można śledzić przez [RSS](/rss.xml). Po drodze będę dokładał kolejne elementy i ta mapa będzie rosła razem z blogiem.
