---
title: "Czas w ryzyku, metryka, o której prawie nikt nie mówi"
lang: "pl"
kind: "trading"
date: "2026-06-12"
excerpt: "Dwa zyski po 20 pipsów nie są równe, jeśli jeden wisiał w rynku kwadrans, a drugi pięć godzin. O metryce, którą mierzy mój automat, a której nie ma w żadnym podsumowaniu rachunku."
key: "czas-w-ryzyku"
slug: "czas-w-ryzyku"
---

Wyobraź sobie dwie transakcje. Obie zarobiły po 20 pipsów na tej samej parze. W podsumowaniu rachunku wyglądają identycznie. Tylko że pierwsza weszła i wyszła w kwadrans, a druga wisiała w rynku pięć godzin, przeżyła dwa odczyty danych i konferencję prasową. Czy to naprawdę ten sam wynik?

Dla mnie nie. Każda minuta w pozycji to bilet na loterię zdarzeń, których nie kontroluję. Nagłówek z agencji, wypowiedź bankiera, poślizg na cienkim rynku, w skrajnym przypadku luka. Większość losów w tej loterii jest pusta i nic się nie dzieje. Ale losujesz tyle razy, ile minut trzymasz pozycję. Dwadzieścia pipsów zarobionych w kwadrans i te same dwadzieścia zarobionych w pięć godzin różnią się liczbą losów, które po drodze kupiłeś.

## Metryka, której nie ma w raportach

Broker policzy ci wynik, liczbę transakcji, procent trafień, obsunięcie. Nigdzie nie zobaczysz rubryki „ile czasu w tym tygodniu twoje pieniądze były wystawione na rynek”. A to jest jedna z najprostszych liczb, jakie można mierzyć: suma minut w pozycji, dzień po dniu, tydzień po tygodniu.

Kiedy zacząłem ją liczyć u siebie, zobaczyłem rzecz niewygodną. Spora część mojego czasu w ryzyku nie pracowała na wynik. To były godziny wiszenia w transakcjach, które dawno przestały mieć uzasadnienie i czekały już tylko na stop albo na cud. Wynik robiła mniejszość minut. Reszta była czystą ekspozycją bez treści: ryzyko szło, zegar szedł, przewagi nie było.

## Co z tym zrobił automat

Opisałem niedawno mapę dnia, czyli policzoną na latach danych szansę, że rynek jeszcze dołoży nowe ekstremum. Z tej mapy mój automat korzysta dokładnie tu. Gdy statystyka mówi, że dzień najpewniej zrobił już swoje, automat zaczyna skracać życie pozycji: dosuwa stopa szybciej, niż zrobiłby to klasyczny trailing liczony od samej ceny.

Zanim ta reguła weszła do użycia, przeszła test, którego warunki zapisałem z góry: na danych poza próbą (historia od mojego brokera) miała skrócić czas w ryzyku i nie pogorszyć wyniku. Skróciła go o około 12 procent przy wyniku bez zmian. Dwanaście procent mniej minut na loterii zdarzeń za darmo. Żadnego dodatkowego zysku, i o to chodziło. Nie każda poprawka w tradingu musi zarabiać więcej. Ta po prostu mniej ryzykuje przy tym samym.

## Skrajny przypadek: weekend

Najdroższe minuty w ryzyku to te, w których rynek jest zamknięty, a świat nie. Pozycja trzymana przez weekend to dwie doby zdarzeń bez możliwości reakcji i poniedziałkowa luka, która nie pyta o zdanie. Dlatego u mnie zasada jest tępa jak młotek: pozycje day-tradera nie nocują przez weekend. Żaden setup nie jest tak dobry, żeby opłacał czterdzieści osiem godzin ślepej ekspozycji.

Policz to u siebie. Nie wynik, ten znasz. Minuty. Ile czasu w zeszłym tygodniu twoje pieniądze stały na rynku i jaka część tych minut naprawdę na coś czekała. To jedna z tych liczb, które potrafią zmienić sposób grania bardziej niż kolejny wskaźnik.
