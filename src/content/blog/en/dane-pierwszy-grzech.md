---
title: "Data: the first sin of every automated system (Python)"
lang: "en"
kind: "trading"
date: "2026-06-12"
excerpt: "Before you compute your first statistic, your data is already lying: gaps, duplicates, ghost candles and a broker clock that jumps by an hour twice a year. A validator to copy, and the story of how the day bit me in the code."
key: "dane-pierwszy-grzech"
slug: "dane-pierwszy-grzech"
---

My daily automated system once went through a phase where the tester showed one thing and real life showed another, and I could not work out why. The culprit was not the strategy, it was the clock: my broker's server time runs behind the US exchange, and twice a year, when the clocks change in the US, my whole "per hour" statistic shifted by one. A rule set for 9:00 suddenly lived at 8:00. Since then I trust no data file until it passes a check. Literally none.

This is the first sin of automated systems: we compute sophisticated things on data nobody has looked at. And the list of typical flaws is short and repetitive. Gaps after server outages. Duplicate timestamps after stitching files together. Candles with a high below the low, because something went wrong on export. Weekend candles, which should not exist on FX. Jumps of an order of magnitude that are a feed error, not a move. And the clock, the quietest flaw of all, because it breaks nothing in a single candle, only in every statistic computed by hour.

## The validator

```python
import pandas as pd

def waliduj(df):
    """Report of the sins of an OHLC H1 frame: gaps, duplicates, zeros, jumps, DST."""
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

    # broker clock: circular center of the activity profile, month by month
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

Most of the checks are one line and need no comment. The interesting one is the clock detector, so two sentences on how it works. For each month I compute the activity profile by hour and find its center; if the broker moved the clock, the center shifts by an hour and the spread between months shouts it out. I calibrated it on synthetic data with an implanted shift: on a clean file the spread came out at 0.53 hours, after implanting a clock change 1.25, and exactly from the month where I implanted it the center starts to drift.

## The lesson I got while writing this post

The first version of this detector used a plain weighted average of the hours, and on the implanted shift it did not work, even though the profile had moved by exactly one. The reason is beautiful and treacherous at the same time: the day is cyclical. After hour 23 comes 0, so candles pushed past midnight by the shift enter the average with weight 0 instead of 24 and pull the center down at exactly the moment it should go up. The cure is a classic one: you project the hours onto a circle and average as vectors, and you measure distances along the shorter arc. Every cyclical quantity, hour of day, day of week, phase of the session, bites sooner or later anyone who computes a plain average on it. It bit me on this very post, and I leave the trace, because an honest workshop also means showing your own corrections.

The whole script with a demo of implanted flaws is available to download: [walidator_danych.py](/code/walidator_danych.py), for practice together with a [synthetic CSV](/code/EURUSD_H1_syntetyk.csv). Run it first on the synthetic file, then on the export from your own platform. And the rule at the end, the same as always with [my broker's data](/en/blog/zegar-zmiennosci-w-praktyce/): every broker has a different clock, different gaps and different candle stitching, so validation is not a one-off. You do it for every new file, before that file touches anything further down the line.

Educational material, not investment advice.
