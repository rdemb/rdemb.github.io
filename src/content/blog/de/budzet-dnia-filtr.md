---
title: "Das Tagesbudget als EA-Filter: jage keine Bewegung, die schon passiert ist"
lang: "de"
kind: "trading"
date: "2026-06-12"
excerpt: "Jedes Paar hat eine typische Tagesdistanz. Hat der Tag sie zurückgelegt, hört die Statistik auf, die Jagd zu stützen. MQL5-Code: die typische Spanne aus dem Median, der Prozentsatz des verbrauchten Budgets und ein Gate zum Einbauen in den EA."
key: "budzet-dnia-filtr"
slug: "budzet-dnia-filtr"
---

In den [Briefings](/de/blog/fx-brief-2026-06-12/) wiederhole ich eine Regel: Die Tagesspanne ist ein Budget. Jedes Paar hat seine typische Tagesdistanz, und hat der Tag sie zurückgelegt, hört die Statistik auf, die Jagd nach der Bewegung zu stützen. Ein Mensch kann das spüren. Ein EA muss es rechnen. Hier ist der Code, mit dem meiner es rechnet.

Die Idee passt in drei Schritte. Berechne die typische Tagesspanne als Median der Spannen der letzten paar Dutzend Tage. Prüfe, wie weit der heutige Tag schon von seinem Tief zu seinem Hoch gegangen ist. Teile das eine durch das andere und du hast den Prozentsatz des verbrauchten Budgets, eine einzige Zahl, die sagt, ob der Tag jung, reif oder fertig ist.

```cpp
//--- typische Tagesspanne: Median von (High-Low) über die letzten N D1-Tage
double TypischeTagesspanne(int tage = 40)
{
   double spannen[];
   ArrayResize(spannen, tage);
   for(int i = 1; i <= tage; i++)   // ab 1: ohne die heutige, unfertige Kerze
      spannen[i - 1] = iHigh(_Symbol, PERIOD_D1, i)
                     - iLow(_Symbol, PERIOD_D1, i);
   ArraySort(spannen);
   return spannen[tage / 2];
}

//--- wie viel Budget der Tag schon verbraucht hat: 0.0 morgens, ~1.0 bei typischem vollen Tag
double BudgetVerbraucht()
{
   double typisch = TypischeTagesspanne();
   if(typisch <= 0) return 0;
   double heute = iHigh(_Symbol, PERIOD_D1, 0) - iLow(_Symbol, PERIOD_D1, 0);
   return heute / typisch;
}

//--- Gate für den EA: dürfen wir noch PRO-Trend-Positionen eröffnen
input double InpMaxBudget = 1.0;  // darüber jagen wir die Bewegung nicht

bool BudgetErlaubt()
{
   return BudgetVerbraucht() < InpMaxBudget;
}
```

Im [EA-Skelett](/de/blog/szkielet-ea/) fügst du den Gates in `OnTick` eine Zeile hinzu: `if(!BudgetErlaubt()) return;`. Das ist alles. Der EA hört auf, Pro-Trend-Positionen an Tagen zu eröffnen, die ihre Distanz schon zurückgelegt haben, also genau dann, wenn die Jagd nach der Kerze am häufigsten das Hoch kauft.

## Drei Dinge, die ich aus eigenen Tests weiß

Erstens, der Median noch einmal. Tage mit Notenbankentscheidungen können eine Spanne haben, die dreimal so groß ist wie üblich, und ein Durchschnitt mit ihnen darin bläht das Budget für Wochen auf. Der Median sieht sie nicht, und das ist der Sinn: Das Budget soll einen gewöhnlichen Tag beschreiben.

Zweitens, das ist ein asymmetrischer Filter, und es lohnt sich zu verstehen, warum. Ein verbrauchtes Budget sagt „jage nicht", aber es sagt nicht „handle dagegen". Ich habe die offensive Variante auf Daten getestet, also den Handel auf die Rückkehr, nachdem das Budget verbraucht ist, mit Kosten und mit vorab festgehaltenen Kriterien, und nach dem Spread blieb null übrig. Darüber habe ich bei der [Karte des Tages](/de/blog/mapa-dnia/) geschrieben: Die Struktur steckt in den Daten, das kostenlose Mittagessen nicht. Deshalb nimmt das Budget bei mir dem EA ausschließlich das Recht auf späte Jagden, es schreibt nichts vor.

Drittens, die Schwelle von 1.0 ist nicht heilig. Auf EUR/USD verhält sie sich vernünftig, bei Yen-Paaren geht ein Trendtag, der morgens in Asien aufgesetzt wurde, manchmal auf 1.5 des Budgets und weiter. Und ein Vorbehalt, der für jede Zahl in diesem Blog gilt: Ich berechne sie auf den historischen Daten meines Brokers. Ein anderer Broker heißt eine andere Serverzeitzone, also eine andere Tagesgrenze, ein anderer Spread und anders zusammengesetzte Kerzen, und damit ein anderes Budget. Deshalb ist das ein Eingabeparameter und keine Konstante: Berechne und teste es auf deinem Paar, deinen Daten und deinen Kosten, bevor du es glaubst. Und wenn du nicht weißt, ob ein Testergebnis ein Vorteil oder Glück ist, dann ist der [Placebo-Test](/de/blog/test-placebo/) genau darüber, wie man die beiden auseinanderhält.

Die Funktionen aus diesem Beitrag stecken in [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), zusammen mit dem Rest der Werkstatt.

Bildungsmaterial, keine Anlageempfehlung.
