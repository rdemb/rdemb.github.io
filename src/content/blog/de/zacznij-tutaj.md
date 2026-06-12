---
title: "Fang hier an: eine kleine Schule des ehrlichen Algotradings"
lang: "de"
kind: "trading"
date: "2026-06-12"
excerpt: "Eine Karte dieses Blogs für jemanden, der automatische Systeme am Markt bauen will und sich dabei nicht selbst belügen möchte. Eine Lesereihenfolge, Code zum Herunterladen und die eine Regel, die alles zusammenhält."
key: "zacznij-tutaj"
slug: "zacznij-tutaj"
---

Dieser Blog ist gewachsen, also ist es Zeit für eine Karte. Wenn du automatische Systeme am Markt bauen willst und lieber wissen als glauben möchtest, findest du unten die Reihenfolge, in der ich es selbst lesen würde. Eine Regel hält alles zusammen: erst lernen, schlechte Ideen zu verwerfen, und erst dann auf denen bauen, die überlebt haben.

## Schritt 1: das Maß der Erwartungen

Fang mit [der Wahrheit über Day-Trading](/de/blog/day-trading-truth/) an, denn alles Weitere setzt voraus, dass du keine Abkürzung suchst. Danach [was mich Indikatoren gelehrt haben](/de/blog/indicators-i-trusted/) und [wie ich eine Idee teste](/de/blog/testing-a-trading-idea/), um zu sehen, wie es aussieht, mit einer Hypothese statt mit einem Bauchgefühl zu arbeiten.

## Schritt 2: ein Markt, der gemessen und nicht erraten wird

Vier Beiträge darüber, was sich am Markt wirklich zählen lässt und was daraus folgt. [Die Volatilitätsuhr](/de/blog/zegar-zmiennosci/): der Markt hat einen Tagesverlauf, und eine Kerze ohne Uhrzeit ist eine unvollständige Information. [Die Karte des Tages](/de/blog/mapa-dnia/): statt zu fragen, wohin es geht, frag, ob das heutige Extrem schon drin ist. [Zeit im Risiko](/de/blog/czas-w-ryzyku/): eine Kennzahl, die in keinem Broker-Report steht. Und [die Arbeitsteilung zwischen Mensch und Maschine](/de/blog/czlowiek-i-maszyna/), also was das automatische System niemals tun sollte, denn ich habe es über neun Fronten der Forschung geprüft.

## Schritt 3: die Werkstatt mit Code

Hier beginnt der Teil zum Kopieren, in der Reihenfolge des Zusammenbaus. Bevor du irgendetwas berechnest, [validiere die Daten](/de/blog/dane-pierwszy-grzech/), denn eine fehlerhafte Datei vergiftet alles Weitere. Dann der [Placebo-Test](/de/blog/test-placebo/), das Sieb, durch das du jede Idee schickst, und die [Mathematik des Überlebens](/de/blog/matematyka-przetrwania/), damit das Risiko pro Trade aus der Rechnung kommt und nicht aus dem Appetit. Dazu die [vollen Kosten eines Trades](/de/blog/ile-kosztuje-transakcja/), denn ein Vorteil, der den Spread und den Slippage nicht verdient, ist kein Vorteil. Erst jetzt das [EA-Skelett](/de/blog/szkielet-ea/), Installation ohne Signal. Auf das Skelett legst du Filter: [die Volatilitätsuhr in der Praxis](/de/blog/zegar-zmiennosci-w-praktyce/) und [das Tagesbudget](/de/blog/budzet-dnia-filtr/). Und am Ende das Management: [schrittweiser Trailing-Stop](/de/blog/ea-trailing-krokowy/), [Stille rund um die News](/de/blog/ea-blackout-newsow/) und [mehrere Paare mit gemeinsamem Risiko](/de/blog/ea-wiele-par/).

Der Code aus diesen Beiträgen liegt auch in Dateien, zusammen mit synthetischen Daten zum Üben:

- [dlogic-szkielet-ea.mq5](/code/dlogic-szkielet-ea.mq5), das EA-Skelett für den MetaEditor,
- [dlogic-warsztat.mqh](/code/dlogic-warsztat.mqh), alle Funktionen der Werkstatt in einem einzigen Include,
- [test_placebo.py](/code/test_placebo.py), [zegar_zmiennosci.py](/code/zegar_zmiennosci.py), [walidator_danych.py](/code/walidator_danych.py) und [monte_carlo_kapitalu.py](/code/monte_carlo_kapitalu.py),
- [EURUSD_H1_syntetyk.csv](/code/EURUSD_H1_syntetyk.csv), zum Lernen generierte Daten, mit einer Warnung im Kopf.

Ein Hinweis vorweg, weil ihr danach fragt: diese Dateien sind absichtlich kein fertiges System. Das Signal ist leer, die Schwellen sind Beispiele, und die Parameter stellt man auf den Daten des eigenen Brokers ein, nicht auf meinen. Das ist eine Werkstatt und Material zum Weiterentwickeln, kein Produkt. Fertige Systeme aus dem Internet empfehle ich nicht, meines eingeschlossen, falls ich je schwach werden und eines herausgeben sollte.

## Schritt 4: tiefer

Wie ein [verstecktes Markow-Modell](/de/blog/hmm-tryb-rynku/) funktioniert und warum der Marktmodus Kontext ist und kein Signal. [Der Markt als Auktion](/de/blog/market-as-auction/) und [der Markt als Organismus](/de/blog/market-as-organism/), der begriffliche Rahmen. Und wenn du sehen willst, wie dieselben Regeln der Strenge abseits des Marktes aussehen, schau dir das [lebende Weltmodell](/de/projekty/mocps/) an, das Physik lernt und mit demselben Geist gemessen wird: Baseline, Placebo, ehrliche Grenzen.

Der tägliche Rhythmus kommt in den [FX-Briefings](/de/blog/fx-brief-2026-06-12/), und das Ganze kannst du über [RSS](/rss.xml) verfolgen. Unterwegs füge ich weitere Teile hinzu, und diese Karte wächst mit dem Blog.
