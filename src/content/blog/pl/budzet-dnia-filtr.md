---
title: "Budżet dnia jako filtr EA: nie goń ruchu, który już się wydarzył"
lang: "pl"
kind: "trading"
date: "2026-06-12"
excerpt: "Każda para ma typowy dzienny dystans. Kiedy dzień go wyrobi, statystyka przestaje wspierać pogoń. Kod MQL5: typowy zakres z mediany, procent zużycia budżetu i bramka do wpięcia w automat."
key: "budzet-dnia-filtr"
slug: "budzet-dnia-filtr"
---

W [briefach](/blog/fx-brief-2026-06-12/) powtarzam zasadę: zakres dnia to budżet. Każda para ma swój typowy dzienny dystans i kiedy dzień go wyrobi, statystyka przestaje wspierać pogoń za ruchem. Człowiek może to czuć. Automat musi to liczyć. Tu jest kod, którym to robi mój.

Idea mieści się w trzech krokach. Policz typowy zakres dnia jako medianę zakresów z ostatnich kilkudziesięciu dni. Sprawdź, ile dzisiejszy dzień już przeszedł od swojego minimum do maksimum. Podziel jedno przez drugie i masz procent zużycia budżetu, jedną liczbę, która mówi, czy dzień jest młody, dojrzały czy skończony.

```cpp
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

//--- bramka do EA: czy wolno jeszcze otwierać pozycje PRO-trendowe
input double InpMaxBudzet = 1.0;  // powyżej tego nie gonimy ruchu

bool BudzetPozwala()
{
   return ZuzycieBudzetu() < InpMaxBudzet;
}
```

W [szkielecie EA](/blog/szkielet-ea/) dokładasz jedną linię do bramek w `OnTick`: `if(!BudzetPozwala()) return;`. Tyle. Automat przestaje otwierać pozycje z trendem w dni, które swoje już przeszły, czyli dokładnie wtedy, gdy pogoń za świecą najczęściej kupuje szczyt.

## Trzy rzeczy, które wiem z własnych testów

Po pierwsze, mediana po raz drugi. Dni z decyzjami banków centralnych potrafią mieć zakres trzy razy większy niż zwykłe i średnia z nimi w środku zawyża budżet na tygodnie. Mediana ich nie widzi i o to chodzi: budżet ma opisywać zwykły dzień.

Po drugie, to jest filtr asymetryczny i warto to rozumieć. Zużyty budżet mówi „nie goń”, ale nie mówi „graj przeciwko”. Sprawdziłem na danych wariant ofensywny, czyli granie na powrót po wyrobieniu budżetu, z kosztami i z góry zapisanymi kryteriami, i po spreadzie zostało zero. Pisałem o tym przy [mapie dnia](/blog/mapa-dnia/): struktura w danych jest, darmowego obiadu nie ma. Dlatego u mnie budżet wyłącznie odbiera automatowi prawo do późnych pogoni, niczego nie nakazuje.

Po trzecie, próg 1.0 nie jest święty. Na EUR/USD działa sensownie, na parach z jenem bywa, że dzień trendowy ustawiony rano w Azji idzie do 1.5 budżetu i dalej. I jedno zastrzeżenie, które dotyczy wszystkich liczb na tym blogu: liczę je na danych historycznych mojego brokera. Inny broker to inna strefa czasu serwera, więc inna granica doby, inny spread i inaczej sklejone świece, a zatem inny budżet. Dlatego to parametr wejściowy, nie stała: policz i przetestuj na swojej parze, swoich danych i swoich kosztach, zanim uwierzysz. A jak nie wiesz, czy wynik testu to przewaga czy szczęście, to następny wpis jest dokładnie o tym, jak to odróżnić.
