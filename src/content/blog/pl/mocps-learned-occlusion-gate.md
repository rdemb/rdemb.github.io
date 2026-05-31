---
title: "MOCPS: learned occlusion gate"
lang: "pl"
kind: "project"
date: "2026-05-19"
excerpt: "Krótka okluzja rozdzieliła zwykłą pamięć od predykcyjnej. Mały learned gate odtworzył zachowanie ręcznej pamięci predykcyjnej na sprawdzonym gridzie."
key: "mocps-learned-occlusion-gate"
slug: "mocps-learned-occlusion-gate"
---
Po crossing objects pojawiło się naturalne pytanie: co się stanie, gdy dwa podobne obiekty nie tylko mijają się, ale na chwilę zlewają się w jeden widoczny komponent?

To jest trudniejsze niż zwykłe crossing. Gdy oba obiekty są cały czas widoczne, wystarcza prosta ciągłość centroidu. Przy krótkiej okluzji obserwacja staje się dwuznaczna: model musi utrzymać hipotezę tożsamości bez pełnego potwierdzenia z obrazu.

Wynik audytu:

- frozen nearest / velocity / learned memory: `15/20`
- frozen velocity assignment po okluzji: `0.000`
- hand-coded predictive occlusion memory: `20/20`
- learned recurrent occlusion gate: `20/20`
- learned gate assignment podczas okluzji: `1.000`
- learned gate assignment po okluzji: `1.000`
- identity switch rate: `0.000`
- gate final update accuracy: `1.000`

Wniosek jest wąski, ale ważny: zwykła pamięć komponentu nie wystarcza, gdy obraz na chwilę scala dwa obiekty. Trzeba mieć stan, który potrafi przewinąć slot przez brak jednoznacznej obserwacji. Mały learned gate nauczył się tej decyzji z image-derived pseudo-targetów: kiedy zaufać obserwacji, a kiedy przewidzieć stan z pamięci.

To nadal nie jest pełne trainable Slot Attention. Gate siedzi na istniejącym image-derived slot state i learned memory scorerze. Nie twierdzę, że to szeroka odporność na okluzję. Następny test powinien być mniej wygodny: dłuższa okluzja i akceleracja, gdzie stała prędkość przestaje być łatwym założeniem.
