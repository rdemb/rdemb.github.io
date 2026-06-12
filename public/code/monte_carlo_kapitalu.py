"""Monte Carlo krzywych kapitału: matematyka przetrwania przy stałym ryzyku.

Materiał edukacyjny z bloga: https://rdemb.github.io/blog/matematyka-przetrwania/
To kalkulator pokory, nie obietnica wyniku. Trafność i RR podajesz z WŁASNYCH,
uczciwie policzonych testów (po kosztach twojego brokera), nie z marzeń.

Użycie:  python monte_carlo_kapitalu.py [trafnosc] [rr] [ryzyko_proc]
np.      python monte_carlo_kapitalu.py 0.45 1.8 0.5
"""

import sys
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
        "P(bankructwo: dd>=50%)": float((max_dd >= 0.50).mean()),
        "P(dd>=20%)": float((max_dd >= 0.20).mean()),
        "mediana_max_obsuniecia": float(np.median(max_dd)),
        "P(seria_strat>=8)": float((serie >= 8).mean()),
        "P(seria_strat>=12)": float((serie >= 12).mean()),
    }


if __name__ == "__main__":
    trafnosc = float(sys.argv[1]) if len(sys.argv) > 1 else 0.45
    rr = float(sys.argv[2]) if len(sys.argv) > 2 else 1.8
    for ryzyko in ([float(sys.argv[3])] if len(sys.argv) > 3 else [0.25, 0.5, 1.0, 2.0]):
        r = monte_carlo_kapitalu(trafnosc, rr, ryzyko)
        print(f"\n== trafność {trafnosc:.0%}, RR {rr}, ryzyko {ryzyko}% "
              f"(500 transakcji, 5000 ścieżek) ==")
        for k, v in r.items():
            print(f"  {k:28s} {v:8.3f}")
    # TODO: podmień losowanie na PRÓBKOWANIE z własnego dziennika transakcji
    # (bootstrap) — rozkład twoich zwrotów bywa gorszy niż dwupunktowy.
