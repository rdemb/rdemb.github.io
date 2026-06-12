---
title: "Anatomia EA: cisza przed danymi, czyli blackout newsów (MQL5)"
lang: "pl"
kind: "trading"
date: "2026-06-12"
excerpt: "Automat nie czyta nagłówków, więc musi znać kalendarz. Szkielet bramki, która zamyka automatowi usta wokół ważnych publikacji, i pułapka, przez którą ta bramka kłamie w testerze."
key: "ea-blackout-newsow"
slug: "ea-blackout-newsow"
---

Najgorsze transakcje mojego automatu z czasów, zanim zmądrzałem, miały wspólny mianownik: otwierały się trzy minuty przed danymi z USA. Sygnał był poprawny, hydraulika działała, a rynek i tak robił co chciał, bo o 14:30 nie gra statystyka, tylko nagłówek. Automat nagłówka nie przeczyta. Musi za to znać kalendarz.

W MQL5 kalendarz ekonomiczny jest wbudowany i bramka ciszy mieści się w jednej funkcji. To szkielet: listę walut i próg ważności dobierasz sam, do swojej pary i swojego stylu.

```cpp
//--- cisza wokół ważnych publikacji: true = nie wolno grać
input int InpCiszaPrzedMin = 30;  // minut ciszy przed publikacją
input int InpCiszaPoMin    = 15;  // minut ciszy po publikacji

bool BlackoutAktywny()
{
   // waluty, których publikacje nas obchodzą: bazowa i kwotowana symbolu
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
```

W [szkielecie EA](/blog/szkielet-ea/) dokładasz do bramek jedną linię: `if(BlackoutAktywny()) return;`. Od tej chwili automat milknie na pół godziny przed każdą ważną publikacją dotyczącą jego pary i odzywa się kwadrans po niej.

## Pułapka, która kosztuje ludzi miesiące

Tester strategii MetaTradera nie ma kalendarza. `CalendarValueHistory` w testerze zwraca pustkę, więc bramka przepuszcza wszystko i backtest gra przez NFP, FOMC i CPI, jakby to były zwykłe godziny. Wynik: test wygląda inaczej niż życie i nie wiesz dlaczego.

Wyjścia są dwa i oba uczciwe. Pierwsze: do testów eksportujesz kalendarz do pliku CSV (daty ważnych publikacji da się pobrać raz na zawsze dla lat historycznych) i w testerze czytasz plik zamiast funkcji kalendarza. Drugie: akceptujesz, że backtest gra przez newsy, i traktujesz wynik jako pesymistyczny dolny próg, bo na żywo bramka odetnie najgorsze wpadki. Ja używam pierwszego, bo lubię, kiedy tester i życie widzą ten sam świat. O tym, dlaczego rozjazd testera z życiem to mój ulubiony wróg, jeszcze tu napiszę.

Zastrzeżenie jak zawsze: godziny publikacji w kalendarzu są w czasie serwera twojego brokera i u różnych brokerów ta sama publikacja ma inną godzinę na zegarze. Sprawdź na jednej publikacji, zanim zaufasz. A czy sama cisza polepsza wynik netto, sprawdź [testem placebo](/blog/test-placebo/) na swoich danych, nie na moim słowie.

Funkcja z tego wpisu jest w [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), razem z resztą warsztatu.
