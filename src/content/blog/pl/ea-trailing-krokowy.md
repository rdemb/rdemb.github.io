---
title: "Anatomia EA: trailing krokowy, który nie panikuje (MQL5)"
lang: "pl"
kind: "trading"
date: "2026-06-12"
excerpt: "Stop przesuwany na każdym ticku to stop, który zbiera szum. Schodki: breakeven po pierwszym progu, potem przesunięcie co pełny krok zysku. Cała funkcja do wpięcia w szkielet EA."
key: "ea-trailing-krokowy"
slug: "ea-trailing-krokowy"
---

Pierwszy trailing, jaki napisałem, przesuwał stopa na każdym ticku, zawsze o spread za bieżącą ceną. Wyglądał opiekuńczo. W praktyce zbierał szum: pozycja, która miała dojechać do celu, wypadała na pierwszym drgnięciu, a dziennik pełen był wyjść o trzy pipsy od wejścia. Od tamtej pory moje stopy chodzą schodkami.

Idea jest prosta. Najpierw nic nie rób, niech pozycja oddycha. Po pierwszym progu zysku przenieś stopa na wejście, od tej chwili transakcja nie może już stracić. Potem przesuwaj stopa o pełny krok za każdym razem, gdy zysk urośnie o pełny krok. Między progami stop stoi nieruchomo i szum go nie obchodzi.

```cpp
//--- trailing krokowy: breakeven po progu, potem schodki co krok
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
      if(zysk < InpBreakevenPkt * _Point) continue;   // jeszcze oddycha

      // ile pełnych kroków zysku ponad breakeven już jest
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
```

Wywołanie wpinasz w `OnTick` [szkieletu](/blog/szkielet-ea/), przed bramkami, bo zarządzanie otwartą pozycją ma działać zawsze, także wtedy, gdy nowych wejść nie wolno otwierać: `TrailingKrokowy();` jako pierwsza linia.

Dwie rzeczy z testów, obie na danych historycznych mojego brokera, więc u siebie zweryfikuj. Po pierwsze, progi to kompromis, którego nie da się uniknąć: ciasny breakeven częściej kończy na zero transakcje, które dojechałyby do celu, szeroki oddaje więcej w stratnych. Ja stroję je w testerze na latach, osobno dla każdej pary, i nieufnie patrzę na wartości, które wygrywają tylko w jednym roku. Po drugie, schodki to fundament, nie sufit. Stopem można sterować mądrzej, na przykład statystyką pory dnia, bo wieczorem rynek dokłada nowe ekstrema rzadziej niż rano, pisałem o tym przy [mapie dnia](/blog/mapa-dnia/). Ale zanim zaczniesz kombinować, niech najpierw działa nudna wersja, a [test placebo](/blog/test-placebo/) niech rozsądzi, czy mądrzejsza naprawdę jest mądrzejsza.

Funkcja z tego wpisu jest w [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), razem z resztą warsztatu.
