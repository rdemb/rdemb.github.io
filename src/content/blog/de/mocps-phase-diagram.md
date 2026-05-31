---
title: "Ich habe mein ML-Experiment wiederbelebt und gesucht, wo es bricht"
lang: "de"
kind: "project"
date: "2026-05-31"
excerpt: "Ein altes Projekt über die Bewegungsvorhersage eines Objekts. Ich habe es nach Monaten zurückgeholt und ihm die härteste Frage gestellt, die ich konnte."
key: "mocps-phase-diagram"
slug: "mocps-phase-diagram"
---

Ich habe ein kleines Forschungsprojekt, MOCPS. Es fragt eine enge Sache: Kann ein winziges gelerntes Modell ein Objekt „im Kopf behalten", wenn es hinter etwas verschwindet und zurückkommt. Objektpermanenz, dasselbe, was ein Einjähriger lernt.

Nach Monaten kehrte ich zum Code zurück, richtete die Umgebung ein und ließ es erneut laufen. Zuerst tat ich etwas, das viele stolze Ergebnisse ruiniert: Ich fügte **faire Baselines** hinzu.

## Die erste Wahrheit tut weh

Mein Modell „schlägt Persistenz" in 222 von 222 Fällen. Klingt großartig, bis du fragst: Was ist mit einer dümmeren Baseline? Es stellte sich heraus, dass ein triviales „nimm konstante Geschwindigkeit an" nahezu perfekt ist und mein Modell dagegen schlechter abschneidet. Also bedeutete „schlägt Persistenz" nichts. Persistenz nimmt an, das Objekt stehe still, also ist sie Wahrsagerei für Naive.

## Wo es zu zählen beginnt

Wert entsteht erst dort, wo die Beobachtung selbst nicht mehr ausreicht: unter **Verdeckung**. Wenn das Objekt verschwindet, verliert die Velocity-Baseline seine Identität bei der Rückkehr. Das gelernte Gedächtnis hält sie perfekt. Das war vorhersehbar, aber ein handkodiertes Gedächtnis tat es genauso gut, also gewann Struktur, nicht Lernen.

Dann erreichte ich den schwersten Fall: das Objekt **wechselt die Richtung, während es verborgen ist**. Hier scheitert Velocity, das handkodierte Gedächtnis scheitert, und das **gelernte ist zu 100% richtig**. Das ist die einzige Stelle, an der Lernen sowohl die Physik als auch die Struktur schlägt. Das kleine Modell hat etwas über Dynamik gelernt, das einfache Extrapolation nicht kann.

## Und hier bricht es

Ich werde dir nicht sagen, dass alles funktioniert, denn das tut es nicht. Unter starker Beschleunigung und kurzer Verdeckung **bricht** das gelernte Gedächtnis auf 3% Genauigkeit ein, schlechter als die dumme Baseline. Mit längerer Verdeckung ist es wieder gut. Diesen seltsamen, nicht-monotonen Einbruch verstehe ich noch nicht.

Und genau deshalb schreibe ich darüber. Ein Ergebnis, das seine Fehlerstelle versteckt, ist keine Wissenschaft, sondern Werbung. Ich habe ein sauberes, auf CPU reproduzierbares Diagramm, wann ein gelernter prädiktiver Zustand Objektpermanenz gibt und wann er auseinanderfällt. Das ist kein „Durchbruch". Es ist eine ehrliche Karte, und auf ehrlichen Karten baut man etwas Echtes.
