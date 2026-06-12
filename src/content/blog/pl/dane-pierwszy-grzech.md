---
title: "Dane: pierwszy grzech każdego automatu (Python)"
lang: "pl"
kind: "trading"
date: "2026-06-12"
excerpt: "Zanim policzysz pierwszą statystykę, twoje dane już kłamią: dziury, duplikaty, świece-widma i zegar brokera, który dwa razy w roku przeskakuje o godzinę. Walidator do skopiowania i historia o tym, jak doba ugryzła mnie w kodzie."
key: "dane-pierwszy-grzech"
slug: "dane-pierwszy-grzech"
---

Mój automat dzienny miał kiedyś fazę, w której tester pokazywał co innego niż życie i nie umiałem znaleźć dlaczego. Winowajcą nie była strategia, tylko zegar: czas serwera mojego brokera chodzi za giełdą amerykańską i dwa razy w roku, przy zmianie czasu w USA, cała moja statystyka „per godzina” przesuwała się o jeden. Reguła ustawiona na 9:00 nagle żyła o 8:00. Od tamtej pory nie wierzę żadnemu plikowi z danymi, dopóki nie przejdzie kontroli. Dosłownie żadnemu.

To jest pierwszy grzech automatów: liczymy wyrafinowane rzeczy na danych, których nikt nie obejrzał. A lista typowych wad jest krótka i powtarzalna. Dziury po przerwach serwera. Zduplikowane znaczniki czasu po sklejaniu plików. Świece z high poniżej low, bo coś poszło nie tak przy eksporcie. Świece weekendowe, których na FX być nie powinno. Skoki o rząd wielkości, które są błędem feedu, nie ruchem. I właśnie zegar, najcichsza wada ze wszystkich, bo niczego nie psuje w pojedynczej świecy, tylko w każdej statystyce liczonej po godzinach.

## Walidator

```python
import pandas as pd

def waliduj(df):
    """Raport grzechów ramki OHLC H1: dziury, duplikaty, zera, skoki, DST."""
    r = {}
    df = df.sort_values("czas").reset_index(drop=True)
    r["duplikaty_czasu"] = int(df["czas"].duplicated().sum())

    pelna = pd.date_range(df["czas"].min(), df["czas"].max(),
                          freq="h", tz=df["czas"].dt.tz)
    pelna = pelna[pelna.dayofweek < 5]
    r["dziury_godzinowe"] = int(len(set(pelna) - set(df["czas"])))

    r["swiece_weekendowe"] = int((df["czas"].dt.dayofweek >= 5).sum())
    r["high<low"] = int((df["high"] < df["low"]).sum())
    r["zakres_zero"] = int(((df["high"] - df["low"]) == 0).sum())

    z = df["close"].diff().abs()
    r["skoki>10x_mediana"] = int((z > 10 * z.median()).sum())

    # zegar brokera: kołowy środek profilu aktywności, miesiąc po miesiącu
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
    r["rozstep_srodka_h"] = round(float(rozstep), 2)
    r["podejrzenie_zmiany_zegara"] = bool(rozstep > 0.8)
    return r
```

Większość kontroli to jedna linia i nie wymaga komentarza. Ciekawy jest detektor zegara, więc dwa zdania o tym, jak działa. Dla każdego miesiąca liczę profil aktywności po godzinach i wyznaczam jego środek; jeśli broker przestawił zegar, środek przesuwa się o godzinę i rozstęp między miesiącami to wykrzykuje. Kalibrowałem go na danych syntetycznych z wszczepionym przesunięciem: na czystym pliku rozstęp wyszedł 0.53 godziny, po wszczepieniu zmiany czasu 1.25, i dokładnie od miesiąca, w którym ją wszczepiłem, środek zaczyna dryfować.

## Lekcja, którą dostałem przy pisaniu tego wpisu

Pierwsza wersja tego detektora używała zwykłej średniej ważonej godzin i na wszczepionym przesunięciu nie zadziałała, mimo że profil przesunął się idealnie o jeden. Powód jest piękny i podstępny zarazem: doba jest cykliczna. Po godzinie 23 przychodzi 0, więc świece zepchnięte przez przesunięcie za północ wchodzą do średniej z wagą 0 zamiast 24 i ciągną środek w dół dokładnie wtedy, gdy powinien iść w górę. Lekarstwo jest klasyczne: godziny rzutuje się na okrąg i uśrednia wektorowo, a odległości liczy po krótszym łuku. Każda wielkość cykliczna, godzina doby, dzień tygodnia, faza sesji, gryzie prędzej czy później każdego, kto liczy na niej zwykłą średnią. Mnie ugryzła przy tym wpisie i zostawiam ślad, bo uczciwy warsztat to też pokazywanie własnych poprawek.

Cały skrypt z demem wszczepionych wad jest do pobrania: [walidator_danych.py](/code/walidator_danych.py), do ćwiczeń razem z [syntetycznym CSV](/code/EURUSD_H1_syntetyk.csv). Odpal najpierw na syntetyku, potem na eksporcie z własnej platformy. I zasada na koniec, ta sama co zawsze przy [danych mojego brokera](/blog/zegar-zmiennosci-w-praktyce/): każdy broker ma inny zegar, inne dziury i inne sklejanie świec, więc walidacja nie jest jednorazowa. Robi się ją dla każdego nowego pliku, zanim ten plik dotknie czegokolwiek dalej.
