---
title: "Wie sich ein LLM von MOCPS unterscheidet"
lang: de
kind: reflection
pl_url: /pl/2026/05/18/llm-a-mocps/
en_url: /en/2026/05/18/llm-vs-mocps/
excerpt: "Ein LLM hilft mir beim Denken und Coden. MOCPS ist ein kleiner Bewegungstest. Verschiedene Werkzeuge, verschiedene Fragen."
---

LLMs und MOCPS landen leicht im selben Topf, weil beide mit Modellen und Vorhersage zu tun haben. Das wäre irreführend.

Ein LLM ist für mich ein Werkzeug für Sprache und Code. Es hilft beim Zusammenfassen, Planen, Fehlersuchen, Ordnen von Experimenten und beim schnelleren Weg von einer Idee zu einem laufenden Entwurf. Sein Medium sind Tokens: Text, Anweisungen, Programmfragmente, Beschreibungen.

MOCPS versucht nicht, so ein Werkzeug zu sein. Es ist eine kleine Forschungsdiagnostik. Es läuft in einfachen Pixelwelten, in denen eine enge Frage messbar ist: Sagt eine Objektrepräsentation eine zukünftige Position besser vorher als Persistenz?

Wichtige Unterschiede:

| Bereich | LLM | MOCPS |
| --- | --- | --- |
| Medium | Text / Tokens | kleine Pixelbilder |
| Maßstab | große Modelle und Datensätze | CPU-freundliche Toy-Diagnostik |
| Ziel | Arbeit mit Sprache, Code und Textmustern | Test eines prädiktiven Objektzustands |
| Baseline | aufgabenabhängig | explizite Positionspersistenz |
| Ergebnis | Antwortqualität / Downstream Tasks | Positions-MAE und Winrate vs Baseline |
| Claim | breites Sprachinterface | enges diagnostisches Resultat |

Die einfachste Trennung ist: Ein LLM hilft mir beim Bauen und Denken; MOCPS ist eines der Dinge, die ich baue und teste.

Ich behandle MOCPS nicht als Konkurrenz zu LLMs. Es stellt eine andere Frage auf einer anderen Skala. Ein LLM ist ein breites Sprachinterface. MOCPS ist ein enger diagnostischer Test: Er soll zeigen, wann ein prädiktiver Objektzustand besser funktioniert als ein einfacher Baseline.
