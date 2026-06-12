"""Zegar zmienności: profil godzinowy rynku i normalizacja ruchu.

Materiał edukacyjny z bloga: https://rdemb.github.io/blog/zegar-zmiennosci-w-praktyce/
Zegar mówi, ILE rynek zwykle daje o danej godzinie — nigdy DOKĄD pójdzie.

Demo działa na dołączonym pliku syntetycznym EURUSD_H1_syntetyk.csv.
Na realne dane: eksport z MT5; profil zależy od strefy czasu serwera
i sklejania świec TWOJEGO brokera, więc policz go na danych, którymi grasz.
"""

import pandas as pd


def profil_godzinowy(df, kol_close="close"):
    """Typowy |ruch| na godzinę doby (mediana), z ramki z kolumną czasu."""
    df = df.copy()
    df["zwrot"] = df[kol_close].diff().abs()
    df["godzina"] = df["czas"].dt.hour
    return df.groupby("godzina")["zwrot"].median()


def ruch_znormalizowany(ruch, godzina, profil):
    """Ile typowych ruchów tej godziny wynosi bieżący ruch."""
    typowy = profil.get(godzina, profil.median())
    return ruch / typowy if typowy > 0 else 0.0


if __name__ == "__main__":
    df = pd.read_csv("EURUSD_H1_syntetyk.csv", comment="#", parse_dates=["czas"])
    profil = profil_godzinowy(df)
    print("Twój zegar (mediana |ruchu| na godzinę):")
    print(profil.round(6).to_string())
    print()
    for g in (3, 9, 14):
        x = ruch_znormalizowany(0.0025, g, profil)
        print(f"25 pipsów o {g:02d}:00 = {x:5.1f} typowego ruchu tej godziny")
    # TODO: wpleć w swój research — np. próg zaskoczenia (>3 typowych)
    # albo filtr kosztu (spread / typowy ruch godziny > 0.25 -> nie graj).
