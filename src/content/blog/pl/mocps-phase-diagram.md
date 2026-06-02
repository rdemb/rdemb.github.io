---
title: "Wskrzesiłem swój eksperyment ML i sprawdziłem, gdzie pęka"
lang: "pl"
kind: "project"
date: "2026-05-25"
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


## Aktualizacja: znalazłem lek

Hipoteza była dobra. Brama nad-przewidywała przy krótkim zniknięciu. Dodałem prosty arbitraż: przy krótkiej okluzji przytrzymaj ostatnią pozycję, przy długiej przewiduj. Dół się domknął, przy najkrótszej okluzji z 15% wróciło do 100%, przy najtrudniejszym rogu z 3% do 55%.

Ale najlepsze jest co innego. Sprawdziłem, ile w ogóle da się osiągnąć: model z idealną wiedzą o ruchu w tym najtrudniejszym rogu dobija tylko do 75%. Reszty nie da się naprawić uczeniem, bo obiekty mijają się za blisko, by je rozróżnić. To nie porażka modelu, to granica zadania.

I to jest dla mnie najważniejsze: wiedzieć nie tylko, że coś naprawiłem, ale ile z reszty jest nie do naprawienia. Bez tego drugiego pierwsze jest tylko połową prawdy.
