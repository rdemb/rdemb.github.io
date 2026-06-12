---
title: "Die Mathematik des Überlebens: was dein 2%-Risiko wirklich kostet (Python)"
lang: "de"
kind: "trading"
date: "2026-06-12"
excerpt: "Bei 45% Trefferquote ist eine Serie von acht Verlusten in Folge kein Pech, sondern Plan: Sie taucht in 84% der simulierten Historien auf. Ein Monte Carlo von Kapitalkurven, das zeigt, was deine Psyche nicht aushält, bevor du es erlebst."
key: "matematyka-przetrwania"
slug: "matematyka-przetrwania"
---

Es gibt eine Rechnung, die fast niemand vor der ersten Einzahlung macht und die alles verändert. Sie betrifft nicht Einstiege oder Indikatoren. Sie betrifft das, was mit dem Konto und mit dem Kopf passiert, wenn eine Strategie mit bekannter Trefferquote über fünfhundert Trades einfach ihr Ding macht. Viele haben einen Plan für die Gewinne. Fast niemand hat einen Plan für eine statistisch sichere Verlustserie.

Die Rechnung macht man in dreißig Sekunden mit einer Simulation. Du nimmst die Trefferquote und das Verhältnis von Gewinn zu Risiko aus deinen ehrlichen Tests, nach Kosten, legst den Prozentsatz Risiko pro Trade fest und lässt fünftausend alternative Historien deines Kontos laufen.

```python
import numpy as np

def monte_carlo_kapitalu(trafnosc, rr, ryzyko_proc,
                         n_transakcji=500, n_sciezek=5000, seed=0):
    """Verteilung der Kontoschicksale bei festem % Risiko pro Trade."""
    rng = np.random.default_rng(seed)
    wygrane = rng.random((n_sciezek, n_transakcji)) < trafnosc
    zwroty = np.where(wygrane, ryzyko_proc * rr / 100.0,
                              -ryzyko_proc / 100.0)
    kapital = np.cumprod(1 + zwroty, axis=1)
    szczyt = np.maximum.accumulate(kapital, axis=1)
    obsuniecie = 1 - kapital / szczyt
    max_dd = obsuniecie.max(axis=1)

    def max_seria_strat(w):
        s = m = 0
        for x in w:
            s = 0 if x else s + 1
            m = max(m, s)
        return m
    serie = np.array([max_seria_strat(w) for w in wygrane[:1000]])

    return {
        "mediana_kapitalu_na_koncu": float(np.median(kapital[:, -1])),
        "P(dd>=20%)": float((max_dd >= 0.20).mean()),
        "mediana_max_obsuniecia": float(np.median(max_dd)),
        "P(seria_strat>=8)": float((serie >= 8).mean()),
    }
```

Jetzt die Zahlen, denn darum geht es hier. Ich habe ein anständiges, realistisches Profil genommen: Trefferquote 45%, Gewinn 1.8-mal so groß wie das Risiko. Das ist eine Strategie mit positivem Edge, die viele gern hätten. Und ich habe sie in zwei Risiko-Varianten laufen lassen.

Bei einem Risiko von 0.5% pro Trade liegt der Median des Kontos nach fünfhundert Trades bei 1.89, der typische maximale Drawdown bei 6.4%, und die Chance, dass du jemals einen Drawdown von 20% siehst, kommt auf null von fünftausend Historien. Bei einem Risiko von 2% auf dieselbe Strategie steigt der Median auf 11, aber ein Drawdown von 20% oder schlimmer trifft in 77% der Historien, und der typische maximale Drawdown liegt bei 24%. Derselbe Edge, dieselben Einstiege. Eine andere Geometrie.

Die wichtigste Zahl steckt jedoch woanders und gilt für beide Varianten gleich: Eine Serie von mindestens acht Verlusten in Folge taucht in 84% der Historien auf, und mindestens zwölf in 15%. Ich wiederhole es, denn das ist der Kern: Bei einer fünfundvierzigprozentigen Trefferquote sind acht Niederlagen in Folge kein Zeichen, dass die Strategie tot ist. Es ist eine statistische Sicherheit, die man in den Plan und in die Psyche geschrieben haben muss, bevor sie eintritt. Menschen geben eine Strategie nicht auf, weil sie aufgehört hat zu funktionieren. Sie geben sie irgendwo um den sechsten Verlust in Folge auf, zwei Verluste vor dem, was die Mathematik von Anfang an im Plan hatte.

Ein Sanity-Check, ohne den ich keinen Code veröffentliche: Für eine Münze ohne Edge, Trefferquote 50% bei RR 1, kommt der Median auf 0.975, leicht unter der Linie. So soll es sein, das ist die Geometrie des Zinseszinses in Prozent, ein Verlust von 1% braucht mehr als 1% zum Aufholen. Der Simulator verspricht keine Gewinne, er rechnet nur, was auf lange Sicht passiert.

Das Skript zum Herunterladen: [monte_carlo_kapitalu.py](/code/monte_carlo_kapitalu.py), mit Parametern aus der Kommandozeile und einem TODO, das Bedeutung hat: Statt einer Münze mit fester Trefferquote kannst du aus deinem eigenen Trade-Journal samplen, denn echte Renditeverteilungen sind manchmal schlechter als eine Zweipunkt-Verteilung. Trefferquote und RR nimm aus deinen Tests nach den Kosten deines Brokers, zuerst durch den [Placebo-Test](/de/blog/test-placebo/) geschickt. Und den Wert für das Risiko pro Trade wähle so, dass der Drawdown, den der Simulator als typisch zeigt, etwas ist, auf das du Woche für Woche wirklich schauen kannst. In meinem [EA-Skelett](/de/blog/szkielet-ea/) endet der Eingabebereich bei 2%, und das nicht zufällig.

Bildungsmaterial, keine Anlageempfehlung.
