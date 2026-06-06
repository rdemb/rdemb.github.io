---
title: "Ukryte modele Markowa: tryb rynku, którego nie widać"
lang: "pl"
kind: "trading"
date: "2026-06-06"
excerpt: "Rynek raz drzemie, raz wariuje, a przełącznika nie widać. HMM to uczciwa próba zgadnięcia, w jakim trybie jesteśmy. I opowieść o tym, czego ta metoda nie umie."
key: "hmm-tryb-rynku"
slug: "ukryte-modele-markowa"
---

Rynek nie zachowuje się tak samo przez cały czas. Bywają tygodnie, gdy cena ledwo drga. Bywają dni, gdy wszystko lata jak oszalałe. Przełącznika, który to zmienia, nie widać. Widać tylko skutek, czyli świece.

Ukryty model Markowa, w skrócie HMM, to próba zgadnięcia tego przełącznika. Założenie jest proste. Rynek jest w jednym z kilku ukrytych trybów, a to, co mamy na wykresie, to tylko ślad, jaki dany tryb zostawia na cenie. Cała sztuka polega na tym, żeby z samego śladu odgadnąć tryb.

## Co jest ukryte, a co widać

Nazwijmy te tryby po ludzku: Spokój, Trend, Panika. To są stany ukryte. Nie mają lampki, która się zapala. Rynek po prostu w którymś z nich siedzi i czasem przeskakuje do innego.

To, co widzisz, to obserwacje: zmiana ceny, wielkość świecy, zmienność. Każdy tryb zostawia inny ślad. W spokoju świece są małe. W panice ogromne. Kłopot w tym, że ten sam ruch potrafi pasować do dwóch trybów naraz i właśnie stąd bierze się cała trudność.

![Stany ukryte Spokój, Trend i Panika u góry oraz obserwowane świece u dołu, połączone strzałkami przejść i emisji](/blog/hmm/01-ukryte-obserwacje.svg)

U góry tryb, którego nie widać. U dołu to, co naprawdę masz na ekranie. HMM jest mostem między jednym a drugim.

## Dlaczego „Markowa"

Markow to założenie o pamięci, a właściwie o jej braku. Model przyjmuje, że żeby zgadnąć, co będzie za chwilę, wystarczy wiedzieć, gdzie jesteś teraz. Nie cała historia, tylko bieżący stan.

> Jutro zależy od dziś, a nie od całej drogi, którą tu doszliśmy.

Brzmi to jak uproszczenie i jest uproszczeniem. Rynek pamięta więcej, niż mówi ta zasada. Ale to uproszczenie, które daje się policzyć, a policzalny model bywa więcej wart niż model bliższy prawdzie, którego nikt nie umie policzyć.

## Skąd się to wzięło

Andriej Markow był rosyjskim matematykiem. Na początku XX wieku zajął się czymś z pozoru błahym: ciągami liter w „Eugeniuszu Onieginie" Puszkina. Liczył, jak często po samogłosce idzie spółgłoska, i wyszło mu, że następny znak zależy głównie od poprzedniego. Tak narodził się łańcuch Markowa, czyli świat, w którym przyszłość zależy od stanu teraz, a nie od całej historii.

Słowo „ukryty" dołożono dużo później. W latach sześćdziesiątych Leonard Baum z zespołem dodał warstwę, której nie widać wprost, i wymyślił sposób, żeby wyciągnąć ją z samych obserwacji. Stąd nazwa algorytmu uczącego: Bauma i Welcha. Pierwsze duże zastosowanie to nie była giełda, tylko rozpoznawanie mowy: komputer słyszy fale dźwięku, a zgaduje ukryty ciąg głosek. Potem te same równania trafiły do biologii, do czytania DNA, a na końcu do rynków. Pomysł jest wszędzie ten sam. Widzisz skutek, zgadujesz ukrytą przyczynę.

## Przejścia: jak rynek przeskakuje między trybami

Tryby się zmieniają, ale leniwie. Ze spokoju rzadko wpada się prosto w panikę. Zwykle najpierw jest trend, a dopiero potem się sypie. Te skłonności zapisuje macierz przejść: dla każdego trybu mówi, jak prawdopodobne jest, że rynek w nim zostanie, i jak prawdopodobne, że przeskoczy gdzie indziej.

![Trzy stany z pętlami i strzałkami przejść opisanymi prawdopodobieństwami zostania i przeskoku](/blog/hmm/02-graf-przejsc.svg)

Grube pętle to „zostań w tym samym trybie". Cienkie strzałki to przeskoki. Liczby są przykładowe, ale układ jest typowy: tryby są lepkie.

| z ↓ \ do → | Spokój | Trend | Panika |
|---|---|---|---|
| **Spokój** | 0.94 | 0.05 | 0.01 |
| **Trend** | 0.07 | 0.83 | 0.10 |
| **Panika** | 0.05 | 0.15 | 0.80 |

Każdy wiersz sumuje się do jedynki. To wszystko, co macierz przejść ma w środku: same skłonności do zostania albo zmiany.

## Emisje: jaki ślad zostawia każdy tryb

Drugi składnik to emisje. Dla każdego trybu opisują, jak wyglądają zmiany ceny, których się po nim spodziewamy. W spokoju rozkład jest wąski, skupiony wokół zera. W trendzie przesunięty w jedną stronę. W panice szeroki, z grubymi ogonami, bo zdarzają się duże ruchy w obie strony.

![Trzy rozkłady zmian ceny: Spokój wąski wokół zera, Trend przesunięty, Panika szeroki z grubymi ogonami](/blog/hmm/03-emisje.svg)

Tu siedzi haczyk. Jeden ruch, powiedzmy plus 0,75 procent w ciągu dnia, pasuje do wszystkich trzech trybów. Tylko z różnym prawdopodobieństwem. Dlatego z jednej świecy nigdy nie masz pewności. Namiastka pewności bierze się dopiero z całego ciągu obserwacji, nie z pojedynczego punktu.

## Trzy pytania, na które HMM odpowiada

Mając przejścia i emisje, model umie odpowiedzieć na trzy pytania.

Pierwsze: jak prawdopodobny jest ciąg świec, który widziałem? To pozwala porównywać warianty i mówić „ten lepiej tłumaczy dane niż tamten".

Drugie, najciekawsze w tradingu: w jakim trybie byłem w każdym momencie? To się nazywa dekodowanie. Z samych obserwacji odtwarzasz najbardziej prawdopodobną ścieżkę ukrytych stanów.

![Krata stanów w czasie z wyróżnioną złotą ścieżką, czyli najbardziej prawdopodobnym ciągiem trybów odtworzonym z obserwacji](/blog/hmm/04-krata-viterbi.svg)

W każdym kroku rynek mógł być w dowolnym trybie. Algorytm (nazywa się Viterbi) rozważa wszystkie możliwe ścieżki i wybiera tę, która najlepiej tłumaczy to, co widać. Złota linia to wynik.

Trzecie pytanie: skąd wziąć te wszystkie liczby, jeśli nikt mi ich nie podał? Z danych. Model sam dostraja przejścia i emisje tak, żeby jak najlepiej pasowały do historii (robi to algorytm Bauma i Welcha). I właśnie „jak najlepiej pasowały do historii" to ten moment, w którym najłatwiej oszukać samego siebie.

## Metoda macierzowa

Cały model sprowadza się do trzech tabel liczb. Wektor startowy, czyli od jakiego trybu zaczynamy. Macierz przejść A, którą widziałeś wyżej. I macierz emisji B, czyli jak prawdopodobny jest dany ruch w danym trybie. To wszystko, trzy tabele.

Najlepsze jest to, że liczenie też jest tylko mnożeniem tabel. Trzymasz „wektor wiary": trzy liczby mówiące, na ile wierzysz, że jesteś w Spokoju, w Trendzie i w Panice. Przychodzi nowa świeca i robisz dwa ruchy. Najpierw mnożysz wektor przez macierz przejść, bo rynek mógł przeskoczyć. Potem przez szansę, że dany tryb dałby właśnie taką świecę. Wynik to nowy wektor wiary.

![Jeden krok metody macierzowej: wektor wiary mnożony przez macierz przejść i przez prawdopodobieństwa emisji nowej świecy daje zaktualizowany wektor wiary](/blog/hmm/06-metoda-macierzowa.svg)

Jeden krok: stara wiara razy macierz przejść, razy szansa nowej świecy w każdym trybie, równa się nowa wiara. Potem to samo dla kolejnej świecy.

To się nazywa algorytm w przód. Dekodowanie, czyli ta złota ścieżka z kraty, to jego sprytniejszy kuzyn: zamiast sumować po wszystkich drogach, na każdym kroku zapamiętuje tylko najlepszą. Silnik jest jednak ten sam, mnożenie macierzy krok po kroku. Dlatego HMM liczy się szybko nawet na długiej historii, i dlatego całość da się zamknąć w trzech tabelach, a nie w stu regułach „jeśli, to".

## Co to daje na wykresie

Bierzesz historię, pozwalasz modelowi rozłożyć ją na tryby i kolorujesz wykres tym, co wyszło.

![Ten sam wykres ceny pokolorowany trybem, który model uznał za najbardziej prawdopodobny w danym fragmencie](/blog/hmm/05-wykres-rezimy.svg)

Ten sam wykres, tylko pomalowany trybem. I to jest naprawdę przyjemne dla oka. Od razu widać, gdzie rynek drzemał, a gdzie się palił. Tyle że „przyjemne dla oka" i „zarabia" to dwie zupełnie różne rzeczy, o czym za chwilę.

## Granice metody, i do czego nie służy

Najważniejsze, żeby nie pomylić, do czego ten model w ogóle jest. HMM nie wskazuje kierunku. Nie mówi „kupuj" ani „cena pójdzie w górę". Z samej budowy odpowiada na inne pytanie: jakiego typu jest teraz rynek.

Druga rzecz to opóźnienie, i to również nie usterka, tylko cecha. Żeby model uznał, że zaczął się trend, ten trend musi już chwilę potrwać, bo etykieta bierze się z ciągu obserwacji, a nie z jednej świecy. Kto obiecuje wykrycie zwrotu dokładnie w punkcie zwrotnym, sprzedaje złudzenie. HMM tak nie działa i lepiej tego od niego nie oczekiwać.

To składa się w spójną całość z twardą prawdą o rynku: łatwiej sensownie ocenić, jak duży będzie ruch, niż w którą stronę pójdzie. HMM gra dokładnie w tej pierwszej lidze. Mówi o charakterze i temperaturze rynku, nie o kierunku. I właśnie tam, jako miara charakteru, jest naprawdę użyteczny.

## Jak więc tego używać uczciwie

Skoro to nie wyrocznia, to do czego się nadaje? Jako kontekst, nigdy jako rozkaz. Kilka zastosowań, które naprawdę mają sens:

- **Filtr ryzyka.** W trybie „Panika" schodzisz z wielkości pozycji albo nie wchodzisz wcale. Nie dlatego, że wiesz, dokąd pójdzie cena, tylko dlatego, że wiesz, że będzie szarpać.
- **Dobór narzędzia do pogody.** Strategia, która zarabia w trendzie, w spokoju tylko płaci spread. Tryb podpowiada, kiedy ją włączyć, a kiedy odpuścić.
- **Uczciwy interfejs.** Jeden kolor na wykresie, który mówi „uważaj, dziś inny rynek". To bywa więcej warte niż dziesięć migających strzałek udających sygnał.

Do tego dwie pułapki, w które łatwo wpaść. Pierwsza to liczba trybów. Trzy to mój wybór, nie prawda objawiona. Dasz modelowi pięć, znajdzie pięć, też ładnie pokolorowanych. Druga to stabilność. Te same dane przy innym starcie potrafią dać inne tryby. Jeśli etykieta zmienia się przy każdym dotknięciu, to nie jest wiedza o rynku, tylko dopasowanie do szumu.

## Wniosek

Ukryty model Markowa to nie maszyna do przewidywania ceny. To sposób, żeby trzeźwo powiedzieć, w jakim jesteśmy teraz rynku, na podstawie samych śladów, które ten rynek zostawia. Użyty jako kontekst potrafi pomóc. Użyty jako wyrocznia kierunku kosztuje.

Jak zwykle kończy się tym samym. Zanim uwierzysz, że coś wie, sprawdź to na danych, których jeszcze nie widziało. Ładny kolor na wykresie to dopiero początek pytania, a nie odpowiedź.
