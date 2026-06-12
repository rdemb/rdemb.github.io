---
title: "The volatility clock in practice: build it yourself (Python + MQL5)"
lang: "en"
kind: "trading"
date: "2026-06-12"
excerpt: "I wrote that the market runs on a clock. Here is the code that builds that clock from your own data: the hourly volatility profile, move normalization and a function to drop straight into an EA."
key: "zegar-zmiennosci-w-praktyce"
slug: "zegar-zmiennosci-w-praktyce"
---

I wrote recently that [the market runs on a clock](/en/blog/zegar-zmiennosci/): the volatility profile, hour by hour, repeats as stubbornly as a train timetable, and a candle without the hour on the clock is incomplete information. Today the second half of that post, meaning the code. Short, no magic, ready to compute on your own data in five minutes.

## The hourly profile in Python

Export H1 or M5 data from MT5 (View, Symbols, Bars, export to CSV) so that you have a time column and a close price. Then:

```python
import pandas as pd

def hourly_profile(df, close_col="close"):
    """Typical |move| per hour of day (median), from a frame with a UTC time column."""
    df = df.copy()
    df["return"] = df[close_col].diff().abs()
    df["hour"] = df["time"].dt.hour
    return df.groupby("hour")["return"].median()

def normalized_move(move, hour, profile):
    """How many of this hour's typical moves the current move amounts to."""
    typical = profile.get(hour, profile.median())
    return move / typical if typical > 0 else 0.0

df = pd.read_csv("EURUSD_H1.csv", parse_dates=["time"])
profile = hourly_profile(df)
print(profile)                       # 24 numbers: your clock
print(normalized_move(0.0025, 3, profile))   # 25 pips at 3:00 in the morning
print(normalized_move(0.0025, 14, profile))  # the same 25 pips at 14:00
```

The median instead of the mean is deliberate: a single NFP or a central bank decision can inflate an hour's mean for years, while the median tells you what that hour usually looks like. On my EUR/USD data the difference between the quietest and the loudest hour of the day is roughly an order of magnitude. Caveat: these numbers come from my broker's historical data. With another broker the server ticks in a different timezone, the spread is different and the candles stitch together differently, so your clock will come out similar in shape but different in numbers. So compute it on the data you will actually trade. I checked this code on synthetic data with an implanted daily structure: it reproduces it faithfully, and the normalization shows exactly the point, because those same 25 pips come out as several dozen typical night moves and barely a few afternoon ones.

Two numbers from this profile change practice right away. First, the surprise threshold: a move above 3 typical for this hour is an event, below 1 it is noise. Second, the relative cost: if the spread is 0.8 of a pip and the typical move of a night hour is 3 pips, then you are paying more than a quarter of the expected move on entry alone. No signal will carry that.

## The same idea in MQL5, straight into an EA

In a bot you do not need pandas. It is enough to compute the profile from history once a day and keep it in an array:

```cpp
//--- typical |move| H1 for each hour of day, median over N days
double HourProfile[24];

void ComputeProfile(int historyDays = 60)
{
   double samples[];
   for(int h = 0; h < 24; h++)
   {
      ArrayResize(samples, 0);
      for(int d = 0; d < historyDays * 24; d++)
      {
         datetime t = iTime(_Symbol, PERIOD_H1, d);
         MqlDateTime dt; TimeToStruct(t, dt);
         if(dt.hour != h) continue;
         double move = MathAbs(iClose(_Symbol, PERIOD_H1, d)
                             - iOpen(_Symbol, PERIOD_H1, d));
         int n = ArraySize(samples);
         ArrayResize(samples, n + 1);
         samples[n] = move;
      }
      ArraySort(samples);
      int n = ArraySize(samples);
      HourProfile[h] = (n > 0) ? samples[n / 2] : 0; // median
   }
}

//--- how many of this hour's typical moves the current candle's move amounts to
double NormalizedMove()
{
   MqlDateTime dt; TimeToStruct(TimeCurrent(), dt);
   double typ = HourProfile[dt.hour];
   if(typ <= 0) return 0;
   double move = MathAbs(iClose(_Symbol, PERIOD_H1, 0)
                       - iOpen(_Symbol, PERIOD_H1, 0));
   return move / typ;
}
```

Call `ComputeProfile()` in `OnInit` and once a day, and `NormalizedMove()` where you make decisions. In the [EA skeleton](/en/blog/szkielet-ea/) the natural place is the `AllowedToTrade()` gate: instead of hardcoded from-to hours, you can refuse to trade when `HourProfile[hour]` does not cover a few multiples of the spread. Then the bot stops trading at night on European pairs on its own and returns to trading on its own when the market wakes up, with no knowledge of sessions hardcoded anywhere.

A fair caveat, the same as in that post: the clock says how much the market usually gives, not where it will go. It is a filter and a unit of measure, not a signal. But as a filter it is hard to overrate, because it works on the most stable regularity I have found in this data.

Files from this post: [zegar_zmiennosci.py](/code/zegar_zmiennosci.py), the MQL5 functions in [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), and for practice a [synthetic CSV](/code/EURUSD_H1_syntetyk.csv) with an implanted daily structure and a warning in the header.

Educational material, not investment advice.
