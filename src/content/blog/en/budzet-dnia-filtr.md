---
title: "The day's budget as an EA filter: don't chase a move that already happened"
lang: "en"
kind: "trading"
date: "2026-06-12"
excerpt: "Every pair has a typical daily distance. Once the day has covered it, statistics stop supporting the chase. MQL5 code: the typical range from the median, the percent of budget used, and a gate to plug into the EA."
key: "budzet-dnia-filtr"
slug: "budzet-dnia-filtr"
---

In the [briefs](/en/blog/fx-brief-2026-06-12/) I keep repeating one rule: the day's range is a budget. Every pair has its typical daily distance, and once the day has covered it, statistics stop supporting the chase after the move. A human can feel this. An EA has to count it. Here is the code mine counts it with.

The idea fits in three steps. Compute the typical day's range as the median of the ranges over the last few dozen days. Check how far today has already traveled from its low to its high. Divide one by the other and you get the percent of budget used, a single number that tells you whether the day is young, mature or finished.

```cpp
//--- typical day's range: median of (high-low) over the last N D1 days
double TypicalDayRange(int days = 40)
{
   double ranges[];
   ArrayResize(ranges, days);
   for(int i = 1; i <= days; i++)   // from 1: skip today's unfinished candle
      ranges[i - 1] = iHigh(_Symbol, PERIOD_D1, i)
                    - iLow(_Symbol, PERIOD_D1, i);
   ArraySort(ranges);
   return ranges[days / 2];
}

//--- how much budget the day has used: 0.0 in the morning, ~1.0 at a typical full day
double BudgetUsed()
{
   double typical = TypicalDayRange();
   if(typical <= 0) return 0;
   double today = iHigh(_Symbol, PERIOD_D1, 0) - iLow(_Symbol, PERIOD_D1, 0);
   return today / typical;
}

//--- gate for the EA: are we still allowed to open WITH-trend positions
input double InpMaxBudget = 1.0;  // above this we don't chase the move

bool BudgetAllows()
{
   return BudgetUsed() < InpMaxBudget;
}
```

In the [EA skeleton](/en/blog/szkielet-ea/) you add one line to the gates in `OnTick`: `if(!BudgetAllows()) return;`. That is all. The EA stops opening with-trend positions on days that have already done their distance, which is exactly when chasing the candle most often buys the top.

## Three things I know from my own tests

First, the median again. Days with central bank decisions can have a range three times the usual, and an average with them inside inflates the budget for weeks. The median does not see them, and that is the point: the budget is meant to describe an ordinary day.

Second, this is an asymmetric filter and it is worth understanding why. A used-up budget says "don't chase", but it does not say "trade against". I tested the offensive variant on data, that is trading the reversal after the budget is used up, with costs and with the criteria written down in advance, and after the spread there was zero left. I wrote about this with the [map of the day](/en/blog/mapa-dnia/): the structure is in the data, the free lunch is not. So in my setup the budget only takes away the EA's right to late chases, it commands nothing.

Third, the threshold of 1.0 is not sacred. On EUR/USD it behaves sensibly, on yen pairs a trend day set up in the morning in Asia sometimes goes to 1.5 of the budget and further. And one caveat that applies to every number on this blog: I compute them on my broker's historical data. A different broker means a different server timezone, so a different day boundary, a different spread and differently stitched candles, and therefore a different budget. That is why this is an input parameter, not a constant: compute it and test it on your pair, your data and your costs before you believe it. And if you do not know whether a test result is an edge or luck, the [placebo test](/en/blog/test-placebo/) is exactly about how to tell the two apart.

The functions from this post are in [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), together with the rest of the workshop.

Educational material, not investment advice.
