---
title: "Wie sich ein LLM von MOCPS unterscheidet"
lang: de
kind: reflection
pl_url: /pl/2026/05/18/llm-a-mocps/
en_url: /en/2026/05/18/llm-vs-mocps/
excerpt: "Ein LLM modelliert Sprache und statistisches Wissen in Text. MOCPS testet einen kleinen prädiktiven Objektzustand in einer kontrollierten Pixelwelt."
---

Ein LLM und MOCPS leben in sehr unterschiedlichen Maßstäben.

Ein LLM ist ein großes Sprachmodell. Es lernt, Texttokens aus riesigen Korpora vorherzusagen. Seine Stärke ist Sprache: Zusammenfassung, Code, Dialog, Planung und Mustererkennung in Text. Es ist breit als Sprachinterface, aber sein primäres Medium sind Tokens.

MOCPS versucht nicht, dasselbe zu tun. Es ist eine kleine Forschungsdiagnostik. Es läuft in einfachen prozeduralen Welten, in denen eine enge Frage messbar ist: sagt ein object-centric latent state eine zukünftige Position besser vorher als Persistenz?

Wichtige Unterschiede:

| Bereich | LLM | MOCPS |
| --- | --- | --- |
| Medium | Text / Tokens | kleine Pixelbilder |
| Maßstab | große Modelle und Datensätze | CPU-freundliche Toy-Diagnostik |
| Ziel | Sprach- und Textmuster-Modellierung | Test eines prädiktiven Objektzustands |
| Baseline | aufgabenabhängig | explizite Positionspersistenz |
| Ergebnis | Antwortqualität / Downstream Tasks | Positions-MAE und Winrate vs Baseline |
| Claim | breites Sprachinterface | enges diagnostisches Resultat |

Ein LLM kann mir helfen, Code zu schreiben, Experimente zu ordnen und Fehler zu finden. MOCPS ist dagegen das Untersuchungsobjekt: ein kleiner Versuch zu verstehen, wann eine prädiktive Repräsentation wirklich Zustand trägt und wann sie nur plausibel aussieht.

Ich behandle MOCPS nicht als Konkurrenz zu LLMs. Es stellt eine andere Art von Frage. Ein LLM ist ein Sprachwerkzeug. MOCPS ist ein diagnostisches Mikroskop für object-centric predictive state.
