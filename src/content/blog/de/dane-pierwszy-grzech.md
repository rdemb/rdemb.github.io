---
title: "Daten: die erste Sünde jedes Automaten (Python)"
lang: "de"
kind: "trading"
date: "2026-06-12"
excerpt: "Bevor du die erste Statistik rechnest, lügen deine Daten schon: Lücken, Duplikate, Geisterkerzen und eine Broker-Uhr, die zweimal im Jahr um eine Stunde springt. Ein Validator zum Kopieren und die Geschichte, wie mich der Tag im Code gebissen hat."
key: "dane-pierwszy-grzech"
slug: "dane-pierwszy-grzech"
---

Mein Tages-Automat hatte einmal eine Phase, in der der Tester etwas anderes zeigte als das echte Leben, und ich kam nicht dahinter, warum. Der Schuldige war nicht die Strategie, sondern die Uhr: Die Serverzeit meines Brokers läuft hinter der US-Börse her, und zweimal im Jahr, bei der Zeitumstellung in den USA, verschob sich meine ganze Statistik „pro Stunde" um eins. Eine Regel, die auf 9:00 gesetzt war, lebte plötzlich um 8:00. Seitdem traue ich keiner Datendatei, solange sie nicht eine Prüfung bestanden hat. Buchstäblich keiner.

Das ist die erste Sünde der Automaten: Wir rechnen ausgefeilte Dinge auf Daten, die sich niemand angesehen hat. Und die Liste der typischen Mängel ist kurz und wiederholt sich. Lücken nach Serverausfällen. Doppelte Zeitstempel nach dem Zusammenkleben von Dateien. Kerzen mit einem High unter dem Low, weil beim Export etwas schiefging. Wochenendkerzen, die es auf FX nicht geben dürfte. Sprünge um eine Größenordnung, die ein Feed-Fehler sind und keine Bewegung. Und eben die Uhr, der leiseste Mangel von allen, weil sie in einer einzelnen Kerze nichts kaputt macht, nur in jeder Statistik, die nach Stunden gerechnet wird.

## Der Validator

```python
import pandas as pd

def waliduj(df):
    """Bericht über die Sünden eines OHLC-H1-Frames: Lücken, Duplikate, Nullen, Sprünge, DST."""
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

    # Broker-Uhr: zirkulärer Mittelpunkt des Aktivitätsprofils, Monat für Monat
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

Die meisten Prüfungen sind eine Zeile und brauchen keinen Kommentar. Interessant ist der Uhr-Detektor, also zwei Sätze dazu, wie er funktioniert. Für jeden Monat rechne ich das Aktivitätsprofil nach Stunden und bestimme seinen Mittelpunkt; hat der Broker die Uhr verstellt, verschiebt sich der Mittelpunkt um eine Stunde, und der Spread zwischen den Monaten schreit es heraus. Ich habe ihn an synthetischen Daten mit einer eingepflanzten Verschiebung kalibriert: Auf einer sauberen Datei kam der Spread auf 0.53 Stunden, nach dem Einpflanzen einer Zeitumstellung 1.25, und genau ab dem Monat, in dem ich sie eingepflanzt habe, beginnt der Mittelpunkt zu driften.

## Die Lektion, die ich beim Schreiben dieses Beitrags bekam

Die erste Version dieses Detektors benutzte einen gewöhnlichen gewichteten Mittelwert der Stunden, und bei der eingepflanzten Verschiebung funktionierte er nicht, obwohl sich das Profil um genau eins verschoben hatte. Der Grund ist schön und tückisch zugleich: Der Tag ist zyklisch. Nach Stunde 23 kommt 0, also gehen Kerzen, die von der Verschiebung über Mitternacht geschoben werden, mit Gewicht 0 statt 24 in den Mittelwert ein und ziehen den Mittelpunkt nach unten, genau in dem Moment, in dem er nach oben gehen sollte. Die Kur ist klassisch: Man projiziert die Stunden auf einen Kreis und mittelt als Vektoren, und die Abstände rechnet man über den kürzeren Bogen. Jede zyklische Größe, Stunde des Tages, Wochentag, Phase der Session, beißt früher oder später jeden, der darauf einen gewöhnlichen Mittelwert rechnet. Mich hat sie bei diesem Beitrag gebissen, und ich lasse die Spur stehen, denn ehrliches Handwerk heißt auch, die eigenen Korrekturen zu zeigen.

Das ganze Skript mit einer Demo der eingepflanzten Mängel gibt es zum Herunterladen: [walidator_danych.py](/code/walidator_danych.py), zum Üben zusammen mit einer [synthetischen CSV](/code/EURUSD_H1_syntetyk.csv). Lauf es erst auf der synthetischen Datei, dann auf dem Export deiner eigenen Plattform. Und die Regel zum Schluss, dieselbe wie immer bei [den Daten meines Brokers](/de/blog/zegar-zmiennosci-w-praktyce/): Jeder Broker hat eine andere Uhr, andere Lücken und ein anderes Zusammenkleben der Kerzen, also ist die Validierung keine einmalige Sache. Man macht sie für jede neue Datei, bevor diese Datei irgendetwas weiter unten in der Kette berührt.

Bildungsmaterial, keine Anlageempfehlung.
