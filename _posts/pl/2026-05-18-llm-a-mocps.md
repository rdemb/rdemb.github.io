---
title: "Czym LLM różni się od MOCPS"
lang: pl
kind: reflection
en_url: /en/2026/05/18/llm-vs-mocps/
de_url: /de/2026/05/18/llm-vs-mocps/
excerpt: "LLM modeluje język i wiedzę statystyczną w tekście. MOCPS bada mały stan predykcyjny obiektu w kontrolowanym świecie pikselowym."
---

LLM i MOCPS żyją w dwóch różnych skalach.

LLM jest dużym modelem językowym. Uczy się przewidywać tokeny tekstu na ogromnych korpusach. Jego siłą jest język: streszczanie, kod, rozmowa, planowanie, rozpoznawanie wzorców w tekście. To model ogólny w sensie interfejsu językowego, ale jego podstawowym medium są tokeny.

MOCPS nie próbuje robić tego samego. To mały diagnostyk badawczy. Działa na prostych światach proceduralnych, gdzie można mierzyć bardzo konkretne pytanie: czy latentny stan obiektu pozwala przewidywać przyszłą pozycję lepiej niż baseline persystencji?

Najważniejsze różnice:

| obszar | LLM | MOCPS |
| --- | --- | --- |
| medium | tekst / tokeny | małe obrazy pikselowe |
| skala | ogromne modele i dane | CPU-friendly toy diagnostic |
| cel | modelowanie języka i wzorców tekstu | test predykcyjnego stanu obiektu |
| baseline | zwykle zależny od zadania | jawna persystencja pozycji |
| wynik | jakość odpowiedzi / downstream tasks | MAE pozycji i winrate vs baseline |
| claim | szeroki interfejs językowy | wąski wynik diagnostyczny |

LLM może pomóc mi pisać kod, porządkować eksperymenty i szukać błędów. MOCPS jest natomiast samym obiektem badania: małą próbą zrozumienia, kiedy reprezentacja predykcyjna naprawdę niesie stan, a kiedy tylko wygląda sensownie.

Nie traktuję MOCPS jako konkurencji dla LLM. To inny rodzaj pytania. LLM jest narzędziem językowym. MOCPS jest mikroskopem diagnostycznym dla object-centric predictive state.
