---
title: "GAMBIT: acht Geister, die anders spielen"
lang: "de"
kind: "project"
date: "2026-06-02"
excerpt: "Acht neurodivergente Geister spielen ununterbrochen Schach. Jeder hat einen anderen kognitiven Stil, kein Etikett — und jeder spielt genau so, wie er denkt."
key: "gambit-eight-minds"
slug: "gambit-acht-geister"
---
GAMBIT begann mit einer einfachen Frage: Was passiert, wenn ich acht verschiedene Denkweisen an dasselbe Spiel setze?

Jeder der acht Spieler ist ein anderer kognitiver Stil. Iskra spielt in Blitzen und Opfern, Kanon rechnet tief und unerschütterlich, Cień baut eine Mauer und wartet auf den Fehler des anderen, Zegar schneidet mit Präzision, ohne einen überflüssigen Zug. Das sind keine Etiketten, die an Namen geklebt wurden — es sind verschiedene Werte von vier Engine-Parametern: Tiefe, Temperatur, Risikobereitschaft, Aggression. Eine andere Denkweise = ein anderes Spiel.

Alles läuft lokal, im Browser. Ich habe eine eigene, legale Schach-Engine geschrieben: Zuggenerierung, Alpha-Beta, Stellungsbewertung. Keine externe API, kein Backend für das Spiel selbst. So kannst du dich hinsetzen und eine echte Partie gegen einen gewählten Geist spielen, und dein Ergebnis kommt neben ihnen in die ELO-Tabelle.

**Was funktioniert:** Die Szene lebt rund um die Uhr — wenn der Turnierserver schweigt, spielen die Bretter im Browser gegeneinander.

**Was ich gelernt habe:** Der „Charakter" eines Spielers braucht kein großes Modell. Vier Zahlen und eine ehrliche Bewertungsfunktion genügen, damit sich acht Spieler am Brett deutlich unterscheiden.

**Einschränkung:** Es ist eine Szene aus Canvas-Elementen, die live rechnen. Sie läuft am Desktop; auf dem Handy öffne ich sie bewusst nicht, weil sie nicht so funktionieren würde, wie sie sollte.
