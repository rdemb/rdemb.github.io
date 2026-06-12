---
title: "The math of survival: what your 2% risk really costs (Python)"
lang: "en"
kind: "trading"
date: "2026-06-12"
excerpt: "At 45% accuracy, a run of eight losses in a row is not bad luck, it is the plan: it shows up in 84% of simulated histories. A Monte Carlo of equity curves that shows what your psyche will not take, before you live through it."
key: "matematyka-przetrwania"
slug: "matematyka-przetrwania"
---

There is a calculation almost nobody does before the first deposit, and it changes everything. It is not about entries or indicators. It is about what happens to the account and to your head when a strategy of known accuracy simply does its thing over five hundred trades. Many people have a plan for the profits. Almost nobody has a plan for a statistically certain run of losses.

The calculation takes thirty seconds with a simulation. You take the accuracy and the reward-to-risk ratio from your honest tests, after costs, set the percent of risk per trade and run five thousand alternative histories of your account.

```python
import numpy as np

def monte_carlo_kapitalu(trafnosc, rr, ryzyko_proc,
                         n_transakcji=500, n_sciezek=5000, seed=0):
    """Distribution of account fates at a fixed % of risk per trade."""
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

Now the numbers, because that is the whole point here. I took a decent, realistic profile: accuracy 45%, profit 1.8 times the risk. This is a strategy with a positive edge, the kind many would like to have. And I ran it in two risk variants.

At a risk of 0.5% per trade, the median account after five hundred trades is 1.89, the typical maximum drawdown 6.4%, and the chance you ever see a 20% drawdown comes out at zero in five thousand histories. At a risk of 2% on the same strategy, the median rises to 11, but a drawdown of 20% or worse hits in 77% of histories, and the typical maximum drawdown is 24%. The same edge, the same entries. A different geometry.

The most important number, though, is elsewhere, and it applies to both variants the same: a run of at least eight losses in a row shows up in 84% of histories, and at least twelve in 15%. I will repeat it, because this is the core: at a forty-five percent accuracy, eight failures in a row are not a sign the strategy died. It is a statistical certainty you have to have written into the plan and into your psyche before it happens. People do not abandon a strategy because it stopped working. They abandon it somewhere around the sixth loss in a row, two losses before what the math had planned from the start.

A sanity check, without which I do not publish code: for a coin with no edge, accuracy 50% at RR 1, the median comes out at 0.975, slightly below the line. That is how it should be, it is the geometry of compounding percentages, a 1% loss needs more than 1% to recover. The simulator does not promise profits, it only computes what happens over the long run.

The script to download: [monte_carlo_kapitalu.py](/code/monte_carlo_kapitalu.py), with command-line parameters and one TODO that matters: instead of a coin with fixed accuracy you can sample from your own trade journal, because real return distributions are sometimes worse than a two-point one. Take accuracy and RR from your tests after your broker's costs, run first through the [placebo test](/en/blog/test-placebo/). And choose the risk per trade so that the drawdown the simulator shows as typical is something you can actually look at week after week. In my [EA skeleton](/en/blog/szkielet-ea/) the input range ends at 2%, and not by accident.

Educational material, not investment advice.
