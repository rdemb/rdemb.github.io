---
layout: page
title: "AAI"
lang: de
pl_url: /aai/
en_url: /en/aai/
permalink: /de/aai/
---

AAI, **Adaptive Auction Intelligence**, ist meine Art, den Markt vor einer Entscheidung zu ordnen. Ich lese den Markt als Auktion, nicht als Sammlung einzelner Indikatoren.

Kurz gesagt: erst Struktur, dann Szenario. Erst Ausführungskosten, Datenfrische und Erinnerung ähnlicher Setups, dann Richtung. Kein Edge ist kein Fehler. Es ist ein Ergebnis.

## Frage

Kann eine lokale deterministische Market-Intelligence-Schicht einem Operator helfen zu trennen:

- Kontext von Setup,
- Setup von Ausführung,
- Narrativ von Evidenz,
- Aktivität von Edge.

Das ist kein autonomer P&L-Bot. AAI ist eine Schicht zur Marktbewertung: Sie beschreibt, was die Auktion zeigt, wo Evidenz widersprüchlich ist, was fehlt und wann Nichtstun die sauberere Entscheidung ist.

## Paradigma

Die Kernregel lautet:

> No-Edge = No-Trade.

AAI kann No-Trade zurückgeben. Es kann zeigen, dass der breite Kontext interessant ist, aber Preisakzeptanz fehlt. Es kann auch Konflikte zwischen Auktion, Ausführungskosten, Orderflow und Memory zeigen.

Die Entscheidung wird in Schichten zerlegt:

1. **Regime**: Trend, Range, Kompression, Expansion, Chop.
2. **Auktion**: Value Migration, Acceptance, Rejection, Sweep, Gleichgewicht.
3. **Mikrostruktur**: Orderflow, Delta, DOM, Footprint, Micro-Price.
4. **Ausführung**: Spread, Fees, Slippage, Adverse Selection, Fill Quality.
5. **Memory**: ähnliche historische Setups und ihre Outcomes.
6. **Evidence Review**: ob die These durch Daten getragen wird oder nur kohärent klingt.

Keine einzelne Schicht darf so tun, als wäre sie die ganze Wahrheit.

## Architektur

AAI ist eine lokale analytische Schicht. Der Hot Path ist deterministisch: kein LLM im Runtime, kein externes Sprachmodell als Entscheider und keine generierte Prosa als Signal.

```text
local market data
  -> auction state
  -> microstructure context
  -> execution cost
  -> memory / replay
  -> evidence review
  -> operator context
```

Das Ergebnis ist keine Buy/Sell-Anweisung. Das Ergebnis ist Kontext für einen Menschen: Auktionstyp, Arbeitsrichtung falls vorhanden, Konfliktgrad, Ausführungskosten, Datenqualität und Grund für No-Trade, wenn kein Edge da ist.

## Was ich messe

AAI wird nicht daran gemessen, wie klug es klingt. Mich interessieren Metriken, die Storytelling bestrafen:

- MFE / MAE nach Entry,
- Win Rate über 5 / 15 / 60 Minuten,
- Entry-Kosten gegen eine ideale Referenz,
- Slippage- und Fee-Sensitivität,
- korrekte Abstain Rate,
- Verhalten nach Kosten,
- Out-of-sample-Degradation.

Wenn ein Setup nur vor Kosten funktioniert, ist es kein Setup. Wenn es nur mit perfektem Fill funktioniert, ist es fragil. Wenn es nur in einem Fenster funktioniert, bleibt es research-only.

## Aktueller Stand

Das wichtigste öffentliche Ergebnis ist negativ, und genau deshalb nützlich.

In der Pre-Validation haben standalone AAI-Agenten die Post-Cost-Gate auf dem längeren Hold nicht bestanden. Entscheidung: AAI nicht als unabhängigen Signalgenerator behandeln. Die bessere Rolle ist **State Encoder** und **Evidence Layer**: eine Schicht, die Auktionen beschreibt, Konflikte erkennt und dem Operator hilft, Kontext nicht mit Edge zu verwechseln.

Die Frage verschiebt sich von "sagt AAI die Richtung voraus?" zu:

> Kann AAI Selektion, Abstain Rate und Entry Quality verbessern, wenn es als Evidenzfilter genutzt wird?

## Projektentscheidung

AAI bleibt Forschungsprojekt und ein Werkzeug, das einen Menschen unterstützt.

Ich veröffentliche keine Signale, Entry-Level, Live-Reports, Logs, privaten Feeds oder Ergebnisse, die als Empfehlung missverstanden werden können. Öffentlich ist das Paradigma: evidence-first, local-first, no-edge-first.

## Caveats

- Keine Anlageberatung.
- Kein autonomer Trading-Bot.
- Kein Versprechen eines Markt-Edges.
- Negative Ergebnisse gehören zum Projekt.
- Jede Beförderung von Research in Praxis braucht Replay, Kosten, OOS-Prüfung und explizite Kill-Switches.
