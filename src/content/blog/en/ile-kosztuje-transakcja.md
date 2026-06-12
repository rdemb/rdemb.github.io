---
title: "What a trade really costs and how to measure your own slippage"
lang: "en"
kind: "trading"
date: "2026-06-12"
excerpt: "You see the spread, you feel the slippage, you pay the swap in your sleep. The full cost of a round turn, an extension of the EA journal with requested versus filled price, and code that turns that journal into your private price list."
key: "ile-kosztuje-transakcja"
slug: "ile-kosztuje-transakcja"
---

In the [briefs](/en/blog/fx-brief-2026-06-12/) I keep saying that at night the cost eats the typical move. Today let us take that cost apart, because it is made of three layers and only one of them is visible at a glance.

The spread you see in the terminal and it is the most honest: you pay it every time, on entry into the market. At a spread of 0.8 pip and a strategy aiming for 10 pips, you give up 8% of the target before anything happens; at a 100-pip target the same spread is less than a percent. That is why cost is always measured against the scale of the strategy, not in absolute pips. Slippage is sneakier: it is the difference between the price you requested and the price you got. It is zero for weeks and brutal exactly when the market moves, which is exactly when you most want to be in the game. The swap is paid for holding a position overnight and rarely concerns a day trader, but one "exceptionally promising" position left overnight from Wednesday to Thursday, when the triple is charged, is enough to remember it exists.

The spread and swap you will find in the instrument specification. Slippage you will not find anywhere, because it is yours: it depends on the broker, the time of day, the order size and whether you enter into silence or into noise. The only honest way to know it is to measure it on yourself.

## A journal that measures itself

In the [EA skeleton](/en/blog/szkielet-ea/) the journal records the requested price. It is enough to add the fill price the broker returns, and the difference becomes your private slippage statistic. The change is small:

```cpp
//--- in Journal(): add the filled price and slippage in points
double wykonana = trade.ResultPrice();          // the price the broker gave
double poslizg  = (wykonana > 0)
                  ? (wykonana - cena) / _Point * (kier > 0 ? 1 : -1)
                  : 0;                          // positive = worse fill
FileWrite(h, TimeToString(TimeCurrent()), _Symbol,
          kier > 0 ? "BUY" : "SELL", DoubleToString(lot, 2),
          DoubleToString(cena, _Digits),        // requested
          DoubleToString(wykonana, _Digits),    // filled
          DoubleToString(poslizg, 1),           // slippage in points
          DoubleToString(sl, _Digits),
          ok ? "OK" : IntegerToString(trade.ResultRetcode()));
```

After a month on demo, and ultimately on a small live account, you have a file from which you can compute things most people only speculate about:

```python
import pandas as pd

dz = pd.read_csv("szkielet_dziennik.csv", sep=";", header=None,
                 names=["czas","symbol","strona","lot","zadana",
                        "wykonana","poslizg_pkt","sl","status"])
dz["czas"] = pd.to_datetime(dz["czas"])
dz = dz[dz["status"] == "OK"]

print("median slippage [pts]:", dz["poslizg_pkt"].median())
print("p90 slippage [pts]:   ", dz["poslizg_pkt"].quantile(0.9))
print("\nslippage by hour (median):")
print(dz.groupby(dz["czas"].dt.hour)["poslizg_pkt"].median())
```

The median tells you what you usually pay. The ninetieth percentile tells you what you pay when it hurts, and that is the one that should go into the [placebo test](/en/blog/test-placebo/) as the entry cost, if the strategy plays in busy hours. The breakdown by hour usually shows the same thing as the [volatility clock](/en/blog/zegar-zmiennosci/) from the other side of the mirror: where the market speeds up, slippage grows with it.

To finish, the arithmetic worth doing once and properly for your own strategy. The full cost of a round turn is the spread plus two slippages, on entry and on exit. If a strategy makes two entries a day at a round-turn cost of 1.2 pip, it gives the market about 600 pips a year in fees alone, whether it is right or not. An edge that does not earn that back with room to spare is not an edge, it is a donation to the infrastructure. The numbers you will of course substitute with your own, from your own journal and your own broker's price list, because my slippage and your slippage are two different animals, even on the same pair.

Educational material, not investment advice.
