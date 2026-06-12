---
title: "Ile naprawdę kosztuje transakcja i jak zmierzyć własny poślizg"
lang: "pl"
kind: "trading"
date: "2026-06-12"
excerpt: "Spread widzisz, poślizg czujesz, swap płacisz we śnie. Rachunek pełnego kosztu obrotu, rozszerzenie dziennika EA o cenę żądaną kontra wykonaną i kod, który z tego dziennika liczy twój prywatny cennik."
key: "ile-kosztuje-transakcja"
slug: "ile-kosztuje-transakcja"
---

W [briefach](/blog/fx-brief-2026-06-12/) powtarzam, że nocą koszt zjada typowy ruch. Dziś rozbierzmy ten koszt na części, bo składa się z trzech warstw i tylko jedną z nich widać na pierwszy rzut oka.

Spread widzisz w terminalu i on jest najuczciwszy: płacisz go zawsze, na wejściu w rynek. Przy spreadzie 0.8 pipsa i strategii celującej w 10 pipsów oddajesz 8% celu, zanim cokolwiek się wydarzy; przy celu 100 pipsów ten sam spread to mniej niż procent. Dlatego koszt zawsze liczy się względem skali strategii, nie w pipsach absolutnych. Poślizg jest podstępniejszy: to różnica między ceną, której zażądałeś, a ceną, którą dostałeś. Bywa zerowy tygodniami i brutalny dokładnie wtedy, gdy rynek się rusza, czyli wtedy, gdy najbardziej chcesz być w grze. Swap płaci się za przetrzymanie pozycji przez noc i day-tradera dotyczy rzadko, ale wystarczy jedna „wyjątkowo obiecująca” pozycja zostawiona na noc ze środy na czwartek, kiedy nalicza się potrójny, żeby zapamiętać, że istnieje.

Spread i swap znajdziesz w specyfikacji instrumentu. Poślizgu nie znajdziesz nigdzie, bo on jest twój: zależy od brokera, pory dnia, wielkości zlecenia i tego, czy wchodzisz w ciszę czy w huk. Jedyny uczciwy sposób, żeby go poznać, to mierzyć go u siebie.

## Dziennik, który mierzy sam siebie

W [szkielecie EA](/blog/szkielet-ea/) dziennik zapisuje cenę żądaną. Wystarczy dopisać do niego cenę wykonania, którą zwraca broker, i różnica stanie się twoją prywatną statystyką poślizgu. Zmiana jest mała:

```cpp
//--- w Dziennik(): dopisz cenę wykonaną i poślizg w punktach
double wykonana = trade.ResultPrice();          // cena, którą dał broker
double poslizg  = (wykonana > 0)
                  ? (wykonana - cena) / _Point * (kier > 0 ? 1 : -1)
                  : 0;                          // dodatni = wykonanie gorsze
FileWrite(h, TimeToString(TimeCurrent()), _Symbol,
          kier > 0 ? "BUY" : "SELL", DoubleToString(lot, 2),
          DoubleToString(cena, _Digits),        // żądana
          DoubleToString(wykonana, _Digits),    // wykonana
          DoubleToString(poslizg, 1),           // poślizg w punktach
          DoubleToString(sl, _Digits),
          ok ? "OK" : IntegerToString(trade.ResultRetcode()));
```

Po miesiącu na demo, a docelowo na małym koncie realnym, masz plik, z którego można policzyć rzeczy, o których większość ludzi tylko spekuluje:

```python
import pandas as pd

dz = pd.read_csv("szkielet_dziennik.csv", sep=";", header=None,
                 names=["czas","symbol","strona","lot","zadana",
                        "wykonana","poslizg_pkt","sl","status"])
dz["czas"] = pd.to_datetime(dz["czas"])
dz = dz[dz["status"] == "OK"]

print("mediana poślizgu [pkt]:", dz["poslizg_pkt"].median())
print("p90 poślizgu [pkt]:    ", dz["poslizg_pkt"].quantile(0.9))
print("\npoślizg wg godziny (mediana):")
print(dz.groupby(dz["czas"].dt.hour)["poslizg_pkt"].median())
```

Mediana mówi, ile płacisz zwykle. Dziewięćdziesiąty percentyl mówi, ile płacisz wtedy, kiedy boli, i to on powinien trafić do [testu placebo](/blog/test-placebo/) jako koszt wejścia, jeśli strategia gra w ruchliwych porach. Rozbicie po godzinach zwykle pokazuje to samo, co [zegar zmienności](/blog/zegar-zmiennosci/) z drugiej strony lustra: tam, gdzie rynek przyspiesza, poślizg rośnie razem z nim.

Na koniec arytmetyka, którą warto zrobić raz a porządnie dla własnej strategii. Pełny koszt rundy to spread plus dwa poślizgi, wejściowy i wyjściowy. Jeśli strategia robi dwa wejścia dziennie po koszcie rundy 1.2 pipsa, to oddaje rynkowi około 600 pipsów rocznie samych opłat, niezależnie od tego, czy ma rację. Przewaga, która tego nie zarabia z zapasem, nie jest przewagą, jest darowizną na rzecz infrastruktury. Liczby oczywiście podstawisz swoje, z własnego dziennika i cennika własnego brokera, bo mój poślizg i twój poślizg to dwa różne zwierzęta, nawet na tej samej parze.
