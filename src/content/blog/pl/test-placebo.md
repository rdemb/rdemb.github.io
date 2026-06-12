---
title: "Test placebo: jak nie uwierzyć własnemu backtestowi (Python)"
lang: "pl"
kind: "trading"
date: "2026-06-12"
excerpt: "Backtest na plusie to za mało. Zanim uwierzysz strategii, sprawdź, czy nie bije jej dwa tysiące strategii losowych. Trzydzieści linii Pythona, które oszczędziły mi więcej pieniędzy niż jakikolwiek wskaźnik."
key: "test-placebo"
slug: "test-placebo"
---

Najdroższy moment w algotradingu to ten, w którym backtest pokazuje krzywą kapitału rosnącą w prawo i w górę. Drożeje od tego, co robisz dalej. Ja przez lata robiłem to, co wszyscy: cieszyłem się i odpalałem na demo. Dziś robię coś innego i to jest najważniejsze trzydzieści linii kodu w moim warsztacie.

Pomysł pożyczyłem z medycyny. Nowy lek nie musi po prostu działać, musi działać lepiej niż tabletka z cukru podana tak samo. Strategia nie musi po prostu zarabiać na historii, musi zarabiać lepiej niż strategia losowa, która wchodzi tyle samo razy, w te same warunki kosztowe, tylko bez żadnego pomysłu. Jeśli twoja przewaga nie odróżnia się od dwóch tysięcy małp rzucających lotkami w wykres, to nie jest przewaga. To szum, który akurat ułożył się w uśmiech.

## Kod

```python
import numpy as np

def test_placebo(zwroty_nastepnej_swiecy, sygnal, n_placebo=2000, seed=0):
    """Czy strategia bije losowe strategie o tej samej liczbie wejść?

    zwroty_nastepnej_swiecy: tablica zwrotów świecy następującej po sygnale
    sygnal: tablica bool, True tam, gdzie strategia wchodzi (long)
    Zwraca (wynik_strategii, p_value).
    """
    rng = np.random.default_rng(seed)
    zwroty = np.asarray(zwroty_nastepnej_swiecy, dtype=float)
    sygnal = np.asarray(sygnal, dtype=bool)
    k = int(sygnal.sum())
    wynik = zwroty[sygnal].sum()

    lepsze = 0
    for _ in range(n_placebo):
        losowy = np.zeros(len(zwroty), dtype=bool)
        losowy[rng.choice(len(zwroty), size=k, replace=False)] = True
        if zwroty[losowy].sum() >= wynik:
            lepsze += 1
    return wynik, (lepsze + 1) / (n_placebo + 1)
```

Użycie: bierzesz swoje dane, liczysz zwroty świecy następującej po każdym punkcie (dla shortów odwracasz znak), budujesz tablicę `sygnal` z reguły strategii i wywołujesz funkcję. Wynik to suma zwrotów twoich wejść oraz p, czyli odsetek losowych strategii, które wypadły co najmniej tak dobrze jak twoja.

Zanim wkleiłem ten kod tutaj, sprawdziłem go tak, jak sprawdzam strategie. Na czystym szumie z losowym sygnałem p wyszło 0.56, czyli moneta, zgodnie z prawdą. Po wszczepieniu w te same dane sztucznej przewagi p spadło do 0.002. Test odróżnia jedno od drugiego i to jest cała jego praca.

## Jak czytać p i jak się nie oszukać

Małe p, powiedzmy poniżej 0.01, znaczy tyle: bardzo rzadko zdarza się małpa, która pobiła twoją strategię. To jeszcze nie dowód przewagi, ale poważny powód, żeby testować dalej. Wartość p w okolicach 0.2 albo 0.5 znaczy, że twoja reguła robi mniej więcej to, co losowanie, i żadna optymalizacja progu tego nie uratuje, bo optymalizowałbyś szum.

Trzy pułapki, każdą znam od środka. Pierwsza: jeśli przetestujesz dwadzieścia pomysłów, jeden wyjdzie z p poniżej 0.05 czystym przypadkiem, więc kryteria zapisz z góry, zanim zobaczysz wynik, i licz wszystkie próby, też te nieudane. Druga: koszty. Tablica zwrotów musi mieć odjęty spread i poślizg od każdego wejścia, u twojego brokera inne niż u mojego, inaczej testujesz świat, w którym broker dopłaca. Trzecia: ten test sprawdza wybór momentów wejścia przy ustalonej liczbie transakcji. Nie sprawdza zarządzania pozycją ani tego, czy strategia przeżyje inne lata niż te w teście, od tego są dane poza próbą.

U mnie ten test ma swój mały pomnik. Dziewięć razy z rzędu zabijał fronty badań, które wyglądały obiecująco: układy świec, godzinowe wzorce, tryby rynku, makro. Dziewięć razy oszczędził mi miesięcy budowania automatu na piasku. Każdy kolejny pomysł, łącznie z tymi, o których piszę na tym blogu, przechodzi najpierw przez niego. Wklej go do swojego warsztatu i niech będzie bezlitosny także dla twoich ulubionych pomysłów. Zwłaszcza dla ulubionych.
