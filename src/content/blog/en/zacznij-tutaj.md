---
title: "Start here: a little school of honest algotrading"
lang: "en"
kind: "trading"
date: "2026-06-12"
excerpt: "A map of this blog for someone who wants to build automated systems on the market and not lie to themselves along the way. A reading order, code to download, and the one rule that holds it all together."
key: "zacznij-tutaj"
slug: "zacznij-tutaj"
---

This blog has grown, so it is time for a map. If you are interested in building automated systems on the market and you would rather know than believe, below is the order I would read it in myself. One rule holds it all together: first learn to reject bad ideas, and only then build on the ones that survived.

## Step 1: the scale of expectations

Start with [the truth about day trading](/en/blog/day-trading-truth/), because everything that follows assumes you are not looking for a shortcut. Then [what indicators taught me](/en/blog/indicators-i-trusted/) and [how I test an idea](/en/blog/testing-a-trading-idea/), to see what it looks like to work with a hypothesis instead of a hunch.

## Step 2: a market that is measured, not guessed

Four posts about what the market really lets you count and what follows from it. [The volatility clock](/en/blog/zegar-zmiennosci/): the market has a shape to its day, and a candle with no hour attached is incomplete information. [The map of the day](/en/blog/mapa-dnia/): instead of asking where it will go, ask whether today's extreme is already in. [Time in risk](/en/blog/czas-w-ryzyku/): a metric you will not find in any broker report. And [the division of labor between human and machine](/en/blog/czlowiek-i-maszyna/), meaning what the automated system should never do, because I checked it across nine fronts of research.

## Step 3: the workshop with code

This is where the part to copy begins, in assembly order. Before you compute anything, [validate the data](/en/blog/dane-pierwszy-grzech/), because a flawed file poisons everything downstream. Then the [placebo test](/en/blog/test-placebo/), the sieve you push every idea through, and the [math of survival](/en/blog/matematyka-przetrwania/), so that risk per trade comes from arithmetic, not appetite. Add to that the [full cost of a trade](/en/blog/ile-kosztuje-transakcja/), because an edge that does not earn back the spread and slippage is not an edge. Only now the [EA skeleton](/en/blog/szkielet-ea/), plumbing with no signal. On top of the skeleton you layer filters: the [volatility clock in practice](/en/blog/zegar-zmiennosci-w-praktyce/) and the [day's budget](/en/blog/budzet-dnia-filtr/). And finally the management: [stepped trailing](/en/blog/ea-trailing-krokowy/), [silence around the news](/en/blog/ea-blackout-newsow/) and [many pairs with shared risk](/en/blog/ea-wiele-par/).

The code from these posts also lives in files, together with synthetic data for practice:

- [dlogic-szkielet-ea.mq5](/code/dlogic-szkielet-ea.mq5), the EA skeleton for MetaEditor,
- [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), all the workshop functions in a single include,
- [test_placebo.py](/code/test_placebo.py), [zegar_zmiennosci.py](/code/zegar_zmiennosci.py), [walidator_danych.py](/code/walidator_danych.py) and [monte_carlo_kapitalu.py](/code/monte_carlo_kapitalu.py),
- [EURUSD_H1_syntetyk.csv](/code/EURUSD_H1_syntetyk.csv), data generated for learning, with a warning in the header.

A heads-up, because you keep asking: these files are deliberately not a finished system. The signal is empty, the thresholds are examples, and the parameters get tuned on your own broker's data, not mine. This is a workshop and material to develop, not a product. I do not recommend ready-made systems from the internet, including my own, if I ever weakened and put one out.

## Step 4: deeper

How a [hidden Markov model](/en/blog/hmm-tryb-rynku/) works and why the market regime is context, not a signal. [The market as an auction](/en/blog/market-as-auction/) and [the market as an organism](/en/blog/market-as-organism/), the conceptual frame. And when you feel like seeing how the same rules of rigor look away from the market, take a look at the [living world model](/en/projekty/mocps/), which learns physics and is measured by the same spirit: baseline, placebo, honest limits.

The daily rhythm comes in the [FX briefs](/en/blog/fx-brief-2026-06-12/), and you can follow all of it through [RSS](/rss.xml). Along the way I will keep adding more pieces, and this map will grow together with the blog.
