---
title: "Czym LLM różni się od MOCPS"
lang: "pl"
kind: "reflection"
date: "2026-05-18"
excerpt: "LLM pomaga mi myśleć i pisać kod. MOCPS jest małym testem predykcji ruchu. To różne narzędzia do różnych pytań."
key: "llm-vs-mocps"
slug: "llm-a-mocps"
---
LLM i MOCPS łatwo wrzucić do jednego worka, bo oba zahaczają o modele i predykcję. To byłoby mylące.

LLM jest dla mnie narzędziem pracy z językiem i kodem. Pomaga streszczać, planować, szukać błędów, porządkować eksperymenty i szybciej przechodzić od pomysłu do działającego szkicu. Jego podstawowym medium są tokeny: tekst, instrukcje, fragmenty programu, opisy.

MOCPS nie próbuje być takim narzędziem. To mały diagnostyk badawczy. Działa na prostych światach pikselowych, gdzie można zadać jedno konkretne pytanie: czy reprezentacja obiektu pozwala przewidzieć przyszłą pozycję lepiej niż persystencja?

Najważniejsze różnice:

| obszar | LLM | MOCPS |
| --- | --- | --- |
| medium | tekst / tokeny | małe obrazy pikselowe |
| skala | ogromne modele i dane | CPU-friendly toy diagnostic |
| cel | praca z językiem, kodem i wzorcami tekstu | test predykcyjnego stanu obiektu |
| baseline | zwykle zależny od zadania | jawna persystencja pozycji |
| wynik | jakość odpowiedzi / downstream tasks | MAE pozycji i winrate vs baseline |
| claim | szeroki interfejs językowy | wąski wynik diagnostyczny |

Najprostsze rozróżnienie jest takie: LLM pomaga mi budować i myśleć, a MOCPS jest jednym z obiektów, które buduję i testuję.

Nie traktuję MOCPS jako konkurencji dla LLM. To inny rodzaj pytania i inna skala. LLM jest szerokim interfejsem językowym. MOCPS jest wąskim testem diagnostycznym: ma pokazać, kiedy predykcyjny stan obiektu działa lepiej niż prosty baseline.
