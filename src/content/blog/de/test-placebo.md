---
title: "Der Placebo-Test: wie du deinem eigenen Backtest nicht glaubst (Python)"
lang: "de"
kind: "trading"
date: "2026-06-12"
excerpt: "Ein Backtest im Plus ist zu wenig. Bevor du einer Strategie glaubst, prüfe, ob nicht zweitausend zufällige Strategien sie schlagen. Dreißig Zeilen Python, die mir mehr Geld gespart haben als jeder Indikator."
key: "test-placebo"
slug: "test-placebo"
---

Der teuerste Moment im Algo-Trading ist der, in dem der Backtest eine Kapitalkurve zeigt, die nach rechts und nach oben steigt. Teurer wird er durch das, was du danach machst. Ich habe es jahrelang so gemacht wie alle: Ich freute mich und startete auf dem Demo. Heute mache ich etwas anderes, und das sind die wichtigsten dreißig Zeilen Code in meiner Werkstatt.

Die Idee habe ich mir aus der Medizin geliehen. Ein neues Medikament muss nicht einfach wirken, es muss besser wirken als eine Zuckertablette, die genauso verabreicht wird. Eine Strategie muss nicht einfach auf der Historie verdienen, sie muss besser verdienen als eine zufällige Strategie, die gleich oft einsteigt, in dieselben Kostenbedingungen, nur ohne jede Idee. Wenn sich dein Vorteil nicht von zweitausend zufälligen Strategien abhebt, dann ist es kein Vorteil. Es ist Rauschen.

## Der Code

```python
import numpy as np

def test_placebo(zwroty_nastepnej_swiecy, sygnal, n_placebo=2000, seed=0):
    """Schlägt die Strategie zufällige Strategien mit gleicher Zahl an Einstiegen?

    zwroty_nastepnej_swiecy: Array der Renditen der Kerze, die auf das Signal folgt
    sygnal: bool-Array, True dort, wo die Strategie einsteigt (long)
    Gibt (Strategie-Ergebnis, p_value) zurück.
    """
    rng = np.random.default_rng(seed)
    zwroty = np.asarray(zwroty_nastepnej_swiecy, dtype=float)
    sygnal = np.asarray(sygnal, dtype=bool)
    k = int(sygnal.sum())
    wynik = zwroty[sygnal].sum()

    lepsze = 0
    for _ in range(n_placebo):
        losowy = np.zeros(len(zwroty), dtype=bool)
        losowy[rng.choice(len(zwroty), size=k, replace=False)] = True
        if zwroty[losowy].sum() >= wynik:
            lepsze += 1
    return wynik, (lepsze + 1) / (n_placebo + 1)
```

Anwendung: Du nimmst deine Daten, berechnest die Rendite der Kerze, die auf jeden Punkt folgt (für Shorts drehst du das Vorzeichen um), baust das `sygnal`-Array aus der Regel der Strategie und rufst die Funktion auf. Das Ergebnis ist die Summe der Renditen deiner Einstiege sowie p, also der Anteil der zufälligen Strategien, die mindestens so gut abschnitten wie deine.

Bevor ich diesen Code hier eingefügt habe, habe ich ihn so geprüft, wie ich Strategien prüfe. Auf reinem Rauschen mit zufälligem Signal kam p auf 0.56 heraus, also eine Münze, wie es der Wahrheit entspricht. Nach dem Einpflanzen eines künstlichen Vorteils in dieselben Daten fiel p auf 0.002. Der Test unterscheidet das eine vom anderen, und das ist seine ganze Arbeit.

## Wie man p liest und sich nicht selbst betrügt

Ein kleines p, sagen wir unter 0.01, bedeutet so viel: Sehr selten gibt es eine zufällige Strategie, die deine schlägt. Das ist noch kein Beweis für einen Vorteil, aber ein ernster Grund, weiterzutesten. Ein p-value um 0.2 oder 0.5 bedeutet, dass deine Regel ungefähr das tut, was eine Ziehung tut, und keine Schwellenoptimierung rettet das, weil du Rauschen optimieren würdest.

Drei Fallen, jede kenne ich von innen. Erste: Wenn du zwanzig Ideen testest, kommt eine rein zufällig mit p unter 0.05 heraus, also halte die Kriterien vorab fest, bevor du das Ergebnis siehst, und zähle alle Versuche, auch die misslungenen. Zweite: die Kosten. Vom Renditen-Array müssen Spread und Slippage von jedem Einstieg abgezogen sein, bei deinem Broker andere als bei meinem, sonst testest du eine Welt, in der der Broker draufzahlt. Dritte: Dieser Test prüft die Wahl der Einstiegsmomente bei festgelegter Zahl an Trades. Er prüft weder das Positionsmanagement noch, ob die Strategie andere Jahre überlebt als die im Test, dafür sind Out-of-Sample-Daten da.

Bei mir hat dieser Test sein kleines Denkmal. Neun Mal in Folge hat er Forschungsfronten getötet, die vielversprechend aussahen: Kerzenmuster, stündliche Muster, Marktmodi, Makro. Neun Mal hat er mir Monate erspart, einen EA auf Sand zu bauen. Jede weitere Idee, auch die, über die ich in diesem Blog schreibe, geht zuerst durch ihn hindurch. Füge ihn in deine Werkstatt ein und lass ihn auch für deine Lieblingsideen gnadenlos sein. Besonders für die Lieblinge.

Dateien aus diesem Beitrag: [test_placebo.py](/code/test_placebo.py) mit lauffähigem Demo und [synthetische CSV](/code/EURUSD_H1_syntetyk.csv) zum Üben. Die Spielzeugregel im Demo kommt ehrlich auf p gleich 0.355 heraus, also eine Ziehung, und das ist der Sinn: Sieh dir an, wie das Fehlen eines Vorteils aussieht, bevor du anfängst, einen echten zu suchen.

Bildungsmaterial, keine Anlageempfehlung.
