---
title: "Anatomie eines EA: ein gestufter Trailing Stop, der nicht in Panik gerät (MQL5)"
lang: "de"
kind: "trading"
date: "2026-06-12"
excerpt: "Ein Stop, der auf jedem Tick verschoben wird, ist ein Stop, der Rauschen einsammelt. Stattdessen Stufen: Breakeven nach der ersten Schwelle, dann ein Schritt bei jedem vollen Schritt Gewinn. Die ganze Funktion, fertig zum Einbau ins EA-Skelett."
key: "ea-trailing-krokowy"
slug: "ea-trailing-krokowy"
---

Der erste Trailing Stop, den ich schrieb, verschob den Stop auf jedem Tick, immer einen Spread hinter dem aktuellen Preis. Er sah fürsorglich aus. In der Praxis sammelte er Rauschen: Eine Position, die das Ziel erreichen sollte, fiel beim ersten Zucken heraus, und das Journal war voll von Ausstiegen drei Pips vom Einstieg entfernt. Seitdem laufen meine Stops in Stufen.

Die Idee ist einfach. Tu zuerst nichts, lass die Position atmen. Nach der ersten Gewinnschwelle verschieb den Stop auf den Einstieg, von diesem Moment an kann der Trade nicht mehr verlieren. Dann verschieb den Stop um einen vollen Schritt, jedes Mal, wenn der Gewinn um einen vollen Schritt wächst. Zwischen den Schwellen steht der Stop still, und das Rauschen kümmert ihn nicht.

```cpp
//--- gestuftes Trailing: Breakeven nach der Schwelle, dann Stufen pro Schritt
input double InpBreakevenPkt = 150;  // nach so viel Gewinn in Punkten: Stop auf den Einstieg
input double InpSchrittPkt    = 100; // dann verschieb den Stop alle so viele Punkte

void GestuftesTrailing()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket))                          continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol)            continue;
      if(PositionGetInteger(POSITION_MAGIC)  != InpMagic)          continue;

      long   typ      = PositionGetInteger(POSITION_TYPE);
      double eroeffnet= PositionGetDouble(POSITION_PRICE_OPEN);
      double sl       = PositionGetDouble(POSITION_SL);
      double preis    = (typ == POSITION_TYPE_BUY)
                        ? SymbolInfoDouble(_Symbol, SYMBOL_BID)
                        : SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      double gewinn   = (typ == POSITION_TYPE_BUY) ? preis - eroeffnet
                                                   : eroeffnet - preis;
      if(gewinn < InpBreakevenPkt * _Point) continue;   // atmet noch

      // wie viele volle Schritte Gewinn über Breakeven schon da sind
      double schritte = MathFloor((gewinn - InpBreakevenPkt * _Point)
                                  / (InpSchrittPkt * _Point));
      double neuerSL = (typ == POSITION_TYPE_BUY)
                       ? eroeffnet + schritte * InpSchrittPkt * _Point
                       : eroeffnet - schritte * InpSchrittPkt * _Point;

      bool besser = (typ == POSITION_TYPE_BUY) ? (neuerSL > sl + _Point)
                                               : (sl == 0 || neuerSL < sl - _Point);
      if(besser)
         trade.PositionModify(ticket, neuerSL,
                              PositionGetDouble(POSITION_TP));
   }
}
```

Den Aufruf baust du in das `OnTick` des [Skeletts](/de/blog/szkielet-ea/) ein, vor den Gates, denn das Verwalten einer offenen Position muss immer laufen, auch dann, wenn keine neuen Einstiege geöffnet werden dürfen: `GestuftesTrailing();` als erste Zeile.

Zwei Dinge aus den Tests, beide auf den historischen Daten meines Brokers, also prüf es bei dir nach. Erstens, die Schwellen sind ein Kompromiss, den man nicht vermeiden kann: ein enger Breakeven beendet häufiger auf null Trades, die das Ziel erreicht hätten, ein weiter gibt mehr in den Verlierern ab. Ich stelle sie im Tester über Jahre ein, getrennt für jedes Paar, und schaue misstrauisch auf Werte, die nur in einem einzigen Jahr gewinnen. Zweitens, die Stufen sind das Fundament, nicht die Decke. Einen Stop kann man klüger steuern, zum Beispiel über die Statistik der Uhrzeit, denn am Abend fügt der Markt neue Extreme seltener hinzu als am Morgen, worüber ich bei der [Karte des Tages](/de/blog/mapa-dnia/) geschrieben habe. Aber bevor du anfängst zu basteln, lass zuerst die langweilige Version laufen, und lass einen [Placebo-Test](/de/blog/test-placebo/) entscheiden, ob die klügere wirklich klüger ist.

Die Funktion aus diesem Beitrag ist in [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), zusammen mit dem Rest der Werkstatt.
