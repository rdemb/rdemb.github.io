//+------------------------------------------------------------------+
//|                                            dlogic-warsztat.mqh   |
//|   Funkcje warsztatowe z bloga rdemb.github.io/blog/ (MQL5)       |
//|                                                                  |
//|   SZKIELETY EDUKACYJNE, nie gotowiec:                            |
//|    - to są filtry i hydraulika, nie sygnał ani przewaga,         |
//|    - progi i parametry dobierz w testerze na latach danych       |
//|      TWOJEGO brokera (inna strefa serwera = inne liczby),        |
//|    - każdy element z osobna przepuść przez test placebo:         |
//|      /blog/test-placebo/                                         |
//|                                                                  |
//|   Użycie: #include "dlogic-warsztat.mqh" w EA ze szkieletu       |
//|   /blog/szkielet-ea/ (wymaga zmiennych InpMagic, trade).         |
//+------------------------------------------------------------------+
#property copyright "D-LOGIC studio · materiał edukacyjny"
#property link      "https://rdemb.github.io/blog/"

//=== ZEGAR ZMIENNOŚCI ===  /blog/zegar-zmiennosci-w-praktyce/
//--- typowy |ruch| H1 dla każdej godziny doby, mediana z N dni
double ProfilGodziny[24];

void PoliczProfil(int dniHistorii = 60)
{
   double probki[];
   for(int g = 0; g < 24; g++)
   {
      ArrayResize(probki, 0);
      for(int d = 0; d < dniHistorii * 24; d++)
      {
         datetime t = iTime(_Symbol, PERIOD_H1, d);
         MqlDateTime dt; TimeToStruct(t, dt);
         if(dt.hour != g) continue;
         double ruch = MathAbs(iClose(_Symbol, PERIOD_H1, d)
                             - iOpen(_Symbol, PERIOD_H1, d));
         int n = ArraySize(probki);
         ArrayResize(probki, n + 1);
         probki[n] = ruch;
      }
      ArraySort(probki);
      int n = ArraySize(probki);
      ProfilGodziny[g] = (n > 0) ? probki[n / 2] : 0; // mediana
   }
}

//--- ile typowych ruchów tej godziny wynosi bieżący ruch świecy H1
double RuchZnormalizowany()
{
   MqlDateTime dt; TimeToStruct(TimeCurrent(), dt);
   double typ = ProfilGodziny[dt.hour];
   if(typ <= 0) return 0;
   double ruch = MathAbs(iClose(_Symbol, PERIOD_H1, 0)
                       - iOpen(_Symbol, PERIOD_H1, 0));
   return ruch / typ;
}

//=== BUDŻET DNIA ===  /blog/budzet-dnia-filtr/
//--- typowy zakres dnia: mediana (high-low) z ostatnich N dni D1
double TypowyZakresDnia(int dni = 40)
{
   double zakresy[];
   ArrayResize(zakresy, dni);
   for(int i = 1; i <= dni; i++)   // od 1: bez dzisiejszej, niedokończonej świecy
      zakresy[i - 1] = iHigh(_Symbol, PERIOD_D1, i)
                     - iLow(_Symbol, PERIOD_D1, i);
   ArraySort(zakresy);
   return zakresy[dni / 2];
}

//--- ile budżetu dzień już zużył: 0.0 rano, ~1.0 przy typowym pełnym dniu
double ZuzycieBudzetu()
{
   double typowy = TypowyZakresDnia();
   if(typowy <= 0) return 0;
   double dzis = iHigh(_Symbol, PERIOD_D1, 0) - iLow(_Symbol, PERIOD_D1, 0);
   return dzis / typowy;
}

//=== BLACKOUT NEWSÓW ===  /blog/ea-blackout-newsow/
//--- UWAGA: tester strategii NIE MA kalendarza — patrz wpis, sekcja o pułapce
input int InpCiszaPrzedMin = 30;  // minut ciszy przed publikacją
input int InpCiszaPoMin    = 15;  // minut ciszy po publikacji

bool BlackoutAktywny()
{
   string waluty[2];
   waluty[0] = SymbolInfoString(_Symbol, SYMBOL_CURRENCY_BASE);
   waluty[1] = SymbolInfoString(_Symbol, SYMBOL_CURRENCY_PROFIT);

   datetime od = TimeCurrent() - InpCiszaPoMin * 60;
   datetime do_ = TimeCurrent() + InpCiszaPrzedMin * 60;

   MqlCalendarValue zdarzenia[];
   if(CalendarValueHistory(zdarzenia, od, do_) <= 0) return false;

   for(int i = 0; i < ArraySize(zdarzenia); i++)
   {
      MqlCalendarEvent ev;
      if(!CalendarEventById(zdarzenia[i].event_id, ev)) continue;
      if(ev.importance < CALENDAR_IMPORTANCE_HIGH) continue; // TODO: próg pod siebie
      MqlCalendarCountry kraj;
      if(!CalendarCountryById(ev.country_id, kraj)) continue;
      for(int w = 0; w < 2; w++)
         if(kraj.currency == waluty[w]) return true;
   }
   return false;
}

//=== TRAILING KROKOWY ===  /blog/ea-trailing-krokowy/
input double InpBreakevenPkt = 150;  // po tylu punktach zysku: stop na wejście
input double InpKrokPkt      = 100;  // potem przesuwaj stopa co tyle punktów

void TrailingKrokowy()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket))                          continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol)            continue;
      if(PositionGetInteger(POSITION_MAGIC)  != InpMagic)          continue;

      long   typ     = PositionGetInteger(POSITION_TYPE);
      double otwarte = PositionGetDouble(POSITION_PRICE_OPEN);
      double sl      = PositionGetDouble(POSITION_SL);
      double cena    = (typ == POSITION_TYPE_BUY)
                       ? SymbolInfoDouble(_Symbol, SYMBOL_BID)
                       : SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      double zysk    = (typ == POSITION_TYPE_BUY) ? cena - otwarte
                                                  : otwarte - cena;
      if(zysk < InpBreakevenPkt * _Point) continue;

      double kroki = MathFloor((zysk - InpBreakevenPkt * _Point)
                               / (InpKrokPkt * _Point));
      double nowySL = (typ == POSITION_TYPE_BUY)
                      ? otwarte + kroki * InpKrokPkt * _Point
                      : otwarte - kroki * InpKrokPkt * _Point;

      bool lepszy = (typ == POSITION_TYPE_BUY) ? (nowySL > sl + _Point)
                                               : (sl == 0 || nowySL < sl - _Point);
      if(lepszy)
         trade.PositionModify(ticket, nowySL,
                              PositionGetDouble(POSITION_TP));
   }
}

//=== RYZYKO ŁĄCZNE (wiele par) ===  /blog/ea-wiele-par/
//--- suma otwartego ryzyka pozycji tego EA w % kapitału;
//--- pozycja bez stopa liczy się jak 100% (czerwona lampa, celowo)
double RyzykoLaczneProc(long magicOd, long magicDo)
{
   double kapital = AccountInfoDouble(ACCOUNT_EQUITY);
   if(kapital <= 0) return 100;
   double suma = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket)) continue;
      long m = PositionGetInteger(POSITION_MAGIC);
      if(m < magicOd || m > magicDo) continue;
      string sym = PositionGetString(POSITION_SYMBOL);
      double sl  = PositionGetDouble(POSITION_SL);
      if(sl <= 0) { suma += 100; continue; }
      double cena   = PositionGetDouble(POSITION_PRICE_OPEN);
      double wolumen= PositionGetDouble(POSITION_VOLUME);
      double tickVal= SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_VALUE);
      double tickSz = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_SIZE);
      if(tickVal <= 0 || tickSz <= 0) continue;
      double strata = MathAbs(cena - sl) / tickSz * tickVal * wolumen;
      suma += strata / kapital * 100.0;
   }
   return suma;
}
// TODO (świadomie zostawione tobie): ekspozycja per WALUTA zamiast per para —
// EUR/USD + GBP/USD + USD/CHF to często jeden zakład przeciw dolarowi.
