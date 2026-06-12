---
title: "Szkielet EA, od którego zaczynam każdy automat (MQL5)"
lang: "pl"
kind: "trading"
date: "2026-06-12"
excerpt: "Zanim automat dostanie jakikolwiek pomysł na wejście, musi umieć sześć nudnych rzeczy: nową świecę, spread, porę dnia, wielkość pozycji z ryzyka, stopa i dziennik. Kompletny szkielet do skopiowania."
key: "szkielet-ea"
slug: "szkielet-ea"
---

Większość EA, które widziałem, zaczyna się od sygnału. Mój zaczyna się od hydrauliki. Zanim automat dostanie jakikolwiek pomysł na wejście, musi umieć sześć nudnych rzeczy: rozpoznać nową świecę, odmówić gry na szerokim spreadzie, znać porę dnia, policzyć wielkość pozycji z ryzyka, postawić stopa i zapisać wszystko do dziennika. Sygnał to ostatnie dziesięć procent. Te dziewięćdziesiąt poniżej możesz skopiować.

Kod jest w MQL5 (kolorowanie pokazuję jako C++, bo to niemal ta sama składnia). Wklej do MetaEditora jako nowy Expert Advisor, skompiluj i przetestuj w testerze strategii, zanim zobaczy choćby konto demo.

```cpp
//+------------------------------------------------------------------+
//| Szkielet EA: hydraulika bez sygnału.                             |
//| Sygnał wstawiasz w jedno miejsce: SygnalWejscia().               |
//+------------------------------------------------------------------+
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

//--- gra tylko raz na świecę: cała reszta OnTick to bramki
void OnTick()
{
   if(!NowaSwieca())       return;
   if(!WolnoGrac())        return;
   if(InpJedna && MojaPozycjaJest()) return;

   int kierunek = SygnalWejscia();   // <- TU wstawiasz swój pomysł
   if(kierunek == 0)       return;

   double lot = LotZRyzyka(InpStopPkt);
   if(lot <= 0)            return;

   double cena = (kierunek > 0) ? SymbolInfoDouble(_Symbol, SYMBOL_ASK)
                                : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double sl   = (kierunek > 0) ? cena - InpStopPkt * _Point
                                : cena + InpStopPkt * _Point;
   bool ok = (kierunek > 0) ? trade.Buy(lot, _Symbol, 0, sl)
                            : trade.Sell(lot, _Symbol, 0, sl);
   Dziennik(kierunek, lot, cena, sl, ok);
}

//--- nowa świeca na bieżącym wykresie
bool NowaSwieca()
{
   datetime t = iTime(_Symbol, _Period, 0);
   if(t == ostatniaSwieca) return false;
   ostatniaSwieca = t;
   return true;
}

//--- bramki: spread i pora dnia
bool WolnoGrac()
{
   long spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   if(spread > InpMaxSpreadPkt) return false;
   MqlDateTime dt; TimeToStruct(TimeCurrent(), dt);
   if(dt.hour < InpGodzOd || dt.hour >= InpGodzDo) return false;
   return true;
}

//--- czy ten EA ma już pozycję na tym symbolu
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

//--- wielkość pozycji z ryzyka: % kapitału / wartość stopa
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

//--- dziennik CSV: po miesiącu jest bezcenny
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

//--- TWÓJ POMYSŁ: zwróć 1 (long), -1 (short) albo 0 (nic)
int SygnalWejscia()
{
   return 0; // szkielet celowo nie gra
}
```

## Dlaczego akurat te elementy

Bramka nowej świecy chroni przed najczęstszym błędem początkujących automatów: logiką wykonywaną na każdym ticku, która otwiera dziesięć pozycji w sekundę. Bramka spreadu i godzin to wnioski z [zegara zmienności](/blog/zegar-zmiennosci/): są pory, w których koszt zjada typowy ruch i żaden sygnał tego nie odrobi. Wielkość pozycji liczona z ryzyka, a nie wpisana na sztywno, sprawia, że jedna transakcja kosztuje zawsze tyle samo kapitału, niezależnie od stopa i instrumentu. A dziennik CSV wydaje się zbędny do dnia, w którym pierwszy raz nie zgadzasz się z własnym testerem.

Zwróć uwagę, czego tu nie ma. Nie ma sygnału. `SygnalWejscia()` zwraca zero i szkielet celowo nie gra. Taka jest u mnie kolejność robienia rzeczy: zanim zaczniesz testować pomysły na wejście, automat musi być nudny, przewidywalny i mierzalny. Mój działa dokładnie na tym układzie, tylko z innymi liczbami i z człowiekiem nad kierunkiem, o czym pisałem w [podziale pracy](/blog/czlowiek-i-maszyna/).

Kod jest edukacyjny: skompiluj, przetestuj w testerze na latach danych od twojego brokera, bo to z jego świecami, spreadem i strefą czasu serwera automat będzie żył. Zepsuj, popraw. Niech najpierw długo działa na demo. Pieniądze dotykaj na końcu, małe.
