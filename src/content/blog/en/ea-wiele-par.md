---
title: "EA anatomy: one bot, many pairs and risk that adds up (MQL5)"
lang: "en"
kind: "trading"
date: "2026-06-12"
excerpt: "A second symbol in an EA is not a second line, it is a second risk. A skeleton that loops over pairs with a separate magic and a shared limit on total risk, plus the correlation trap that turns three positions into one."
key: "ea-wiele-par"
slug: "ea-wiele-par"
---

Sooner or later everyone wants their EA to trade several pairs at once. And almost everyone does it the same way: they hang the same EA on five charts and consider the matter closed. It works until the day all five positions turn out to be the same bet.

Mechanics first, then the trap. One EA can handle a list of symbols from a single chart: a loop, a separate state per symbol, a separate magic so positions can be settled per pair.

```cpp
//--- many pairs from one EA: the loop skeleton
input string InpSymbols = "EURUSD;GBPUSD;USDJPY"; // list separated by semicolons
input double InpMaxTotalRiskPct = 1.5;            // sum of open risk, % of equity

string symbols[];
datetime lastBarSym[];

int OnInit()
{
   int n = StringSplit(InpSymbols, ';', symbols);
   if(n <= 0) return INIT_PARAMETERS_INCORRECT;
   ArrayResize(lastBarSym, n);
   ArrayInitialize(lastBarSym, 0);
   for(int i = 0; i < n; i++)
      if(!SymbolSelect(symbols[i], true)) // add to Market Watch
         PrintFormat("Symbol %s missing at the broker", symbols[i]);
   return INIT_SUCCEEDED;
}

void OnTick()
{
   for(int i = 0; i < ArraySize(symbols); i++)
      HandleSymbol(i);
}

void HandleSymbol(int i)
{
   string sym = symbols[i];
   datetime t = iTime(sym, _Period, 0);
   if(t == 0 || t == lastBarSym[i]) return; // new bar per symbol
   lastBarSym[i] = t;

   if(TotalRiskPct() >= InpMaxTotalRiskPct) return; // shared limit
   long magic = InpMagic + i;                       // magic per pair

   // TODO: gates (spread/hours/budget) and EntrySignal() for sym,
   //       as in /blog/szkielet-ea/, just with sym instead of _Symbol
}

//--- sum of risk on this EA's open positions: how much % of equity hangs on stops
double TotalRiskPct()
{
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   if(equity <= 0) return 100;
   double sum = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket)) continue;
      long m = PositionGetInteger(POSITION_MAGIC);
      if(m < InpMagic || m >= InpMagic + ArraySize(symbols)) continue;
      string sym = PositionGetString(POSITION_SYMBOL);
      double sl  = PositionGetDouble(POSITION_SL);
      if(sl <= 0) { sum += 100; continue; }  // position without a stop = red flag
      double price   = PositionGetDouble(POSITION_PRICE_OPEN);
      double volume  = PositionGetDouble(POSITION_VOLUME);
      double tickVal = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_VALUE);
      double tickSz  = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_SIZE);
      if(tickVal <= 0 || tickSz <= 0) continue;
      double loss = MathAbs(price - sl) / tickSz * tickVal * volume;
      sum += loss / equity * 100.0;
   }
   return sum;
}
```

`TotalRiskPct()` is the heart of this post. Before the bot opens anything new, it sums how many percent of equity already hangs on the stops of all its positions, and refuses when the sum reaches the limit. A position without a stop counts as infinite risk and blocks everything, on purpose.

## The trap: three positions, one bet

Now the part the code cannot handle by itself. EUR/USD, GBP/USD and USD/CHF are three markets on paper, and in practice often one bet: against the dollar. When the dollar moves, all three positions go together, into profit or into loss, and a total-risk limit counted per position lies, because the real risk is concentrated in one currency. The simplest defense I use: count exposure per currency, not per pair, and cap how many percent of risk can hang on one currency in total. A stricter version: do not open a second position in the same direction on pairs that share a base or quote currency until the first one stands at breakeven after [trailing](/en/blog/ea-trailing-krokowy/).

Compute the correlations on your own data, because they change over time and depend on the sampling period, and numbers from someone else's post, mine included, are only a hint about where to look. And as always: every part separately through a [placebo test](/en/blog/test-placebo/) and the tester on years of data from your broker, before these pairs trade together with real money.

The total-risk function is in [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), together with the rest of the workshop.
