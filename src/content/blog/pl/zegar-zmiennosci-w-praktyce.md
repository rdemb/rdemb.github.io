---
title: "Zegar zmienności w praktyce: policz go sam (Python + MQL5)"
lang: "pl"
kind: "trading"
date: "2026-06-12"
excerpt: "Pisałem, że rynek chodzi według zegara. Tu jest kod, którym ten zegar zbudujesz z własnych danych: profil godzinowy zmienności, normalizacja ruchu i funkcja do wpięcia prosto w EA."
key: "zegar-zmiennosci-w-praktyce"
slug: "zegar-zmiennosci-w-praktyce"
---

Pisałem niedawno, że [rynek chodzi według zegara](/blog/zegar-zmiennosci/): profil zmienności godzina po godzinie powtarza się z uporem rozkładu jazdy, a świeca bez godziny na zegarze to informacja wybrakowana. Dziś druga połowa tamtego wpisu, czyli kod. Krótki, bez magii, do policzenia na własnych danych w pięć minut.

## Profil godzinowy w Pythonie

Wyeksportuj z MT5 dane H1 albo M5 (Widok, Symbole, Słupki, eksport do CSV) tak, żeby mieć kolumnę czasu i cenę zamknięcia. Potem:

```python
import pandas as pd

def profil_godzinowy(df, kol_close="close"):
    """Typowy |ruch| na godzinę doby (mediana), z ramki z kolumną czasu UTC."""
    df = df.copy()
    df["zwrot"] = df[kol_close].diff().abs()
    df["godzina"] = df["czas"].dt.hour
    return df.groupby("godzina")["zwrot"].median()

def ruch_znormalizowany(ruch, godzina, profil):
    """Ile typowych ruchów tej godziny wynosi bieżący ruch."""
    typowy = profil.get(godzina, profil.median())
    return ruch / typowy if typowy > 0 else 0.0

df = pd.read_csv("EURUSD_H1.csv", parse_dates=["czas"])
profil = profil_godzinowy(df)
print(profil)                       # 24 liczby: twój zegar
print(ruch_znormalizowany(0.0025, 3, profil))   # 25 pipsów o 3:00 w nocy
print(ruch_znormalizowany(0.0025, 14, profil))  # te same 25 pipsów o 14:00
```

Mediana zamiast średniej jest celowa: pojedynczy NFP albo decyzja banku potrafi zawyżyć średnią godziny na lata, a mediana mówi, jak ta godzina wygląda zwykle. Na moich danych EUR/USD różnica między najcichszą a najgłośniejszą godziną doby to mniej więcej rząd wielkości. Zastrzeżenie: te liczby pochodzą z danych historycznych mojego brokera. U innego brokera serwer tyka w innej strefie, spread jest inny i świece sklejają się inaczej, więc twój zegar wyjdzie podobny w kształcie, ale inny w liczbach. Dlatego policz go na danych, którymi naprawdę będziesz grał. Sprawdziłem ten kod na danych syntetycznych z wszczepioną strukturą dnia: odtwarza ją wiernie, a normalizacja pokazuje dokładnie to, o co chodzi, bo te same 25 pipsów wychodzi jako kilkadziesiąt typowych ruchów nocy i ledwie kilka popołudnia.

Dwie liczby z tego profilu od razu zmieniają praktykę. Po pierwsze, próg zaskoczenia: ruch powyżej 3 typowych dla tej godziny to zdarzenie, poniżej 1 to szum. Po drugie, koszt względny: jeśli spread to 0.8 pipsa, a typowy ruch nocnej godziny to 3 pipsy, to płacisz ponad jedną czwartą oczekiwanego ruchu na samym wejściu. Żaden sygnał tego nie dźwignie.

## Ta sama myśl w MQL5, prosto do EA

W automacie nie potrzebujesz pandas. Wystarczy raz na dobę policzyć profil z historii i trzymać go w tablicy:

```cpp
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

//--- ile typowych ruchów tej godziny wynosi bieżący ruch świecy
double RuchZnormalizowany()
{
   MqlDateTime dt; TimeToStruct(TimeCurrent(), dt);
   double typ = ProfilGodziny[dt.hour];
   if(typ <= 0) return 0;
   double ruch = MathAbs(iClose(_Symbol, PERIOD_H1, 0)
                       - iOpen(_Symbol, PERIOD_H1, 0));
   return ruch / typ;
}
```

`PoliczProfil()` wywołaj w `OnInit` i raz na dobę, `RuchZnormalizowany()` w miejscu, gdzie podejmujesz decyzje. W [szkielecie EA](/blog/szkielet-ea/) naturalnym miejscem jest bramka `WolnoGrac()`: zamiast sztywnych godzin od-do możesz odmawiać gry, gdy `ProfilGodziny[godzina]` nie pokrywa kilkukrotności spreadu. Wtedy automat sam przestaje grać nocą na parach europejskich i sam wraca do gry, gdy rynek się budzi, bez żadnej wiedzy o sesjach wpisanej na sztywno.

Uczciwe zastrzeżenie, to samo co w tamtym wpisie: zegar mówi, ile rynek zwykle daje, a nie dokąd pójdzie. To filtr i jednostka miary, nie sygnał. Ale jako filtr jest trudny do przecenienia, bo działa na najstabilniejszej regularności, jaką znalazłem w tych danych.

Pliki z tego wpisu: [zegar_zmiennosci.py](/code/zegar_zmiennosci.py), funkcje MQL5 w [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), a do ćwiczeń [syntetyczny CSV](/code/EURUSD_H1_syntetyk.csv) z wszczepioną strukturą dnia i ostrzeżeniem w nagłówku.
