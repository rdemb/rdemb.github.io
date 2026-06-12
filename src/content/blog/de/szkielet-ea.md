---
title: "Das EA-Skelett, mit dem ich jeden Bot anfange (MQL5)"
lang: "de"
kind: "trading"
date: "2026-06-12"
excerpt: "Bevor ein Bot irgendeine Idee zum Einstieg bekommt, muss er sechs langweilige Dinge können: eine neue Kerze, den Spread, die Uhrzeit, die Positionsgröße aus dem Risiko, einen Stop und ein Journal. Ein komplettes Skelett zum Kopieren."
key: "szkielet-ea"
slug: "szkielet-ea"
---

Die meisten EAs, die ich gesehen habe, fangen mit einem Signal an. Meiner fängt mit der Installation an. Bevor der Bot irgendeine Idee zum Einstieg bekommt, muss er sechs langweilige Dinge können: eine neue Kerze erkennen, das Spiel bei breitem Spread verweigern, die Uhrzeit kennen, die Positionsgröße aus dem Risiko berechnen, einen Stop setzen und alles ins Journal schreiben. Das Signal sind die letzten zehn Prozent. Die neunzig Prozent unten kannst du kopieren.

Der Code ist in MQL5 (die Färbung zeige ich als C++, denn die Syntax ist fast dieselbe). Füg ihn in den MetaEditor als neuen Expert Advisor ein, kompiliere ihn und teste ihn im Strategietester, bevor er auch nur ein Demokonto sieht.

```cpp
//+------------------------------------------------------------------+
//| EA-Skelett: Installation ohne Signal.                            |
//| Dein Signal kommt an genau eine Stelle: EinstiegsSignal().       |
//+------------------------------------------------------------------+
#include <Trade/Trade.mqh>
CTrade trade;

input long   InpMagic        = 26061201; // Magic Number dieses EA
input double InpRisikoProz   = 0.5;      // Risiko pro Trade, % des Kapitals
input double InpStopPkt      = 250;      // Stop Loss in Punkten
input double InpMaxSpreadPkt = 25;       // bei höherem Spread nicht spielen
input int    InpStundeVon    = 7;        // spiele ab dieser Stunde (Serverzeit)
input int    InpStundeBis    = 17;       // bis zu dieser Stunde
input bool   InpEine         = true;     // höchstens eine Position gleichzeitig

datetime letzteKerze = 0;

int OnInit()
{
   trade.SetExpertMagicNumber(InpMagic);
   if(InpRisikoProz <= 0 || InpRisikoProz > 2)
   {
      Print("Risiko außerhalb des gesunden Bereichs (0-2%).");
      return INIT_PARAMETERS_INCORRECT;
   }
   return INIT_SUCCEEDED;
}

//--- spiele nur einmal pro Kerze: der ganze Rest von OnTick sind Gates
void OnTick()
{
   if(!NeueKerze())        return;
   if(!DarfSpielen())      return;
   if(InpEine && MeinePositionDa()) return;

   int richtung = EinstiegsSignal();   // <- HIER kommt deine Idee
   if(richtung == 0)       return;

   double lot = LotAusRisiko(InpStopPkt);
   if(lot <= 0)            return;

   double preis = (richtung > 0) ? SymbolInfoDouble(_Symbol, SYMBOL_ASK)
                                 : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double sl    = (richtung > 0) ? preis - InpStopPkt * _Point
                                 : preis + InpStopPkt * _Point;
   bool ok = (richtung > 0) ? trade.Buy(lot, _Symbol, 0, sl)
                            : trade.Sell(lot, _Symbol, 0, sl);
   Journal(richtung, lot, preis, sl, ok);
}

//--- neue Kerze auf dem laufenden Chart
bool NeueKerze()
{
   datetime t = iTime(_Symbol, _Period, 0);
   if(t == letzteKerze) return false;
   letzteKerze = t;
   return true;
}

//--- Gates: Spread und Uhrzeit
bool DarfSpielen()
{
   long spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   if(spread > InpMaxSpreadPkt) return false;
   MqlDateTime dt; TimeToStruct(TimeCurrent(), dt);
   if(dt.hour < InpStundeVon || dt.hour >= InpStundeBis) return false;
   return true;
}

//--- hat dieser EA schon eine Position auf diesem Symbol
bool MeinePositionDa()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(PositionSelectByTicket(ticket)
         && PositionGetString(POSITION_SYMBOL) == _Symbol
         && PositionGetInteger(POSITION_MAGIC) == InpMagic)
         return true;
   }
   return false;
}

//--- Positionsgröße aus dem Risiko: % des Kapitals / Wert des Stops
double LotAusRisiko(double stopPkt)
{
   double kapital = AccountInfoDouble(ACCOUNT_EQUITY);
   double risiko  = kapital * InpRisikoProz / 100.0;
   double tickVal = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSz  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickVal <= 0 || tickSz <= 0) return 0;
   double verlustProLot = stopPkt * _Point / tickSz * tickVal;
   double lot = risiko / verlustProLot;
   double schritt = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   lot = MathFloor(lot / schritt) * schritt;
   double lotMin = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double lotMax = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   return MathMin(MathMax(lot, lotMin), lotMax);
}

//--- CSV-Journal: nach einem Monat ist es unbezahlbar
void Journal(int richt, double lot, double preis, double sl, bool ok)
{
   int h = FileOpen("skelett_journal.csv",
                    FILE_READ | FILE_WRITE | FILE_CSV | FILE_COMMON, ';');
   if(h == INVALID_HANDLE) return;
   FileSeek(h, 0, SEEK_END);
   FileWrite(h, TimeToString(TimeCurrent()), _Symbol,
             richt > 0 ? "BUY" : "SELL", DoubleToString(lot, 2),
             DoubleToString(preis, _Digits), DoubleToString(sl, _Digits),
             ok ? "OK" : IntegerToString(trade.ResultRetcode()));
   FileClose(h);
}

//--- DEINE IDEE: gib 1 (long), -1 (short) oder 0 (nichts) zurück
int EinstiegsSignal()
{
   return 0; // das Skelett spielt absichtlich nicht
}
```

## Warum genau diese Teile

Das Gate der neuen Kerze schützt dich vor dem häufigsten Fehler von Anfänger-Bots: Logik, die auf jedem Tick läuft und zehn Positionen pro Sekunde öffnet. Die Gates für Spread und Stunden folgen aus der [Volatilitätsuhr](/de/blog/zegar-zmiennosci/): es gibt Stunden, in denen die Kosten die typische Bewegung auffressen und kein Signal das wieder hereinholt. Die Positionsgröße, aus dem Risiko berechnet und nicht fest eingetragen, sorgt dafür, dass ein Trade immer denselben Anteil des Kapitals kostet, egal welcher Stop und welches Instrument. Und das CSV-Journal wirkt überflüssig bis zu dem Tag, an dem du dem eigenen Tester zum ersten Mal nicht zustimmst.

Achte darauf, was hier fehlt. Es gibt kein Signal. `EinstiegsSignal()` gibt null zurück, und das Skelett spielt absichtlich nicht. So ist bei mir die Reihenfolge der Dinge: bevor du anfängst, Einstiegsideen zu testen, muss der Bot langweilig, vorhersehbar und messbar sein. Meiner läuft genau auf diesem Aufbau, nur mit anderen Zahlen und mit einem Menschen über der Richtung, worüber ich in der [Arbeitsteilung](/de/blog/czlowiek-i-maszyna/) geschrieben habe.

Der Code ist Bildungsmaterial: kompiliere ihn, teste ihn im Tester auf Jahren von Daten deines Brokers, denn mit dessen Kerzen, Spread und Serverzeitzone wird der Bot leben. Mach ihn kaputt, repariere ihn. Lass ihn zuerst lange auf Demo laufen. Geld fass am Ende an, und klein.

Die Datei aus diesem Beitrag: [dlogic-szkielet-ea.mq5](/code/dlogic-szkielet-ea.mq5) (Kommentare auf Polnisch, der Code spricht für sich). Die Funktionen aus den weiteren Teilen der Werkstatt sammle ich in [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), und die Karte der ganzen Serie findest du in [Fang hier an](/de/blog/zacznij-tutaj/).
