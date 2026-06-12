---
title: "EA-Anatomie: Stille vor den Daten, der News-Blackout (MQL5)"
lang: "de"
kind: "trading"
date: "2026-06-12"
excerpt: "Ein EA liest keine Schlagzeilen, also muss er den Kalender kennen. Das Gerüst eines Gates, das dem EA rund um wichtige Veröffentlichungen den Mund verschließt, und die Falle, durch die dieses Gate im Tester lügt."
key: "ea-blackout-newsow"
slug: "ea-blackout-newsow"
---

Die schlimmsten Trades meines EA aus der Zeit, bevor ich klüger wurde, hatten einen gemeinsamen Nenner: Sie öffneten drei Minuten vor den US-Daten. Das Signal war korrekt, die Mechanik lief, und der Markt machte trotzdem, was er wollte, denn um 14:30 Uhr spielt nicht die Statistik, sondern die Schlagzeile. Die Schlagzeile kann der EA nicht lesen. Den Kalender aber muss er kennen.

In MQL5 ist der Wirtschaftskalender eingebaut und das Stille-Gate passt in eine einzige Funktion. Das ist ein Gerüst: Die Liste der Währungen und die Wichtigkeitsschwelle wählst du selbst, für dein Paar und deinen Stil.

```cpp
//--- Stille rund um wichtige Veröffentlichungen: true = Handel nicht erlaubt
input int InpStilleVorMin  = 30;  // Minuten Stille vor einer Veröffentlichung
input int InpStilleNachMin = 15;  // Minuten Stille nach einer Veröffentlichung

bool BlackoutAktiv()
{
   // Währungen, deren Veröffentlichungen uns betreffen: Basis und Kurswährung des Symbols
   string waehrungen[2];
   waehrungen[0] = SymbolInfoString(_Symbol, SYMBOL_CURRENCY_BASE);
   waehrungen[1] = SymbolInfoString(_Symbol, SYMBOL_CURRENCY_PROFIT);

   datetime von = TimeCurrent() - InpStilleNachMin * 60;
   datetime bis = TimeCurrent() + InpStilleVorMin * 60;

   MqlCalendarValue ereignisse[];
   if(CalendarValueHistory(ereignisse, von, bis) <= 0) return false;

   for(int i = 0; i < ArraySize(ereignisse); i++)
   {
      MqlCalendarEvent ev;
      if(!CalendarEventById(ereignisse[i].event_id, ev)) continue;
      if(ev.importance < CALENDAR_IMPORTANCE_HIGH) continue; // TODO: Schwelle für dich selbst setzen
      MqlCalendarCountry land;
      if(!CalendarCountryById(ev.country_id, land)) continue;
      for(int w = 0; w < 2; w++)
         if(land.currency == waehrungen[w]) return true;
   }
   return false;
}
```

Im [EA-Skelett](/de/blog/szkielet-ea/) fügst du den Gates eine Zeile hinzu: `if(BlackoutAktiv()) return;`. Von diesem Moment an schweigt der EA eine halbe Stunde vor jeder wichtigen Veröffentlichung, die sein Paar betrifft, und meldet sich eine Viertelstunde danach wieder.

## Die Falle, die Leute Monate kostet

Der Strategie-Tester von MetaTrader hat keinen Kalender. `CalendarValueHistory` gibt im Tester nichts zurück, also lässt das Gate alles durch und der Backtest handelt durch NFP, FOMC und CPI, als wären es ganz normale Stunden. Das Ergebnis: Der Test sieht anders aus als das echte Leben, und du weißt nicht, warum.

Es gibt zwei Auswege, und beide sind ehrlich. Erstens: Für die Tests exportierst du den Kalender in eine CSV-Datei (die Termine wichtiger Veröffentlichungen lassen sich für die historischen Jahre ein für alle Mal abrufen) und im Tester liest du die Datei statt der Kalenderfunktion. Zweitens: Du akzeptierst, dass der Backtest durch die News handelt, und nimmst das Ergebnis als pessimistische Untergrenze, denn live wird das Gate die schlimmsten Ausrutscher abschneiden. Ich nutze den ersten Weg, weil ich es mag, wenn Tester und echtes Leben dieselbe Welt sehen. Warum die Lücke zwischen Tester und echtem Leben mein Lieblingsfeind ist, schreibe ich hier noch separat.

Der übliche Vorbehalt: Die Veröffentlichungszeiten im Kalender stehen in der Serverzeit deines Brokers, und bei verschiedenen Brokern liegt dieselbe Veröffentlichung zu einer anderen Uhrzeit auf der Uhr. Prüfe es an einer Veröffentlichung, bevor du ihr vertraust. Und ob die Stille selbst das Netto-Ergebnis verbessert, prüfe mit einem [Placebo-Test](/de/blog/test-placebo/) auf deinen eigenen Daten, nicht auf mein Wort hin.

Die Funktion aus diesem Beitrag steckt in [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), zusammen mit dem Rest der Werkstatt.

Bildungsmaterial, keine Anlageempfehlung.
