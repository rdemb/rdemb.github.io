---
title: "D-LOGIC FX"
lang: "de"
kind: "project"
excerpt: "Ein halb-algorithmisches FX-Daytrading-Konzept. Die Maschine kartiert die Struktur des Tages, die Richtung nimmt der Mensch."
key: "dlogic-fx"
slug: "dlogic-fx"
---
D-LOGIC FX ist mein Daytrading-Konzept für den Devisenmarkt, gebaut um eine unbequeme Beobachtung: Auf Retail-Daten sagt der Preis nach Kosten seine eigene Richtung nicht vorher. Ich habe das über achtzehn unabhängige Fronten geprüft. Jedes Mal dieselbe Antwort.

Also drehe ich das Problem um. Statt die Maschine zum Raten der Richtung zu zwingen, lasse ich sie kartieren, was an der Struktur des Tages wirklich vorhersagbar ist. Die Richtung bleibt beim Menschen. Die Maschine liefert mir Kontext, Risiko und Timing. Die Entscheidung treffe ich.

Der Link oben öffnet dieses Konzept in einem neuen Tab als lebendes 3D-Netz: ein Kern, sechs Äste und ihre Komponenten. Darin drehst du die Szene, zoomst und fährst über jeden Knoten, um ihn zu lesen.

## These

> Richtung ist Rauschen. Struktur ist Signal.

Achtzehn Versuche, Richtung auf Retail-Daten vorherzusagen. Nach Spread und Kommission überlebte keiner. Das ist kein Scheitern. Es ist ein Ergebnis, und es sagt mir, wo ich keinen Edge suchen soll.

Die Struktur des Tages verhält sich anders. Der Rhythmus der Volatilität, die Abfolge der Sessions, die Wahrscheinlichkeit eines neuen Tageshochs oder Tagestiefs aus einem gegebenen Zustand. Das ist messbar und wiederholbar. Darauf baue ich.

## Daten

Die Grundlage ist Multi-Timeframe-Preis (M5, M15, D1) über fünf große FX-Paare, rekonstruiert in Broker-Zeit, mit fast zwei Jahrzehnten Tageshistorie. Rund sechstausend Tage. So viel braucht ein ehrlicher Out-of-Sample-Test, kein kosmetischer.

## Fünf Schichten

Jede Schicht ist ein mechanisch motivierter Read des Tages, der sein eigenes Gate bestanden hat.

- **Tageskarte (Hazard)**. Die Live-Wahrscheinlichkeit eines neuen Tagesextrems aus dem aktuellen Zustand. Out-of-Sample AUC von 0,87 bis 0,92, Placebo 0,000. Der stärkste Teil des Konzepts.
- **Volatilitäts-Engine**. Sie prognostiziert die Tagesrange, was Sizing und Stop-Platzierung liefert. R² von 0,12 bis 0,30.
- **Budget und Timing**. Wie lange es sich lohnt, im Risiko zu sitzen. Korrelation -0,48 mit der Fensterqualität.
- **VWAP-Fade**. Der eine richtungsgefärbte Read, der Out-of-Sample auf allen fünf Paaren bestand. Ob er Kosten überlebt, dafür ist die Rigorositäts-Schicht da. Ich veröffentliche ihn nicht als Signal.
- **Meta-Labeling**. Eine Schicht, die mich als Trader lernt. Aktuell im Forward-Test.

## Rigorosität

Nichts kommt auf Glauben hinein. Jeder Kandidat wird vorab registriert, dann Out-of-Sample beurteilt, gegen Placebo geschlagen, über das ganze Grid per False-Discovery-Kontrolle gefiltert (q ≤ 0,10) und nach Kosten bewertet, bevor er befördert wird. Eine Deflated Sharpe Ratio schützt vor der Suche selbst. Die meisten Ideen sterben genau hier. So gewollt.

## Der Tag in einem Panel

Das Cockpit fügt alle Schichten zu einer Ansicht. Oben der Wahrscheinlichkeits-Bias, dann meine Position, die Preis-Magnete, die News-Uhr. Am Ende ein einziges Verdikt.

- **BIAS**. P hoch gegen runter.
- **PULSE**. Multi-Timeframe-Übereinstimmung auf einer Skala von 0 bis 100.
- **LEVELS**. Vortageshoch und Vortagestief, Ziele.
- **NEWS**. Blackout ±15 Minuten um Daten.
- **GO / NO-GO**. Ein Verdikt beim Einstieg.

Es informiert. Es drückt nie ab.

## Was ich begraben habe

Ein Konzept ist so viel wert wie die Ideen, die es offen begraben kann. Diese sahen klug aus und sagten nach Rigorosität nichts vorher:

- **Oszillator**. Information Coefficient nahe null.
- **Fibonacci**. Ein Artefakt, das unter ehrlichem Test verschwindet.
- **Fixing-W-Form**. Stirbt an Kosten.
- **Squeeze**. Statistisch nicht signifikant.

Ich zeige sie bewusst. Ehrlichkeit gehört zum Konzept.

## Der Mensch

D-LOGIC FX läuft in OBSERVE_ONLY. Die Maschine beschreibt die Auktion, erkennt Konflikt, misst Kosten und Timing. Richtung, Größe und die Entscheidung einzusteigen sind meine. Keine Modell-Prosa gilt als Signal. Der Hot Path ist deterministisch, ohne Sprachmodell im Runtime. Die Kernregel ist einfach: kein Edge heißt kein Trade.

## Caveats

- Keine Anlageberatung.
- Kein autonomer Trading-Bot.
- Kein Versprechen eines Markt-Edges.
- Ein negatives Ergebnis gehört zum Projekt.
- Jede Beförderung von Research in die Praxis braucht Replay, Kosten, Out-of-Sample-Prüfung und explizite Kill-Switches.
