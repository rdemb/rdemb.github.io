---
title: "EA anatomy: a stepped trailing stop that does not panic (MQL5)"
lang: "en"
kind: "trading"
date: "2026-06-12"
excerpt: "A stop moved on every tick is a stop that collects noise. Steps instead: breakeven after the first threshold, then a move every full step of profit. The whole function, ready to drop into the EA skeleton."
key: "ea-trailing-krokowy"
slug: "ea-trailing-krokowy"
---

The first trailing stop I wrote moved the stop on every tick, always one spread behind the current price. It looked protective. In practice it collected noise: a position that was meant to reach its target dropped out on the first flicker, and the journal was full of exits three pips from the entry. Since then my stops walk in steps.

The idea is simple. First do nothing, let the position breathe. After the first profit threshold, move the stop to the entry, and from that moment the trade can no longer lose. Then move the stop by one full step every time the profit grows by one full step. Between thresholds the stop stands still and the noise does not bother it.

```cpp
//--- stepped trailing: breakeven after the threshold, then steps per step
input double InpBreakevenPts = 150;  // after this much profit in points: stop to entry
input double InpStepPts      = 100;  // then move the stop every this many points

void SteppedTrailing()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket))                          continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol)            continue;
      if(PositionGetInteger(POSITION_MAGIC)  != InpMagic)          continue;

      long   type    = PositionGetInteger(POSITION_TYPE);
      double opened  = PositionGetDouble(POSITION_PRICE_OPEN);
      double sl      = PositionGetDouble(POSITION_SL);
      double price   = (type == POSITION_TYPE_BUY)
                       ? SymbolInfoDouble(_Symbol, SYMBOL_BID)
                       : SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      double profit  = (type == POSITION_TYPE_BUY) ? price - opened
                                                   : opened - price;
      if(profit < InpBreakevenPts * _Point) continue;   // still breathing

      // how many full steps of profit above breakeven are already there
      double steps = MathFloor((profit - InpBreakevenPts * _Point)
                               / (InpStepPts * _Point));
      double newSL = (type == POSITION_TYPE_BUY)
                     ? opened + steps * InpStepPts * _Point
                     : opened - steps * InpStepPts * _Point;

      bool better = (type == POSITION_TYPE_BUY) ? (newSL > sl + _Point)
                                                : (sl == 0 || newSL < sl - _Point);
      if(better)
         trade.PositionModify(ticket, newSL,
                              PositionGetDouble(POSITION_TP));
   }
}
```

You wire the call into the `OnTick` of the [skeleton](/en/blog/szkielet-ea/), before the gates, because managing an open position has to work always, including when new entries are not allowed: `SteppedTrailing();` as the first line.

Two things from testing, both on my broker's historical data, so verify them on yours. First, the thresholds are a trade-off you cannot avoid: a tight breakeven more often ends at zero trades that would have reached the target, a wide one gives back more on the losers. I tune them in the tester over years, separately for each pair, and I look with suspicion at values that win only in a single year. Second, the steps are the foundation, not the ceiling. A stop can be steered more cleverly, for example by the statistics of the hour of day, because in the evening the market adds new extremes less often than in the morning, which I wrote about with the [map of the day](/en/blog/mapa-dnia/). But before you start improvising, let the boring version work first, and let a [placebo test](/en/blog/test-placebo/) decide whether the cleverer one really is cleverer.

The function from this post is in [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), together with the rest of the workshop.
