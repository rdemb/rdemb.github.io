---
title: "Was ein Trade wirklich kostet und wie du deine eigene Slippage misst"
lang: "de"
kind: "trading"
date: "2026-06-12"
excerpt: "Den Spread siehst du, die Slippage spürst du, den Swap zahlst du im Schlaf. Die Rechnung der vollen Kosten eines Round Turns, eine Erweiterung des EA-Journals um angeforderten gegen ausgeführten Preis und Code, der aus diesem Journal deine private Preisliste rechnet."
key: "ile-kosztuje-transakcja"
slug: "ile-kosztuje-transakcja"
---

In den [Briefs](/de/blog/fx-brief-2026-06-12/) wiederhole ich, dass nachts die Kosten die typische Bewegung auffressen. Heute zerlegen wir diese Kosten in ihre Teile, denn sie bestehen aus drei Schichten, und nur eine davon sieht man auf den ersten Blick.

Den Spread siehst du im Terminal, und er ist der ehrlichste: Du zahlst ihn immer, beim Einstieg in den Markt. Bei einem Spread von 0.8 Pip und einer Strategie, die auf 10 Pips zielt, gibst du 8% des Ziels ab, bevor irgendetwas passiert; bei einem Ziel von 100 Pips ist derselbe Spread weniger als ein Prozent. Deshalb rechnet sich die Kosten immer im Verhältnis zur Größenordnung der Strategie, nicht in absoluten Pips. Die Slippage ist tückischer: Sie ist die Differenz zwischen dem Preis, den du angefordert hast, und dem Preis, den du bekommen hast. Sie ist wochenlang null und brutal genau dann, wenn sich der Markt bewegt, also dann, wenn du am meisten im Spiel sein willst. Der Swap wird für das Halten einer Position über Nacht gezahlt und betrifft einen Day-Trader selten, aber eine einzige „besonders vielversprechende" Position, die von Mittwoch auf Donnerstag über Nacht liegen bleibt, wenn der dreifache Swap anfällt, reicht, um sich zu merken, dass es ihn gibt.

Spread und Swap findest du in der Instrumentenspezifikation. Die Slippage findest du nirgends, denn sie ist deine: Sie hängt vom Broker ab, von der Tageszeit, von der Ordergröße und davon, ob du in die Stille oder in den Lärm einsteigst. Der einzige ehrliche Weg, sie zu kennen, ist, sie bei dir selbst zu messen.

## Ein Journal, das sich selbst misst

Im [EA-Skelett](/de/blog/szkielet-ea/) zeichnet das Journal den angeforderten Preis auf. Es reicht, den Ausführungspreis dazuzuschreiben, den der Broker zurückgibt, und die Differenz wird zu deiner privaten Slippage-Statistik. Die Änderung ist klein:

```cpp
//--- in Journal(): Ausführungspreis und Slippage in Punkten dazuschreiben
double wykonana = trade.ResultPrice();          // der Preis, den der Broker gab
double poslizg  = (wykonana > 0)
                  ? (wykonana - cena) / _Point * (kier > 0 ? 1 : -1)
                  : 0;                          // positiv = schlechtere Ausführung
FileWrite(h, TimeToString(TimeCurrent()), _Symbol,
          kier > 0 ? "BUY" : "SELL", DoubleToString(lot, 2),
          DoubleToString(cena, _Digits),        // angefordert
          DoubleToString(wykonana, _Digits),    // ausgeführt
          DoubleToString(poslizg, 1),           // Slippage in Punkten
          DoubleToString(sl, _Digits),
          ok ? "OK" : IntegerToString(trade.ResultRetcode()));
```

Nach einem Monat auf Demo, und letztlich auf einem kleinen echten Konto, hast du eine Datei, aus der man Dinge rechnen kann, über die die meisten Leute nur spekulieren:

```python
import pandas as pd

dz = pd.read_csv("szkielet_dziennik.csv", sep=";", header=None,
                 names=["czas","symbol","strona","lot","zadana",
                        "wykonana","poslizg_pkt","sl","status"])
dz["czas"] = pd.to_datetime(dz["czas"])
dz = dz[dz["status"] == "OK"]

print("Median Slippage [Pkt]:", dz["poslizg_pkt"].median())
print("p90 Slippage [Pkt]:   ", dz["poslizg_pkt"].quantile(0.9))
print("\nSlippage nach Stunde (Median):")
print(dz.groupby(dz["czas"].dt.hour)["poslizg_pkt"].median())
```

Der Median sagt dir, wie viel du gewöhnlich zahlst. Das neunzigste Perzentil sagt dir, wie viel du zahlst, wenn es weh tut, und genau dieses sollte in den [Placebo-Test](/de/blog/test-placebo/) als Einstiegskosten einfließen, wenn die Strategie in geschäftigen Stunden spielt. Die Aufschlüsselung nach Stunden zeigt meist dasselbe wie die [Volatilitätsuhr](/de/blog/zegar-zmiennosci/) von der anderen Seite des Spiegels: Wo der Markt beschleunigt, wächst die Slippage mit ihm.

Zum Schluss die Arithmetik, die sich lohnt, einmal und gründlich für die eigene Strategie zu machen. Die vollen Kosten eines Round Turns sind der Spread plus zwei Slippages, beim Einstieg und beim Ausstieg. Wenn eine Strategie zwei Einstiege am Tag macht, bei Round-Turn-Kosten von 1.2 Pip, dann gibt sie dem Markt rund 600 Pips im Jahr allein an Gebühren ab, egal ob sie recht hat oder nicht. Ein Edge, der das nicht mit Reserve verdient, ist kein Edge, sondern eine Spende an die Infrastruktur. Die Zahlen setzt du natürlich mit deinen eigenen ein, aus deinem eigenen Journal und der Preisliste deines eigenen Brokers, denn meine Slippage und deine Slippage sind zwei verschiedene Tiere, sogar auf demselben Paar.

Bildungsmaterial, keine Anlageempfehlung.
