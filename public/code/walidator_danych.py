"""Walidator danych OHLC: znajdź grzechy w pliku, zanim one znajdą ciebie.

Materiał edukacyjny z bloga: https://rdemb.github.io/blog/dane-pierwszy-grzech/
To narzędzie diagnostyczne, nie gotowa strategia. Progi dobierz pod swoje dane.

Użycie:  python walidator_danych.py [plik.csv]
Domyślnie czyta dołączony EURUSD_H1_syntetyk.csv (czysty, więc raport nudny;
w bloku demo wszczepiamy wady, żeby pokazać, jak wyglądają wykryte).
Format: kolumny czas,open,high,low,close; znacznik czasu strefowy lub naiwny.
"""

import sys
import pandas as pd


def waliduj(df):
    """Raport grzechów ramki OHLC H1: dziury, duplikaty, zera, skoki, DST."""
    r = {}
    df = df.sort_values("czas").reset_index(drop=True)
    r["duplikaty_czasu"] = int(df["czas"].duplicated().sum())

    # dziury: brakujące godziny pn-pt (weekend FX wycięty z siatki)
    pelna = pd.date_range(df["czas"].min(), df["czas"].max(),
                          freq="h", tz=df["czas"].dt.tz)
    pelna = pelna[pelna.dayofweek < 5]
    r["dziury_godzinowe"] = int(len(set(pelna) - set(df["czas"])))

    r["swiece_weekendowe"] = int((df["czas"].dt.dayofweek >= 5).sum())
    r["high<low"] = int((df["high"] < df["low"]).sum())
    r["zakres_zero"] = int(((df["high"] - df["low"]) == 0).sum())

    z = df["close"].diff().abs()
    r["skoki>10x_mediana"] = int((z > 10 * z.median()).sum())

    # DST-artefakt: KOŁOWY środek profilu aktywności, miesiąc po miesiącu.
    # Doba jest cykliczna (po 23 przychodzi 0), więc zwykła średnia godzin
    # kłamie przy zawinięciu — godziny rzutujemy na okrąg i uśredniamy
    # wektorowo. Przy stałym zegarze środek stoi; gdy broker przestawia czas,
    # przesuwa się o ~1 h, a każda statystyka "per godzina" liczona na całym
    # pliku jest wtedy skażona.
    import numpy as np
    g = df["czas"].dt.hour
    mies = df["czas"].dt.tz_localize(None).dt.to_period("M") \
        if df["czas"].dt.tz is not None else df["czas"].dt.to_period("M")
    prof = z.groupby([mies, g]).median().unstack().fillna(0.0)
    kat = 2 * np.pi * prof.columns.to_numpy(dtype=float) / 24.0
    w = prof.to_numpy()
    srodki = (np.arctan2((w * np.sin(kat)).sum(axis=1),
                         (w * np.cos(kat)).sum(axis=1)) % (2 * np.pi)) * 24 / (2 * np.pi)
    def dyst_kolowy(a, b):
        d = abs(a - b)
        return min(d, 24 - d)
    rozstep = max(dyst_kolowy(a, b) for a in srodki for b in srodki)
    r["kolowy_srodek_aktywn"] = [round(float(s), 2) for s in srodki]
    r["rozstep_srodka_h"] = round(float(rozstep), 2)
    r["podejrzenie_zmiany_zegara"] = bool(rozstep > 0.8)
    return r


def raportuj(r):
    print(f"{'duplikaty czasu':28s} {r['duplikaty_czasu']}")
    print(f"{'dziury godzinowe (pn-pt)':28s} {r['dziury_godzinowe']}")
    print(f"{'świece weekendowe':28s} {r['swiece_weekendowe']}")
    print(f"{'high < low':28s} {r['high<low']}")
    print(f"{'zakres zero':28s} {r['zakres_zero']}")
    print(f"{'skoki >10x mediany':28s} {r['skoki>10x_mediana']}")
    print(f"{'kołowy środek aktywn. (h)':28s} {r['kolowy_srodek_aktywn']}")
    print(f"{'rozstęp środka (h)':28s} {r['rozstep_srodka_h']}"
          + ("  <- ZEGAR SIĘ PRZESUNĄŁ (DST?)" if r["podejrzenie_zmiany_zegara"] else ""))


if __name__ == "__main__":
    plik = sys.argv[1] if len(sys.argv) > 1 else "EURUSD_H1_syntetyk.csv"
    df = pd.read_csv(plik, comment="#", parse_dates=["czas"])
    print(f"== {plik}: {len(df)} świec ==")
    raportuj(waliduj(df))

    if len(sys.argv) == 1:
        # demo na dołączonym syntetyku: wszczepiamy wady, żeby zobaczyć raport
        print("\n== ten sam plik z WSZCZEPIONYMI wadami (demo) ==")
        zle = df.drop(index=range(500, 530))            # dziura 30 godzin
        zle = pd.concat([zle, df.iloc[[100]]])          # duplikat
        zle.loc[200, "high"] = zle.loc[200, "low"] - 1e-4  # high < low
        # DST-artefakt: od połowy pliku "broker" przestawia zegar o godzinę
        zle = zle.reset_index(drop=True)
        pol = len(zle) // 2
        zle.loc[pol:, "czas"] = zle.loc[pol:, "czas"] + pd.Timedelta(hours=1)
        raportuj(waliduj(zle))
        # TODO: dołóż własne testy — np. porównanie z drugim brokerem,
        # świece o północy serwera, wolumen zero przy ruchu ceny.
