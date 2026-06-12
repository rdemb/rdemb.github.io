---
title: "The map of the day: when the market is still searching, and when it has already found"
lang: "en"
kind: "trading"
date: "2026-06-12"
excerpt: "Every day on FX builds its own range: a high and a low. The question you can actually measure is not \"where will the market go\", but \"is today's extreme already in\". About a map that tells you where there may still be a move."
key: "mapa-dnia"
slug: "mapa-dnia"
---

A day on the currency market has a simple geography. Somewhere there is the high of the day, somewhere the low, and between them everything else. By the close of the session those two points are obvious. The problem is that they form as the day goes, and we walk this map before anyone has drawn it.

I stopped asking where the market will go. I never found an answer to that question in the data, and I have described it more than once. I ask a different one: has today's high or low already been made. That question sounds similar, yet it differs in a fundamental way, because it can be answered with a number.

## How I measure it

The number is called the hazard, a term borrowed from survival analysis, the same one medicine uses to estimate the risk of a disease coming back. Here it means: what is the chance that in the near future the market adds a new extreme of the day, given the state the day is currently in. What hour it is. How much of the typical daily distance is already used up. How far the price sits from the high and low so far.

That chance changes over the course of the day a great deal and very regularly. In the morning, when the range is small, new extremes come thick and fast, because the day is only just looking for its shape. The later it gets and the fuller the day's budget, the more rarely the market adds a new point to the map. In the evening, with a worked-out range, the chance of a new high gets small. It sounds like common sense, and in large part it is. The difference is that instead of an impression I have a curve computed over years of my broker's historical data, checked on data the model never saw, and compared against a placebo test, so I am not congratulating myself on discovering something trivial.

## What it is good for, and what it is not

The map of the day tells you where there may still be a move, and where the statistics say "probably closed off". It does not tell you which way. It shows the terrain, not the direction.

For me it works where you do not have to guess direction: in managing a position. When the map says the day has most likely done its part, there is no reason to hang in the market and wait for a miracle. The position is trimmed, the stop is pulled up, exposure drops. The human still picks the direction, and the map watches that they do not overpay in time spent holding.

And honesty all the way, because that is what this blog stands on. I also checked the offensive variant: since new extremes are rare in the evening, maybe you can trade against them, simply fade the ends of moves. The test was registered in advance, with transaction costs, on out-of-sample data. The result: the structure in the data is there, the map filter really does improve selection over placebo, but after subtracting the spread what is left is zero, even a slight minus. The map knows where a move usually fades, just not precisely enough to cover the cost of the bet. The ninth time in a row, the same lesson: at the level available to retail the market gives up structure, but it does not give up a free lunch.

That is why the map of the day stayed with me as what it is: a layer of context and a brake, not a signal. In that role it does quiet, measurable work every day.
