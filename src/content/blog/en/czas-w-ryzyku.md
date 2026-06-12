---
title: "Time at risk, the metric almost no one talks about"
lang: "en"
kind: "trading"
date: "2026-06-12"
excerpt: "Two profits of 20 pips are not equal if one hung in the market for fifteen minutes and the other for five hours. On a metric my bot measures, and that no account statement has."
key: "czas-w-ryzyku"
slug: "czas-w-ryzyku"
---

Picture two trades. Both made 20 pips on the same pair. On the account statement they look identical. Except the first went in and out in fifteen minutes, while the second hung in the market for five hours, lived through two data releases and a press conference. Is that really the same result?

For me, no. Every minute in a position is a ticket to a lottery of events I do not control. A wire headline, a remark from a central banker, slippage on a thin market, in the extreme case a gap. Most of the tickets in that lottery are blank and nothing happens. But you draw as many times as the minutes you hold the position. Twenty pips earned in fifteen minutes and the same twenty earned in five hours differ by the number of tickets you bought along the way.

## The metric that is not in the reports

Your broker will count your result, the number of trades, the hit rate, the drawdown. Nowhere will you see a line for "how much time this week your money was exposed to the market". And it is one of the simplest numbers you can measure: the sum of minutes in a position, day by day, week by week.

When I started counting it on myself, I saw an uncomfortable thing. A good part of my time at risk was not working toward the result. Those were hours of hanging in trades that had long since stopped having a reason and were only waiting for the stop or for a miracle. The result was made by a minority of the minutes. The rest was pure exposure with no content: the risk was running, the clock was running, the edge was not there.

## What the bot did with this

I described the day map recently, meaning the chance, computed over years of data, that the market will still add a new extreme. My bot uses that map exactly here. When the statistics say the day has most likely already done its work, the bot starts shortening the life of the position: it pulls the stop up faster than a classic trailing computed from price alone would.

Before this rule went into use, it passed a test whose conditions I wrote down in advance: on out-of-sample data (history from my broker) it was to shorten the time at risk and not worsen the result. It shortened it by about 12 percent with the result unchanged. Twelve percent fewer minutes on the lottery of events, for free. No extra profit, and that was the point. Not every fix in trading has to earn more. This one simply risks less for the same.

## The extreme case: the weekend

The most expensive minutes at risk are the ones in which the market is closed but the world is not. A position held over the weekend is two days of events with no chance to react and a Monday gap that does not ask for your opinion. So my rule here is blunt as a hammer: a day trader's positions do not sleep over the weekend. No setup is so good that it is worth forty-eight hours of blind exposure.

Count it on yourself. Not the result, you know that one. The minutes. How much time last week your money stood on the market, and what share of those minutes was actually waiting for something. It is one of those numbers that can change the way you play more than the next indicator.

Educational material, not investment advice.
