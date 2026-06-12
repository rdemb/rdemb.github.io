---
title: "Die Volatilitätsuhr in der Praxis: bau sie dir selbst (Python + MQL5)"
lang: "de"
kind: "trading"
date: "2026-06-12"
excerpt: "Ich habe geschrieben, dass der Markt nach einer Uhr läuft. Hier ist der Code, mit dem du diese Uhr aus deinen eigenen Daten baust: das Stundenprofil der Volatilität, die Normalisierung der Bewegung und eine Funktion direkt für den EA."
key: "zegar-zmiennosci-w-praktyce"
slug: "zegar-zmiennosci-w-praktyce"
---

Ich habe kürzlich geschrieben, dass [der Markt nach einer Uhr läuft](/de/blog/zegar-zmiennosci/): Das Volatilitätsprofil, Stunde für Stunde, wiederholt sich so hartnäckig wie ein Fahrplan, und eine Kerze ohne die Stunde auf der Uhr ist eine lückenhafte Information. Heute die zweite Hälfte jenes Beitrags, also der Code. Kurz, ohne Magie, in fünf Minuten auf deinen eigenen Daten zu rechnen.

## Das Stundenprofil in Python

Exportiere aus MT5 H1- oder M5-Daten (Ansicht, Symbole, Balken, Export nach CSV) so, dass du eine Zeitspalte und einen Schlusskurs hast. Dann:

```python
import pandas as pd

def stundenprofil(df, close_spalte="close"):
    """Typische |Bewegung| pro Stunde des Tages (Median), aus einem Frame mit UTC-Zeitspalte."""
    df = df.copy()
    df["rendite"] = df[close_spalte].diff().abs()
    df["stunde"] = df["zeit"].dt.hour
    return df.groupby("stunde")["rendite"].median()

def normalisierte_bewegung(bewegung, stunde, profil):
    """Wie viele typische Bewegungen dieser Stunde die aktuelle Bewegung ausmacht."""
    typisch = profil.get(stunde, profil.median())
    return bewegung / typisch if typisch > 0 else 0.0

df = pd.read_csv("EURUSD_H1.csv", parse_dates=["zeit"])
profil = stundenprofil(df)
print(profil)                       # 24 Zahlen: deine Uhr
print(normalisierte_bewegung(0.0025, 3, profil))   # 25 Pips um 3:00 nachts
print(normalisierte_bewegung(0.0025, 14, profil))  # dieselben 25 Pips um 14:00
```

Der Median statt des Mittelwerts ist Absicht: Ein einzelner NFP oder eine Zentralbankentscheidung kann den Mittelwert einer Stunde für Jahre verzerren, während der Median sagt, wie diese Stunde normalerweise aussieht. Auf meinen EUR/USD-Daten ist der Unterschied zwischen der leisesten und der lautesten Stunde des Tages ungefähr eine Größenordnung. Einschränkung: Diese Zahlen stammen aus den historischen Daten meines Brokers. Bei einem anderen Broker tickt der Server in einer anderen Zeitzone, der Spread ist anders und die Kerzen kleben anders zusammen, also kommt deine Uhr in der Form ähnlich heraus, aber anders in den Zahlen. Deshalb rechne sie auf den Daten, mit denen du wirklich handeln wirst. Ich habe diesen Code auf synthetischen Daten mit eingepflanzter Tagesstruktur geprüft: Er gibt sie treu wieder, und die Normalisierung zeigt genau den Punkt, denn dieselben 25 Pips kommen als mehrere Dutzend typische Nachtbewegungen heraus und kaum ein paar des Nachmittags.

Zwei Zahlen aus diesem Profil ändern die Praxis sofort. Erstens die Überraschungsschwelle: Eine Bewegung über 3 typische für diese Stunde ist ein Ereignis, unter 1 ist sie Rauschen. Zweitens die relativen Kosten: Wenn der Spread 0,8 Pips beträgt und die typische Bewegung einer Nachtstunde 3 Pips, dann zahlst du allein beim Einstieg mehr als ein Viertel der erwarteten Bewegung. Kein Signal trägt das.

## Derselbe Gedanke in MQL5, direkt in den EA

In einem Bot brauchst du kein pandas. Es reicht, das Profil einmal am Tag aus der Historie zu rechnen und in einem Array zu halten:

```cpp
//--- typische |Bewegung| H1 für jede Stunde des Tages, Median über N Tage
double StundenProfil[24];

void ProfilRechnen(int historieTage = 60)
{
   double proben[];
   for(int s = 0; s < 24; s++)
   {
      ArrayResize(proben, 0);
      for(int d = 0; d < historieTage * 24; d++)
      {
         datetime t = iTime(_Symbol, PERIOD_H1, d);
         MqlDateTime dt; TimeToStruct(t, dt);
         if(dt.hour != s) continue;
         double bewegung = MathAbs(iClose(_Symbol, PERIOD_H1, d)
                                 - iOpen(_Symbol, PERIOD_H1, d));
         int n = ArraySize(proben);
         ArrayResize(proben, n + 1);
         proben[n] = bewegung;
      }
      ArraySort(proben);
      int n = ArraySize(proben);
      StundenProfil[s] = (n > 0) ? proben[n / 2] : 0; // Median
   }
}

//--- wie viele typische Bewegungen dieser Stunde die Bewegung der aktuellen Kerze ausmacht
double NormalisierteBewegung()
{
   MqlDateTime dt; TimeToStruct(TimeCurrent(), dt);
   double typ = StundenProfil[dt.hour];
   if(typ <= 0) return 0;
   double bewegung = MathAbs(iClose(_Symbol, PERIOD_H1, 0)
                           - iOpen(_Symbol, PERIOD_H1, 0));
   return bewegung / typ;
}
```

`ProfilRechnen()` rufst du in `OnInit` und einmal am Tag auf, `NormalisierteBewegung()` an der Stelle, an der du Entscheidungen triffst. Im [EA-Skelett](/de/blog/szkielet-ea/) ist der natürliche Ort das Gatter `WolnoGrac()`: statt fester Stunden von-bis kannst du das Spielen verweigern, wenn `StundenProfil[stunde]` nicht ein paar Vielfache des Spreads abdeckt. Dann hört der Bot von selbst auf, nachts an europäischen Paaren zu spielen, und kehrt von selbst zum Spiel zurück, wenn der Markt aufwacht, ohne irgendein fest eingetragenes Wissen über Sitzungen.

Eine faire Einschränkung, dieselbe wie in jenem Beitrag: Die Uhr sagt, wie viel der Markt normalerweise hergibt, nicht wohin er geht. Sie ist ein Filter und eine Maßeinheit, kein Signal. Aber als Filter ist sie kaum zu überschätzen, denn sie arbeitet auf der stabilsten Regelmäßigkeit, die ich in diesen Daten gefunden habe.

Dateien aus diesem Beitrag: [zegar_zmiennosci.py](/code/zegar_zmiennosci.py), die MQL5-Funktionen in [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), und zum Üben ein [synthetisches CSV](/code/EURUSD_H1_syntetyk.csv) mit eingepflanzter Tagesstruktur und einer Warnung im Kopf.

Bildungsmaterial, keine Anlageempfehlung.
