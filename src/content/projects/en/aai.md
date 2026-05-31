---
title: "AAI"
lang: "en"
kind: "project"
excerpt: ""
key: "aai"
slug: "aai"
---
AAI, or **Adaptive Auction Intelligence**, is my way to organize the market before a decision. I read the market as an auction, not as a pile of isolated indicators.

The short version: structure first, scenario second. Execution cost, data freshness, and memory of similar setups before direction. No edge is not a failure mode. It is a valid result.

## Question

Can a local deterministic market-intelligence layer help an operator separate:

- context from setup,
- setup from execution,
- narrative from evidence,
- activity from edge.

This is not an autonomous P&L bot. AAI is a market-evaluation layer: it describes what the auction shows, where the evidence conflicts, what is missing, and when doing nothing is the cleaner decision.

## Paradigm

The core rule is:

> No-Edge = No-Trade.

AAI can return no-trade. It can show that the broad backdrop is interesting but price acceptance is missing. It can also expose conflict between auction state, execution cost, order flow, and memory.

The decision is split into layers:

1. **Regime**: trend, range, compression, expansion, chop.
2. **Auction**: value migration, acceptance, rejection, sweep, equilibrium.
3. **Microstructure**: order flow, delta, DOM, footprint, micro-price.
4. **Execution**: spread, fees, slippage, adverse selection, fill quality.
5. **Memory**: similar historical setups and their outcomes.
6. **Evidence Review**: whether the thesis is supported by data or only sounds coherent.

No single layer gets to pretend it is the whole truth.

## Architecture

AAI is a local analytical layer. The hot path is deterministic: no LLM in runtime, no external language model as decision maker, and no generated prose treated as a signal.

```text
local market data
  -> auction state
  -> microstructure context
  -> execution cost
  -> memory / replay
  -> evidence review
  -> operator context
```

The output is not a buy/sell command. The output is context for a human: auction type, working direction when one exists, conflict level, execution cost, data quality, and the reason for no-trade when no edge is present.

## What I Measure

AAI is not judged by the quality of its explanation. I care about metrics that punish storytelling:

- MFE / MAE after entry,
- win rate across 5 / 15 / 60 minute horizons,
- entry cost versus an ideal reference,
- slippage and fee sensitivity,
- correct abstain rate,
- post-cost behavior,
- out-of-sample degradation.

If a setup works only before costs, it is not a setup. If it works only with a perfect fill, it is fragile. If it works only in one window, it stays research-only.

## Current Result

The most important public result is negative, and that is useful.

In pre-validation, standalone AAI agents did not pass the post-cost gate on the longer hold. Decision: do not treat AAI as an independent signal generator. The better role is **state encoder** and **evidence layer**: a layer that describes the auction, detects conflict, and helps the operator avoid confusing context with edge.

That changes the question from "does AAI predict direction?" to:

> Can AAI improve selection, abstain rate, and entry quality when used as an evidence filter?

## Project Decision

AAI remains a research project and a tool that supports a human.

I do not publish signals, entry levels, live reports, logs, private feeds, or results that can be mistaken for recommendations. The public part is the paradigm: evidence-first, local-first, no-edge-first.

## Caveats

- Not investment advice.
- Not an autonomous trading bot.
- Not a promise of market edge.
- Negative results are part of the project.
- Any promotion from research to practice requires replay, costs, OOS checks, and explicit kill-switches.
