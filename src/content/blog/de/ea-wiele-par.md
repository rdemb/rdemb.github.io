---
title: "Anatomie eines EA: ein Bot, viele Paare und ein Risiko, das sich summiert (MQL5)"
lang: "de"
kind: "trading"
date: "2026-06-12"
excerpt: "Ein zweites Symbol im EA ist keine zweite Zeile, sondern ein zweites Risiko. Ein Skelett, das über die Paare läuft, mit eigenem Magic und einem gemeinsamen Limit für das Gesamtrisiko, dazu die Korrelationsfalle, durch die drei Positionen zu einer werden."
key: "ea-wiele-par"
slug: "ea-wiele-par"
---

Früher oder später will jeder, dass sein EA auf mehreren Paaren gleichzeitig spielt. Und fast jeder macht es gleich: Er hängt denselben EA an fünf Charts und betrachtet das Thema als erledigt. Es funktioniert, bis der Tag kommt, an dem sich alle fünf Positionen als dieselbe Wette herausstellen.

Erst die Mechanik, dann die Falle. Ein EA kann eine Liste von Symbolen von einem einzigen Chart aus bedienen: eine Schleife, ein eigener Zustand pro Symbol, ein eigener Magic, damit sich die Positionen pro Paar abrechnen lassen.

```cpp
//--- viele Paare aus einem EA: das Schleifen-Skelett
input string InpSymbole = "EURUSD;GBPUSD;USDJPY"; // Liste, durch Semikolon getrennt
input double InpMaxGesamtRisikoProz = 1.5;        // Summe des offenen Risikos, % des Kapitals

string symbole[];
datetime letzteKerzeSym[];

int OnInit()
{
   int n = StringSplit(InpSymbole, ';', symbole);
   if(n <= 0) return INIT_PARAMETERS_INCORRECT;
   ArrayResize(letzteKerzeSym, n);
   ArrayInitialize(letzteKerzeSym, 0);
   for(int i = 0; i < n; i++)
      if(!SymbolSelect(symbole[i], true)) // zur Marktübersicht hinzufügen
         PrintFormat("Symbol %s fehlt beim Broker", symbole[i]);
   return INIT_SUCCEEDED;
}

void OnTick()
{
   for(int i = 0; i < ArraySize(symbole); i++)
      SymbolBearbeiten(i);
}

void SymbolBearbeiten(int i)
{
   string sym = symbole[i];
   datetime t = iTime(sym, _Period, 0);
   if(t == 0 || t == letzteKerzeSym[i]) return; // neue Kerze pro Symbol
   letzteKerzeSym[i] = t;

   if(GesamtRisikoProz() >= InpMaxGesamtRisikoProz) return; // gemeinsames Limit
   long magic = InpMagic + i;                               // Magic pro Paar

   // TODO: Gates (Spread/Stunden/Budget) und EinstiegsSignal() für sym,
   //       wie in /blog/szkielet-ea/, nur mit sym statt _Symbol
}

//--- Summe des Risikos der offenen Positionen dieses EA: wie viel % des Kapitals an Stops hängt
double GesamtRisikoProz()
{
   double kapital = AccountInfoDouble(ACCOUNT_EQUITY);
   if(kapital <= 0) return 100;
   double summe = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket)) continue;
      long m = PositionGetInteger(POSITION_MAGIC);
      if(m < InpMagic || m >= InpMagic + ArraySize(symbole)) continue;
      string sym = PositionGetString(POSITION_SYMBOL);
      double sl  = PositionGetDouble(POSITION_SL);
      if(sl <= 0) { summe += 100; continue; }  // Position ohne Stop = rote Lampe
      double preis   = PositionGetDouble(POSITION_PRICE_OPEN);
      double volumen = PositionGetDouble(POSITION_VOLUME);
      double tickVal = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_VALUE);
      double tickSz  = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_SIZE);
      if(tickVal <= 0 || tickSz <= 0) continue;
      double verlust = MathAbs(preis - sl) / tickSz * tickVal * volumen;
      summe += verlust / kapital * 100.0;
   }
   return summe;
}
```

`GesamtRisikoProz()` ist das Herz dieses Beitrags. Bevor der Bot etwas Neues öffnet, summiert er, wie viel Prozent des Kapitals schon an den Stops aller seiner Positionen hängt, und verweigert, wenn die Summe das Limit erreicht. Eine Position ohne Stop zählt als unendliches Risiko und blockiert alles, absichtlich.

## Die Falle: drei Positionen, eine Wette

Jetzt der Teil, den der Code allein nicht erledigt. EUR/USD, GBP/USD und USD/CHF sind auf dem Papier drei Märkte und in der Praxis oft eine Wette: gegen den Dollar. Wenn sich der Dollar bewegt, gehen alle drei Positionen zusammen, in Gewinn oder in Verlust, und ein pro Position gerechnetes Gesamtrisiko-Limit lügt, denn das echte Risiko ist in einer Währung konzentriert. Die einfachste Verteidigung, die ich nutze: zähle die Exposition pro Währung, nicht pro Paar, und begrenze, wie viel Prozent Risiko auf einer Währung insgesamt hängen darf. Die strengere Variante: öffne keine zweite Position in dieselbe Richtung auf Paaren mit derselben Basis- oder Kurswährung, solange die erste nicht nach dem [Trailing](/de/blog/ea-trailing-krokowy/) auf Breakeven steht.

Die Korrelationen rechne auf deinen eigenen Daten, denn sie ändern sich mit der Zeit und hängen vom Stichprobenzeitraum ab, und Zahlen aus einem fremden Beitrag, meinen eingeschlossen, sind nur ein Hinweis, wo man hinschauen soll. Und wie immer: jeder Teil einzeln durch einen [Placebo-Test](/de/blog/test-placebo/) und den Tester auf Jahren von Daten deines Brokers, bevor diese Paare zusammen mit echtem Geld spielen.

Die Funktion für das Gesamtrisiko ist in [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), zusammen mit dem Rest der Werkstatt.
