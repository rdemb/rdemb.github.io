---
title: "Anatomia EA: jeden automat, wiele par i ryzyko, które się sumuje (MQL5)"
lang: "pl"
kind: "trading"
date: "2026-06-12"
excerpt: "Drugi symbol w EA to nie druga linijka, tylko drugie ryzyko. Szkielet pętli po parach z osobnym magic i wspólnym limitem łącznego ryzyka, plus pułapka korelacji, przez którą trzy pozycje bywają jedną."
key: "ea-wiele-par"
slug: "ea-wiele-par"
---

Prędzej czy później każdy chce, żeby jego EA grał na kilku parach naraz. I prawie każdy robi to tak samo: wiesza tego samego EA na pięciu wykresach i uznaje temat za zamknięty. Działa, dopóki nie przyjdzie dzień, w którym wszystkie pięć pozycji okazuje się tym samym zakładem.

Najpierw mechanika, potem pułapka. Jeden EA może obsłużyć listę symboli z jednego wykresu: pętla, osobny stan na symbol, osobny magic, żeby pozycje dało się rozliczać per para.

```cpp
//--- wiele par z jednego EA: szkielet pętli
input string InpSymbole = "EURUSD;GBPUSD;USDJPY"; // lista po średniku
input double InpMaxRyzykoLaczneProc = 1.5;        // suma otwartego ryzyka, % kapitału

string symbole[];
datetime ostatniaSwiecaSym[];

int OnInit()
{
   int n = StringSplit(InpSymbole, ';', symbole);
   if(n <= 0) return INIT_PARAMETERS_INCORRECT;
   ArrayResize(ostatniaSwiecaSym, n);
   ArrayInitialize(ostatniaSwiecaSym, 0);
   for(int i = 0; i < n; i++)
      if(!SymbolSelect(symbole[i], true)) // dopisz do Obserwacji rynku
         PrintFormat("Brak symbolu %s u brokera", symbole[i]);
   return INIT_SUCCEEDED;
}

void OnTick()
{
   for(int i = 0; i < ArraySize(symbole); i++)
      ObsluzSymbol(i);
}

void ObsluzSymbol(int i)
{
   string sym = symbole[i];
   datetime t = iTime(sym, _Period, 0);
   if(t == 0 || t == ostatniaSwiecaSym[i]) return; // nowa świeca per symbol
   ostatniaSwiecaSym[i] = t;

   if(RyzykoLaczneProc() >= InpMaxRyzykoLaczneProc) return; // wspólny limit
   long magic = InpMagic + i;                               // magic per para

   // TODO: bramki (spread/godziny/budżet) i SygnalWejscia() dla sym,
   //       jak w /blog/szkielet-ea/, tylko z sym zamiast _Symbol
}

//--- suma ryzyka otwartych pozycji tego EA: ile % kapitału wisi na stopach
double RyzykoLaczneProc()
{
   double kapital = AccountInfoDouble(ACCOUNT_EQUITY);
   if(kapital <= 0) return 100;
   double suma = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket)) continue;
      long m = PositionGetInteger(POSITION_MAGIC);
      if(m < InpMagic || m >= InpMagic + ArraySize(symbole)) continue;
      string sym = PositionGetString(POSITION_SYMBOL);
      double sl  = PositionGetDouble(POSITION_SL);
      if(sl <= 0) { suma += 100; continue; }  // pozycja bez stopa = czerwona lampa
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
```

`RyzykoLaczneProc()` to serce tego wpisu. Zanim automat otworzy cokolwiek nowego, sumuje, ile procent kapitału wisi już na stopach wszystkich jego pozycji, i odmawia, gdy suma sięga limitu. Pozycja bez stopa liczy się jak nieskończone ryzyko i blokuje wszystko, celowo.

## Pułapka: trzy pozycje, jeden zakład

Teraz to, czego kod sam nie załatwi. EUR/USD, GBP/USD i USD/CHF to na papierze trzy rynki, a w praktyce często jeden zakład: przeciwko dolarowi. Gdy dolar rusza, wszystkie trzy pozycje idą razem, w zysk albo w stratę, i limit łącznego ryzyka liczony per pozycja kłamie, bo prawdziwe ryzyko jest skoncentrowane w jednej walucie. Najprostsza obrona, którą stosuję: licz ekspozycję per waluta, nie per para, i ogranicz, ile procent ryzyka może wisieć na jednej walucie łącznie. Surowsza wersja: nie otwieraj drugiej pozycji w tę samą stronę na parach z tą samą walutą bazową albo kwotowaną, dopóki pierwsza nie stoi na breakevenie po [trailingu](/blog/ea-trailing-krokowy/).

Korelacje policz na swoich danych, bo zmieniają się w czasie i zależą od okresu próbkowania, a liczby z cudzego wpisu, łącznie z moim, to tylko wskazówka, gdzie patrzeć. I jak zawsze: każdy element osobno przez [test placebo](/blog/test-placebo/) i tester na latach danych twojego brokera, zanim te pary zagrają wspólnie prawdziwymi pieniędzmi.

Funkcja ryzyka łącznego jest w [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), razem z resztą warsztatu.
