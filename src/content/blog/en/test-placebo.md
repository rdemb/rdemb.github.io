---
title: "The placebo test: how not to believe your own backtest (Python)"
lang: "en"
kind: "trading"
date: "2026-06-12"
excerpt: "A profitable backtest is not enough. Before you trust a strategy, check whether it beats two thousand random ones. Thirty lines of Python that saved me more money than any indicator."
key: "test-placebo"
slug: "the-placebo-test"
---

The most expensive moment in algorithmic trading is the one where the backtest shows an equity curve going up and to the right. It gets expensive because of what you do next. For years I did what everyone does: got excited and went to demo. Today I do something else first, and it is the most important thirty lines of code in my workshop.

I borrowed the idea from medicine. A new drug does not merely have to work, it has to work better than a sugar pill given the same way. A strategy does not merely have to make money on history, it has to make money better than a random strategy that enters the same number of times, under the same costs, just with no idea at all. If your edge cannot be told apart from two thousand monkeys throwing darts at a chart, it is not an edge. It is noise that happened to smile.

## The code

```python
import numpy as np

def placebo_test(next_bar_returns, signal, n_placebo=2000, seed=0):
    """Does the strategy beat random strategies with the same number of entries?

    next_bar_returns: array of returns of the bar following each decision point
    signal: boolean array, True where the strategy enters (long)
    Returns (strategy_result, p_value).
    """
    rng = np.random.default_rng(seed)
    returns = np.asarray(next_bar_returns, dtype=float)
    signal = np.asarray(signal, dtype=bool)
    k = int(signal.sum())
    result = returns[signal].sum()

    better = 0
    for _ in range(n_placebo):
        random_sig = np.zeros(len(returns), dtype=bool)
        random_sig[rng.choice(len(returns), size=k, replace=False)] = True
        if returns[random_sig].sum() >= result:
            better += 1
    return result, (better + 1) / (n_placebo + 1)
```

Usage: take your data, compute the return of the bar following each point (flip the sign for shorts), build the `signal` array from your rule, call the function. You get the sum of your entries' returns and p, the share of random strategies that did at least as well as yours.

Before pasting this code here I checked it the way I check strategies. On pure noise with a random signal, p came out 0.56, a coin flip, as it should. After implanting an artificial edge into the same data, p dropped to 0.002. The test tells one from the other, and that is its entire job.

## Reading p without fooling yourself

A small p, say below 0.01, means this: a monkey that beats your strategy is rare. Not yet proof of an edge, but a serious reason to keep testing. A p around 0.2 or 0.5 means your rule does roughly what a lottery does, and no threshold optimization will save it, because you would be optimizing noise.

Three traps, each of which I know from the inside. First: if you test twenty ideas, one will come out below 0.05 by pure chance, so write your criteria down before you see the result, and count every attempt, including the failed ones. Second: costs. The returns array must have the spread and slippage of your broker subtracted from every entry, mine are different from yours, otherwise you are testing a world where the broker pays you. Third: this test checks the choice of entry moments at a fixed number of trades. It does not check position management, and it does not check whether the strategy survives years it has not seen, that is what out-of-sample data is for.

This test has a small monument in my workshop. Nine times in a row it killed research fronts that looked promising: candle patterns, hourly direction patterns, market regimes, macro. Nine times it saved me months of building an automat on sand. Every new idea, including the ones I write about on this blog, goes through it first. Paste it into your workshop and let it be merciless to your favorite ideas too. Especially the favorites.
