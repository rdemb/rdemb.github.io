---
title: "The EA skeleton I start every EA from (MQL5)"
lang: "en"
kind: "trading"
date: "2026-06-12"
excerpt: "Before an EA gets any idea about entries, it must master six boring things: a new bar, the spread, the hour, position size from risk, a stop and a journal. A complete skeleton to copy."
key: "szkielet-ea"
slug: "ea-skeleton"
---

Most EAs I have seen start with a signal. Mine starts with plumbing. Before the EA gets any idea about entries, it has to master six boring things: recognize a new bar, refuse to trade on a wide spread, know the hour of day, size the position from risk, place a stop and write everything to a journal. The signal is the last ten percent. The ninety percent below is yours to copy.

The code is MQL5 (highlighted as C++, the syntax is nearly identical). Paste it into MetaEditor as a new Expert Advisor, compile, and run it through the strategy tester before it ever sees even a demo account.

```cpp
//+------------------------------------------------------------------+
//| EA skeleton: plumbing without a signal.                          |
//| Your idea goes in exactly one place: EntrySignal().              |
//+------------------------------------------------------------------+
#include <Trade/Trade.mqh>
CTrade trade;

input long   InpMagic        = 26061201; // this EA's magic number
input double InpRiskPct      = 0.5;      // risk per trade, % of equity
input double InpStopPts      = 250;      // stop loss in points
input double InpMaxSpreadPts = 25;       // refuse to trade above this spread
input int    InpHourFrom     = 7;        // trade from this hour (server time)
input int    InpHourTo       = 17;       // until this hour
input bool   InpSingle       = true;     // at most one position at a time

datetime lastBar = 0;

int OnInit()
{
   trade.SetExpertMagicNumber(InpMagic);
   if(InpRiskPct <= 0 || InpRiskPct > 2)
   {
      Print("Risk outside the sane range (0-2%).");
      return INIT_PARAMETERS_INCORRECT;
   }
   return INIT_SUCCEEDED;
}

//--- act once per bar: everything else in OnTick is gates
void OnTick()
{
   if(!NewBar())                 return;
   if(!AllowedToTrade())         return;
   if(InpSingle && MyPositionExists()) return;

   int dir = EntrySignal();      // <- YOUR idea goes here
   if(dir == 0)                  return;

   double lot = LotFromRisk(InpStopPts);
   if(lot <= 0)                  return;

   double price = (dir > 0) ? SymbolInfoDouble(_Symbol, SYMBOL_ASK)
                            : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double sl    = (dir > 0) ? price - InpStopPts * _Point
                            : price + InpStopPts * _Point;
   bool ok = (dir > 0) ? trade.Buy(lot, _Symbol, 0, sl)
                       : trade.Sell(lot, _Symbol, 0, sl);
   Journal(dir, lot, price, sl, ok);
}

bool NewBar()
{
   datetime t = iTime(_Symbol, _Period, 0);
   if(t == lastBar) return false;
   lastBar = t;
   return true;
}

//--- gates: spread and hour of day
bool AllowedToTrade()
{
   long spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   if(spread > InpMaxSpreadPts) return false;
   MqlDateTime dt; TimeToStruct(TimeCurrent(), dt);
   if(dt.hour < InpHourFrom || dt.hour >= InpHourTo) return false;
   return true;
}

bool MyPositionExists()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(PositionSelectByTicket(ticket)
         && PositionGetString(POSITION_SYMBOL) == _Symbol
         && PositionGetInteger(POSITION_MAGIC) == InpMagic)
         return true;
   }
   return false;
}

//--- position size from risk: % of equity / value of the stop
double LotFromRisk(double stopPts)
{
   double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
   double risk    = equity * InpRiskPct / 100.0;
   double tickVal = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSz  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickVal <= 0 || tickSz <= 0) return 0;
   double lossPerLot = stopPts * _Point / tickSz * tickVal;
   double lot = risk / lossPerLot;
   double step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   lot = MathFloor(lot / step) * step;
   double lotMin = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double lotMax = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   return MathMin(MathMax(lot, lotMin), lotMax);
}

//--- CSV journal: priceless after a month
void Journal(int dir, double lot, double price, double sl, bool ok)
{
   int h = FileOpen("skeleton_journal.csv",
                    FILE_READ | FILE_WRITE | FILE_CSV | FILE_COMMON, ';');
   if(h == INVALID_HANDLE) return;
   FileSeek(h, 0, SEEK_END);
   FileWrite(h, TimeToString(TimeCurrent()), _Symbol,
             dir > 0 ? "BUY" : "SELL", DoubleToString(lot, 2),
             DoubleToString(price, _Digits), DoubleToString(sl, _Digits),
             ok ? "OK" : IntegerToString(trade.ResultRetcode()));
   FileClose(h);
}

//--- YOUR idea: return 1 (long), -1 (short) or 0 (nothing)
int EntrySignal()
{
   return 0; // the skeleton deliberately does not trade
}
```

## Why exactly these parts

The new-bar gate protects you from the most common beginner-EA bug: logic running on every tick, opening ten positions a second. The spread and hours gates follow from the [volatility clock](/en/blog/zegar-zmiennosci/): there are hours when costs eat the typical move and no signal can earn that back. Position size computed from risk, not hardcoded, makes every trade cost the same share of equity regardless of the stop and the instrument. And the CSV journal looks redundant until the first day you disagree with your own tester.

Notice what is missing. There is no signal. `EntrySignal()` returns zero and the skeleton deliberately does not trade. That is the order I do things in: before you start testing entry ideas, the EA must be boring, predictable and measurable. Mine runs on exactly this layout, just with different numbers and with a human above the direction, which I wrote about in [the division of labor](/en/blog/czlowiek-i-maszyna/).

The code is educational: compile it, run it through the tester on years of data from your broker, because it will live with that broker's bars, spread and server timezone. Break it, fix it. Let it run on demo for a long time first. Touch money last, and small.

File from this post: [dlogic-szkielet-ea.mq5](/code/dlogic-szkielet-ea.mq5) (comments in Polish, code speaks for itself). The whole workshop's functions live in [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh).
