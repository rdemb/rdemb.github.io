---
title: "Matematyka przetrwania: ile naprawdę kosztuje twoje 2% ryzyka (Python)"
lang: "pl"
kind: "trading"
date: "2026-06-12"
excerpt: "Przy 45% trafności seria ośmiu strat z rzędu to nie pech, to plan: wypada w 84% symulowanych historii. Monte Carlo krzywych kapitału, które pokazuje, czego twoja psychika nie wytrzyma, zanim to przeżyjesz."
key: "matematyka-przetrwania"
slug: "matematyka-przetrwania"
---

Jest taki rachunek, którego prawie nikt nie robi przed pierwszą wpłatą, a który zmienia wszystko. Nie dotyczy wejść ani wskaźników. Dotyczy tego, co się dzieje z kontem i z głową, kiedy strategia o znanej trafności po prostu robi swoje przez pięćset transakcji. Wiele osób ma plan na zyski. Prawie nikt nie ma planu na statystycznie pewną serię strat.

Rachunek robi się w trzydzieści sekund symulacją. Bierzesz trafność i stosunek zysku do ryzyka ze swoich uczciwych testów, po kosztach, ustalasz procent ryzyka na transakcję i puszczasz pięć tysięcy alternatywnych historii swojego konta.

```python
import numpy as np

def monte_carlo_kapitalu(trafnosc, rr, ryzyko_proc,
                         n_transakcji=500, n_sciezek=5000, seed=0):
    """Rozkład losów konta przy stałym % ryzyka na transakcję."""
    rng = np.random.default_rng(seed)
    wygrane = rng.random((n_sciezek, n_transakcji)) < trafnosc
    zwroty = np.where(wygrane, ryzyko_proc * rr / 100.0,
                              -ryzyko_proc / 100.0)
    kapital = np.cumprod(1 + zwroty, axis=1)
    szczyt = np.maximum.accumulate(kapital, axis=1)
    obsuniecie = 1 - kapital / szczyt
    max_dd = obsuniecie.max(axis=1)

    def max_seria_strat(w):
        s = m = 0
        for x in w:
            s = 0 if x else s + 1
            m = max(m, s)
        return m
    serie = np.array([max_seria_strat(w) for w in wygrane[:1000]])

    return {
        "mediana_kapitalu_na_koncu": float(np.median(kapital[:, -1])),
        "P(dd>=20%)": float((max_dd >= 0.20).mean()),
        "mediana_max_obsuniecia": float(np.median(max_dd)),
        "P(seria_strat>=8)": float((serie >= 8).mean()),
    }
```

Teraz liczby, bo o nie tu chodzi. Wziąłem przyzwoity, realistyczny profil: trafność 45%, zysk 1.8 raza większy od ryzyka. To jest strategia z dodatnią przewagą, którą wielu chciałoby mieć. I puściłem ją w dwóch wariantach ryzyka.

Przy ryzyku 0.5% na transakcję mediana konta po pięciuset transakcjach to 1.89, typowe maksymalne obsunięcie 6.4%, a szansa, że kiedykolwiek zobaczysz obsunięcie 20%, wychodzi zero na pięć tysięcy historii. Przy ryzyku 2% na tę samą strategię mediana rośnie do 11, ale obsunięcie 20% lub gorsze trafia się w 77% historii, a typowe maksymalne obsunięcie to 24%. Ta sama przewaga, te same wejścia. Inna geometria.

Najważniejsza liczba jest jednak gdzie indziej i dotyczy obu wariantów tak samo: seria co najmniej ośmiu strat z rzędu wypada w 84% historii, a co najmniej dwunastu w 15%. Powtórzę, bo to jest sedno: przy czterdziestopięcioprocentowej trafności osiem porażek z rzędu to nie znak, że strategia umarła. To statystyczna pewność, którą trzeba mieć wpisaną w plan i w psychikę, zanim się wydarzy. Ludzie nie porzucają strategii dlatego, że przestała działać. Porzucają ją w okolicach szóstej straty z rzędu, dwie straty przed tym, co matematyka miała w planie od początku.

Sanity check, bez którego nie publikuję kodu: dla monety bez przewagi, trafność 50% przy RR 1, mediana wychodzi 0.975, lekko pod kreską. Tak ma być, to geometria procentu składanego, strata 1% wymaga odrobienia więcej niż 1%. Symulator nie obiecuje, symulator liczy.

Skrypt do pobrania: [monte_carlo_kapitalu.py](/code/monte_carlo_kapitalu.py), z parametrami z linii poleceń i jednym TODO, które ma znaczenie: zamiast monety o stałej trafności możesz próbkować z własnego dziennika transakcji, bo prawdziwe rozkłady zwrotów bywają gorsze niż dwupunktowe. Trafność i RR bierz ze swoich testów po kosztach twojego brokera, przepuszczonych najpierw przez [test placebo](/blog/test-placebo/). A wartość ryzyka na transakcję wybierz tak, żeby obsunięcie, które symulator pokazuje jako typowe, było czymś, na co naprawdę umiesz patrzeć tydzień po tygodniu. U mnie w [szkielecie EA](/blog/szkielet-ea/) zakres wejściowy kończy się na 2% nie przez przypadek.
