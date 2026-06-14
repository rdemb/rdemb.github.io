---
title: "D-LOGIC FX"
lang: "en"
kind: "project"
excerpt: "A semi-algorithmic FX day-trading concept. The machine maps the structure of the day; you take the direction."
key: "dlogic-fx"
slug: "dlogic-fx"
---
D-LOGIC FX is my FX day-trading concept, built around one uncomfortable observation: on retail data, after cost, price does not predict its own direction. I checked it across eighteen independent fronts. Same answer every time.

So I invert the problem. Instead of forcing the machine to guess direction, I have it map what actually is predictable in the structure of the day. Direction stays with the human. The machine hands me context, risk and timing. I make the call.

The link above opens this concept in a new tab as a living 3D network: a core, six branches and their components. Inside you orbit the scene, zoom, and hover any node to read it.

## Thesis

> Direction is noise. Structure is signal.

Eighteen attempts to predict direction on retail data. After spread and commission, none survived. That is not a failure. It is a result, and it tells me where not to look for edge.

The structure of the day behaves differently. The rhythm of volatility, the sequence of sessions, the probability of a new high or low of the day from a given state. Those are measurable and repeatable. That is what I build on.

## Inputs

The foundation is multi-timeframe price (M5, M15, D1) across five major FX pairs, reconstructed in broker time, with nearly two decades of daily history. Around six thousand days. That is what an honest out-of-sample test needs, rather than a cosmetic one.

## Five layers

Each layer is a mechanically motivated read on the day that passed its own gate.

- **Day-Map (hazard)**. The live probability of a new extreme of the day from the current state. Out-of-sample AUC from 0.87 to 0.92, placebo 0.000. The strongest part of the concept.
- **Volatility engine**. It forecasts the day's range, which gives sizing and stop placement. R² from 0.12 to 0.30.
- **Budget and timing**. How long it is worth sitting in risk. Correlation -0.48 with window quality.
- **VWAP-Fade**. The one direction-flavored read that passed out-of-sample on all five pairs. Whether it survives cost is exactly what the rigour layer is for. I do not publish it as a signal.
- **Meta-labeling**. A layer that learns me as a trader. Currently in forward test.

## Rigour

Nothing enters on belief. Every candidate is pre-registered, then judged out-of-sample, beaten against placebo, filtered by false-discovery control across the whole grid (q ≤ 0.10), and costed before it is promoted. A Deflated Sharpe Ratio guards against the search itself. Most ideas die right here. By design.

## The day, in one panel

The cockpit fuses every layer into one view. Probability bias on top, then my position, the price magnets, the news clock. At the end, a single verdict.

- **BIAS**. P up versus down.
- **PULSE**. Multi-timeframe agreement on a 0 to 100 scale.
- **LEVELS**. Prior day high and low, targets.
- **NEWS**. Blackout ±15 minutes around data.
- **GO / NO-GO**. One verdict at entry.

It informs. It never pulls the trigger.

## What I buried

A concept is worth as much as the ideas it is willing to bury in the open. These looked clever and predicted nothing after rigour:

- **Oscillator**. Information coefficient near zero.
- **Fibonacci**. An artefact that vanishes under an honest test.
- **Fixing W-shape**. Dies on cost.
- **Squeeze**. Not statistically significant.

I show them on purpose. Honesty is part of the concept.

## The human

D-LOGIC FX runs in OBSERVE_ONLY. The machine describes the auction, detects conflict, measures cost and timing. Direction, size and the decision to enter are mine. No model prose is treated as a signal. The hot path is deterministic, with no language model in runtime. The core rule is simple: no edge means no trade.

## Caveats

- Not investment advice.
- Not an autonomous trading bot.
- Not a promise of market edge.
- A negative result is part of the project.
- Any promotion from research to practice requires replay, costs, out-of-sample checks and explicit kill-switches.
