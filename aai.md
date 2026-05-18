---
layout: page
title: "AAI"
lang: pl
en_url: /en/aai/
de_url: /de/aai/
permalink: /aai/
---

AAI, czyli **Adaptive Auction Intelligence**, to mój paradygmat czytania rynku jako aukcji, a nie jako zbioru pojedynczych wskaźników.

Najkrócej: najpierw struktura rynku, potem scenariusz. Najpierw koszt wykonania, świeżość danych i pamięć podobnych setupów, potem kierunek. Brak przewagi nie jest porażką systemu. Jest wynikiem.

## Pytanie

Czy da się zbudować lokalną, deterministyczną warstwę market intelligence, która pomaga operatorowi odróżnić:

- kontekst od setupu,
- setup od egzekucji,
- narrację od dowodu,
- aktywność od przewagi.

To nie jest próba stworzenia autonomicznego bota P&L. AAI ma być recenzentem rynku: mówi, co widać w aukcji, co jest sprzeczne, czego brakuje i kiedy lepiej nie robić nic.

## Paradygmat

Rdzeń AAI jest prosty:

> No-Edge = No-Trade.

System ma prawo milczeć. Ma prawo powiedzieć, że tło jest ciekawe, ale setup nie ma akceptacji ceny. Ma prawo pokazać konflikt między aukcją, kosztem wykonania, orderflow i pamięcią historycznych przypadków.

W praktyce AAI rozkłada decyzję na warstwy:

1. **Reżim**: trend, range, kompresja, ekspansja, choppy.
2. **Aukcja**: value migration, acceptance, rejection, sweep, równowaga.
3. **Mikrostruktura**: orderflow, delta, DOM, footprint, micro-price.
4. **Egzekucja**: spread, fee, slippage, adverse selection, fill quality.
5. **Pamięć**: podobne setupy i ich historyczne outcome.
6. **Evidence Review**: czy teza ma wsparcie w danych, czy tylko dobrze brzmi.

Żadna pojedyncza warstwa nie ma prawa udawać całej prawdy.

## Architektura

AAI działa jako lokalna warstwa analityczna. Hot path jest deterministyczny: bez LLM w runtime, bez zewnętrznego modelu językowego jako decydenta, bez ukrytej narracji.

Kanoniczny przepływ wygląda tak:

```text
local market data
  -> auction state
  -> microstructure context
  -> execution cost
  -> memory / replay
  -> evidence review
  -> operator context
```

Wynikiem nie jest komenda "kup" albo "sprzedaj". Wynikiem jest kontekst: typ aukcji, kierunek roboczy jeśli istnieje, poziom konfliktu, koszt wykonania, jakość danych i powód ewentualnego no-trade.

## Co mierzę

AAI nie jest oceniane po tym, czy brzmi mądrze. Interesują mnie metryki, które karzą storytelling:

- MFE / MAE po wejściu,
- win rate po horyzontach 5 / 15 / 60 minut,
- koszt wejścia względem idealnego poziomu,
- slippage i fee sensitivity,
- odsetek poprawnych abstain,
- zachowanie po kosztach,
- degradacja poza próbą.

Jeśli setup działa tylko przed kosztami, nie jest setupem. Jeśli działa tylko przy idealnym fillu, jest kruchy. Jeśli działa tylko w jednym oknie, zostaje research-only.

## Aktualny wynik

Najważniejszy publiczny wynik jest negatywny i dlatego wartościowy.

W pre-validation standalone agenty AAI nie przeszły bramki po kosztach na dłuższym horyzoncie. Decyzja: nie traktować AAI jako samodzielnego generatora sygnałów. Lepsza rola to **state encoder** i **evidence layer**: warstwa, która opisuje aukcję, wykrywa konflikt i pomaga operatorowi nie mylić kontekstu z przewagą.

To przesuwa projekt z pytania "czy AAI przewiduje kierunek?" na lepsze pytanie:

> Czy AAI potrafi poprawić selekcję, abstain rate i jakość wejścia, gdy jest użyte jako filtr dowodów?

## Decyzja projektowa

AAI pozostaje projektem badawczym i narzędziem operatora.

Nie publikuję tu sygnałów, poziomów wejścia, live raportów, logów, prywatnych feedów ani wyników, które można pomylić z rekomendacją. Publicznie pokazuję paradygmat: evidence-first, local-first, no-edge-first.

## Caveats

- To nie jest porada inwestycyjna.
- To nie jest autonomiczny bot tradingowy.
- To nie jest obietnica przewagi rynkowej.
- Negatywne wyniki są częścią projektu.
- Każda promocja z research do praktyki wymaga replay, kosztów, OOS i jasnych kill-switchy.
