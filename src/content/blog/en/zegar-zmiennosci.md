---
title: "The market runs on a clock. On the shape of the trading day in Forex"
lang: "en"
kind: "trading"
date: "2026-06-12"
excerpt: "The same candle at three in the morning and at 14:30 is two different events. Volatility on FX has a daily shape that repeats as stubbornly as a train timetable. It is the first measurement my bot makes."
key: "zegar-zmiennosci"
slug: "zegar-zmiennosci"
---

Forex advertises itself as a market that is open around the clock. That is true on paper and false in practice. Across those twenty-four hours it is not one market trading, but three in a row. First Asia, quiet and narrow. Then London, which wakes everything up. At the end New York, with the data at 14:30 and the biggest hours of the day, when both sessions overlap.

The first time I counted on the data how much EUR/USD travels on average in each hour of the day, I expected chaos. I got the opposite. The volatility profile, hour by hour, repeats as stubbornly as a train timetable. Three in the morning looks like three in the morning a month ago. The London open looks like every London open. The correlation of this profile between different periods comes out above 0.9 for me. In a world where almost nothing is stable, this is the most stable thing I have found. One caveat: I compute it on my broker's historical data. A different broker ticks in a different server timezone and stitches its candles together differently, so your clock will have the same stubbornness but different numbers next to the hours.

## What follows from this

The simplest thing: a 25-pip move does not have one value. At three in the morning it is an event that should turn on a warning light, because at that hour the market usually does a few pips an hour. At 14:35, two minutes after the US data, those same 25 pips are noise. A candle without the hour on the clock is incomplete information.

So before I judge anything, I normalize. I do not ask how far the market traveled, only how far it traveled relative to what it usually travels at this hour. Only that second number tells me whether something unusual is happening. My bot runs this conversion in the background all the time, and that is its first, most basic job. Boring, but the rest stands on that boredom.

The clock also tells you when not to play. Since Asia on European pairs usually gives back a few pips an hour, while the spread and the cost of entry are fixed, the math of those hours is simply weak. Not because the market is bad, but because the cost eats a larger part of the typical move. The same strategy that makes sense in the afternoon makes a lot less of it at night.

## What the clock does not say

Honestly: the volatility clock says nothing about direction. I have checked this in many ways and the result is always the same. The fact that the market usually speeds up at 9:00 does not tell you whether it will go up or down. The clock says how much the market usually gives, not where it is going. Anyone selling hourly directional patterns in the style of "it always drops at 10" is selling noise.

But "how much" is not little at all. Most of the mistakes I used to make did not come from the wrong direction, but from the wrong scale. Too big a position for an hour that can throw the market around. Chasing a move at a time of day when the move is usually just ending. The clock will not cure this, but it shows when I am risking more than I think I am.

The workshop rule from this post is a single one. Before you judge a move, look at the clock. The market is not one place around the clock, and a candle without the context of the hour says less than it promises.

Educational material, not investment advice.
