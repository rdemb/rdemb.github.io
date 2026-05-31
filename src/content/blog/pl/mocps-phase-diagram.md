---
title: "Wskrzesiłem swój eksperyment ML i sprawdziłem, gdzie pęka"
lang: "pl"
kind: "project"
date: "2026-05-31"
excerpt: "Stary projekt o przewidywaniu ruchu obiektu. Odpaliłem go po miesiącach i zadałem mu najtwardsze pytanie, jakie umiałem."
key: "mocps-phase-diagram"
slug: "mocps-phase-diagram"
---

Mam mały projekt badawczy, MOCPS. Pyta o jedną wąską rzecz: czy mały nauczony model potrafi „trzymać w głowie" obiekt, który znika za przeszkodą i wraca. Object permanence, to samo, czego uczy się roczne dziecko.

Po miesiącach wróciłem do kodu, postawiłem środowisko i puściłem go na nowo. Najpierw zrobiłem coś, co psuje wiele dumnych wyników: dołożyłem **uczciwe baseline'y**.

## Pierwsza prawda boli

Mój model „bije persystencję" w 222 przypadkach na 222. Brzmi świetnie, dopóki nie zapytasz: a co z głupszym baseline'em? Okazało się, że trywialne „zakładaj stałą prędkość" jest niemal idealne, a mój model przy nim wypada gorzej. Czyli „bije persystencję" nic nie znaczyło. Persystencja zakłada, że obiekt stoi, więc to wróżenie dla naiwnych.

## Gdzie zaczyna się sens

Wartość pojawia się dopiero tam, gdzie sama obserwacja przestaje wystarczać: pod **zasłonięciem**. Gdy obiekt znika, baseline prędkościowy gubi jego tożsamość po powrocie. Nauczona pamięć trzyma ją idealnie. To było do przewidzenia, ale wciąż ręcznie kodowana pamięć radziła sobie tak samo, więc wygrywała struktura, nie uczenie.

Aż doszedłem do najtrudniejszego przypadku: obiekt **zmienia kierunek, kiedy jest niewidoczny**. Tu velocity pada, ręczna pamięć pada, a **nauczona trafia w 100%**. To jedyne miejsce, gdzie uczenie bije i fizykę, i strukturę. Mały model nauczył się czegoś o dynamice, czego prosta ekstrapolacja nie umie.

## I tu się łamie

Nie napiszę Ci, że wszystko działa, bo nie działa. Przy silnym przyśpieszeniu i krótkim zasłonięciu nauczona pamięć **pęka** do 3% trafności, gorzej niż głupi baseline. Przy dłuższym zasłonięciu znów jest dobrze. Tego dziwnego, niemonotonicznego załamania jeszcze nie rozumiem.

I właśnie dlatego o nim piszę. Wynik, który chowa swój róg porażki, nie jest nauką, tylko reklamą. Mam czysty, reprodukowalny na CPU diagram: kiedy nauczony stan predykcyjny daje stałość obiektu, a kiedy się sypie. To nie jest „przełom". To jest uczciwa mapa, a z takich map buduje się coś prawdziwego.
