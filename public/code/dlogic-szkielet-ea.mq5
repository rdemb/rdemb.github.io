//+------------------------------------------------------------------+
//|                                          dlogic-szkielet-ea.mq5  |
//|        SZKIELET EDUKACYJNY z bloga rdemb.github.io/blog/         |
//|                                                                  |
//|  To NIE jest gotowy system i celowo NIM NIE BĘDZIE:              |
//|   - SygnalWejscia() zwraca 0, więc EA nie otwiera pozycji,       |
//|   - nie ma tu żadnej przewagi, tylko hydraulika wokół niej,      |
//|   - zanim cokolwiek dotknie pieniędzy: tester (lata danych       |
//|     TWOJEGO brokera), potem długo demo, potem małe stawki.       |
//|                                                                  |
//|  Opis każdego elementu: /blog/szkielet-ea/                       |
//+------------------------------------------------------------------+
#property copyright "D-LOGIC studio · materiał edukacyjny"
#property link      "https://rdemb.github.io/blog/szkielet-ea/"
#property version   "1.00"
#property strict

#include <Trade/Trade.mqh>
CTrade trade;

input long   InpMagic        = 26061201; // magic number tego EA
input double InpRyzykoProc   = 0.5;      // ryzyko na transakcję, % kapitału
input double InpStopPkt      = 250;      // stop loss w punktach
input double InpMaxSpreadPkt = 25;       // nie graj powyżej tego spreadu
input int    InpGodzOd       = 7;        // gram od tej godziny (czas serwera)
input int    InpGodzDo       = 17;       // do tej godziny
input bool   InpJedna        = true;     // najwyżej jedna pozycja naraz

datetime ostatniaSwieca = 0;

int OnInit()
{
   trade.SetExpertMagicNumber(InpMagic);
   if(InpRyzykoProc <= 0 || InpRyzykoProc > 2)
   {
      Print("Ryzyko poza zdrowym zakresem (0-2%).");
      return INIT_PARAMETERS_INCORRECT;
   }
   return INIT_SUCCEEDED;
}

void OnTick()
{
   if(!NowaSwieca())                 return;
   if(!WolnoGrac())                  return;
   if(InpJedna && MojaPozycjaJest()) return;

   int kierunek = SygnalWejscia();   // <- TU wstawiasz SWÓJ pomysł
   if(kierunek == 0)                 return;

   double lot = LotZRyzyka(InpStopPkt);
   if(lot <= 0)                      return;

   double cena = (kierunek > 0) ? SymbolInfoDouble(_Symbol, SYMBOL_ASK)
                                : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double sl   = (kierunek > 0) ? cena - InpStopPkt * _Point
                                : cena + InpStopPkt * _Point;
   bool ok = (kierunek > 0) ? trade.Buy(lot, _Symbol, 0, sl)
                            : trade.Sell(lot, _Symbol, 0, sl);
   Dziennik(kierunek, lot, cena, sl, ok);
}

bool NowaSwieca()
{
   datetime t = iTime(_Symbol, _Period, 0);
   if(t == ostatniaSwieca) return false;
   ostatniaSwieca = t;
   return true;
}

bool WolnoGrac()
{
   long spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   if(spread > InpMaxSpreadPkt) return false;
   MqlDateTime dt; TimeToStruct(TimeCurrent(), dt);
   if(dt.hour < InpGodzOd || dt.hour >= InpGodzDo) return false;
   // TODO: dołóż własne bramki, np. budżet dnia (/blog/budzet-dnia-filtr/)
   // i zegar zmienności (/blog/zegar-zmiennosci-w-praktyce/).
   return true;
}

bool MojaPozycjaJest()
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

double LotZRyzyka(double stopPkt)
{
   double kapital = AccountInfoDouble(ACCOUNT_EQUITY);
   double ryzyko  = kapital * InpRyzykoProc / 100.0;
   double tickVal = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSz  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickVal <= 0 || tickSz <= 0) return 0;
   double strataNaLot = stopPkt * _Point / tickSz * tickVal;
   double lot = ryzyko / strataNaLot;
   double krok = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   lot = MathFloor(lot / krok) * krok;
   double lotMin = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double lotMax = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   return MathMin(MathMax(lot, lotMin), lotMax);
}

void Dziennik(int kier, double lot, double cena, double sl, bool ok)
{
   int h = FileOpen("szkielet_dziennik.csv",
                    FILE_READ | FILE_WRITE | FILE_CSV | FILE_COMMON, ';');
   if(h == INVALID_HANDLE) return;
   FileSeek(h, 0, SEEK_END);
   FileWrite(h, TimeToString(TimeCurrent()), _Symbol,
             kier > 0 ? "BUY" : "SELL", DoubleToString(lot, 2),
             DoubleToString(cena, _Digits), DoubleToString(sl, _Digits),
             ok ? "OK" : IntegerToString(trade.ResultRetcode()));
   FileClose(h);
}

//--- TWÓJ POMYSŁ: zwróć 1 (long), -1 (short) albo 0 (nic).
//--- Szkielet celowo nie gra. Pomysł przetestuj NAJPIERW testem placebo:
//--- /blog/test-placebo/
int SygnalWejscia()
{
   // TODO: tu wstaw swoją regułę. Przykład struktury (NIE rekomendacja):
   // if(WarunekTrendu() && RuchZnormalizowany() < 1.0) return 1;
   return 0;
}
