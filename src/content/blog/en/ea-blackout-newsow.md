---
title: "EA anatomy: silence before the data, the news blackout (MQL5)"
lang: "en"
kind: "trading"
date: "2026-06-12"
excerpt: "An EA does not read headlines, so it has to know the calendar. The skeleton of a gate that shuts the EA up around important releases, and the trap that makes this gate lie in the tester."
key: "ea-blackout-newsow"
slug: "ea-blackout-newsow"
---

The worst trades my EA made back before I got wiser had one thing in common: they opened three minutes before US data. The signal was correct, the plumbing worked, and the market still did whatever it wanted, because at 14:30 it is not statistics that play, it is the headline. The EA cannot read the headline. What it can do is know the calendar.

In MQL5 the economic calendar is built in and the silence gate fits in a single function. This is a skeleton: you pick the list of currencies and the importance threshold yourself, for your pair and your style.

```cpp
//--- silence around important releases: true = trading not allowed
input int InpSilenceBeforeMin = 30;  // minutes of silence before a release
input int InpSilenceAfterMin  = 15;  // minutes of silence after a release

bool BlackoutActive()
{
   // currencies whose releases concern us: base and quote of the symbol
   string currencies[2];
   currencies[0] = SymbolInfoString(_Symbol, SYMBOL_CURRENCY_BASE);
   currencies[1] = SymbolInfoString(_Symbol, SYMBOL_CURRENCY_PROFIT);

   datetime from = TimeCurrent() - InpSilenceAfterMin * 60;
   datetime to   = TimeCurrent() + InpSilenceBeforeMin * 60;

   MqlCalendarValue events[];
   if(CalendarValueHistory(events, from, to) <= 0) return false;

   for(int i = 0; i < ArraySize(events); i++)
   {
      MqlCalendarEvent ev;
      if(!CalendarEventById(events[i].event_id, ev)) continue;
      if(ev.importance < CALENDAR_IMPORTANCE_HIGH) continue; // TODO: set the threshold for yourself
      MqlCalendarCountry country;
      if(!CalendarCountryById(ev.country_id, country)) continue;
      for(int c = 0; c < 2; c++)
         if(country.currency == currencies[c]) return true;
   }
   return false;
}
```

In the [EA skeleton](/en/blog/szkielet-ea/) you add one line to the gates: `if(BlackoutActive()) return;`. From that moment the EA goes silent half an hour before every important release that touches its pair and speaks up a quarter of an hour after it.

## The trap that costs people months

The MetaTrader strategy tester has no calendar. `CalendarValueHistory` returns nothing in the tester, so the gate lets everything through and the backtest trades through NFP, FOMC and CPI as if they were ordinary hours. The result: the test looks different from real life and you do not know why.

There are two ways out and both are honest. First: for testing you export the calendar to a CSV file (the dates of important releases can be pulled once and for all for the historical years) and in the tester you read the file instead of the calendar function. Second: you accept that the backtest trades through the news and you treat the result as a pessimistic lower bound, because live the gate will cut out the worst blowups. I use the first one, because I like it when the tester and real life see the same world. Why the gap between the tester and real life is my favorite enemy, I will write about here separately.

The usual caveat: the release times in the calendar are in your broker's server time, and across different brokers the same release sits at a different hour on the clock. Check it on one release before you trust it. And whether the silence itself improves the net result, check that with a [placebo test](/en/blog/test-placebo/) on your own data, not on my word.

The function from this post is in [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), together with the rest of the workshop.

Educational material, not investment advice.
