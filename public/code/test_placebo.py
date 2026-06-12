"""Test placebo dla strategii: czy bijesz losowe wejścia, czy tylko szum?

Materiał edukacyjny z bloga: https://rdemb.github.io/blog/test-placebo/
To narzędzie do ODRZUCANIA pomysłów, nie gotowa strategia.

Demo działa na dołączonym pliku syntetycznym EURUSD_H1_syntetyk.csv
(wygenerowanym, z nagłówkiem ostrzegawczym). Na realne dane: eksport z MT5,
PAMIĘTAJ o odjęciu spreadu i poślizgu twojego brokera od zwrotów wejść.
"""

import numpy as np
import pandas as pd


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


if __name__ == "__main__":
    df = pd.read_csv("EURUSD_H1_syntetyk.csv", comment="#", parse_dates=["czas"])
    # zwrot świecy NASTĘPNEJ po każdym punkcie decyzji
    zwroty = df["close"].diff().shift(-1).fillna(0).to_numpy()

    # TODO: tu wstaw SWOJĄ regułę zamiast tej zabawkowej.
    # Przykład (celowo banalny): wejście po godzinie 13 czasu danych.
    sygnal = (df["czas"].dt.hour == 13).to_numpy()

    wynik, p = test_placebo(zwroty, sygnal)
    print(f"wejść: {sygnal.sum()} | wynik: {wynik:+.5f} | p = {p:.3f}")
    print("p < 0.01: rzadka małpa cię bije — testuj dalej (dane poza próbą!).")
    print("p > 0.2 : twoja reguła to losowanie w przebraniu. Następny pomysł.")
