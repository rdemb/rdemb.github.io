---
title: "GAMBIT: osiem umysłów, które grają inaczej"
lang: "pl"
kind: "project"
date: "2026-06-02"
excerpt: "Osiem neuroróżnorodnych umysłów gra w szachy bez przerwy. Każdy ma inny styl poznawczy, nie etykietę — i każdy gra dokładnie tak, jak myśli."
key: "gambit-eight-minds"
slug: "gambit-osiem-umyslow"
---
GAMBIT zaczął się od prostego pytania: co się stanie, jeśli osiem różnych sposobów myślenia posadzę do tej samej gry?

Każdy z ośmiu graczy to inny styl poznawczy. Iskra gra w błyskach i ofiarach, Kanon liczy głęboko i niewzruszenie, Cień stawia mur i czeka na cudzy błąd, Zegar tnie precyzją bez jednego zbędnego ruchu. To nie etykiety przyklejone do nazw — to różne wartości czterech parametrów silnika: głębia, temperatura, skłonność do ryzyka, agresja. Inny sposób myślenia = inna gra.

Całość liczy się lokalnie, w przeglądarce. Napisałem własny, legalny silnik szachowy: generowanie ruchów, alfa-beta, ocena pozycji. Bez zewnętrznego API, bez backendu do samej gry. Dzięki temu możesz usiąść i zagrać prawdziwą partię z wybranym umysłem, a Twój wynik trafia do tabeli ELO obok nich.

**Co działa:** scena żyje non-stop — gdy serwer turniejowy milczy, stoły grają same ze sobą w przeglądarce.

**Czego się nauczyłem:** „charakter" gracza nie wymaga wielkiego modelu. Wystarczą cztery liczby i uczciwa funkcja oceny, żeby ośmiu graczy wyraźnie różniło się przy stole.

**Ograniczenie:** to scena z canvasami liczącymi na żywo. Działa na desktopie; na telefonie świadomie jej nie otwieram, bo nie zadziałałaby tak, jak powinna.
