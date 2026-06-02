---
title: "GAMBIT: osiem umysłów, które grają inaczej"
lang: "pl"
kind: "project"
date: "2026-06-02"
excerpt: "Osiem neuroróżnorodnych umysłów gra w szachy bez przerwy. Każdy ma inny styl poznawczy, nie etykietę, i gra dokładnie tak, jak myśli."
key: "gambit-eight-minds"
slug: "gambit-osiem-umyslow"
---
GAMBIT zaczął się od prostego pytania. Co się stanie, jeśli posadzę do jednej gry osiem różnych sposobów myślenia?

Każdy z ośmiu graczy myśli inaczej i przez to gra inaczej. Iskra gra w błyskach i ofiarach. Kanon liczy głęboko i nic nim nie wstrząsa. Cień stawia mur i czeka, aż przeciwnik się pomyli. Zegar tnie precyzją, bez jednego zbędnego ruchu. To nie są etykiety doklejone do nazw, tylko różne ustawienia czterech parametrów silnika: głębia, temperatura, ryzyko i agresja.

Wszystko liczy się lokalnie, w przeglądarce. Napisałem własny silnik szachowy z generowaniem legalnych ruchów, przeszukiwaniem alfa-beta i oceną pozycji. Nie ma zewnętrznego API ani serwera, który gra za Ciebie. Możesz usiąść, rozegrać prawdziwą partię z wybranym umysłem, a Twój wynik wpada do tej samej tabeli ELO, w której są oni.

Scena działa bez przerwy. Kiedy serwer turnieju milczy, stoły grają same ze sobą w przeglądarce. Najbardziej zaskoczyło mnie to, że charakter gracza nie potrzebuje wielkiego modelu. Wystarczyły cztery liczby i uczciwa ocena pozycji, żeby ósemka wyraźnie się od siebie różniła.

Jest jeden warunek. To scena pełna animowanych plansz liczonych na żywo, więc działa na komputerze. Na telefonie jej nie otwieram, bo nie zadziała tak, jak powinna.
