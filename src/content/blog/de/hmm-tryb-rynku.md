---
title: "Versteckte Markow-Modelle: der Marktmodus, den man nicht sieht"
lang: "de"
kind: "trading"
date: "2026-06-06"
excerpt: "Der Markt döst mal, dann dreht er durch, und der Schalter ist unsichtbar. Ein HMM ist ein ehrlicher Versuch zu raten, in welchem Modus wir gerade sind. Und eine Geschichte darüber, was diese Methode nicht kann."
key: "hmm-tryb-rynku"
slug: "ukryte-modele-markowa"
---

Der Markt verhält sich nicht die ganze Zeit gleich. Es gibt Wochen, in denen der Preis kaum zuckt. Es gibt Tage, an denen alles wie verrückt fliegt. Den Schalter, der das ändert, sieht man nicht. Man sieht nur die Wirkung, die Kerzen.

Ein verstecktes Markow-Modell, kurz HMM, ist ein Versuch, diesen Schalter zu erraten. Die Annahme ist einfach. Der Markt ist in einem von wenigen versteckten Modi, und was wir auf dem Chart haben, ist nur die Spur, die ein Modus auf dem Preis hinterlässt. Die ganze Kunst besteht darin, den Modus allein aus der Spur zu erraten.

## Was versteckt ist und was man sieht

Nennen wir diese Modi in einfachen Worten: Ruhe, Trend, Panik. Das sind die versteckten Zustände. Sie haben kein Lämpchen, das angeht. Der Markt sitzt einfach in einem davon und springt manchmal in einen anderen.

Was du siehst, sind die Beobachtungen: die Preisänderung, die Größe der Kerze, die Volatilität. Jeder Modus hinterlässt eine andere Spur. In der Ruhe sind die Kerzen klein. In der Panik riesig. Das Problem ist, dass dieselbe Bewegung zu zwei Modi auf einmal passen kann, und genau daher kommt die ganze Schwierigkeit.

![Versteckte Zustände Ruhe, Trend und Panik oben und beobachtete Kerzen unten, verbunden durch Pfeile von Übergängen und Emissionen](/de/blog/hmm/01-ukryte-obserwacje.svg)

Oben der Modus, den man nicht sieht. Unten das, was du wirklich auf dem Bildschirm hast. Das HMM ist die Brücke zwischen beidem.

## Warum „Markow"

Markow ist eine Annahme über das Gedächtnis, genauer gesagt über sein Fehlen. Das Modell nimmt an, dass es zum Erraten dessen, was gleich kommt, reicht zu wissen, wo du jetzt bist. Nicht die ganze Geschichte, nur der aktuelle Zustand.

> Morgen hängt von heute ab, nicht von dem ganzen Weg, der uns hierher gebracht hat.

Das klingt nach einer Vereinfachung, und es ist eine. Der Markt erinnert sich an mehr, als diese Regel sagt. Aber es ist eine Vereinfachung, die sich berechnen lässt, und ein berechenbares Modell ist manchmal mehr wert als ein Modell, das näher an der Wahrheit liegt und das niemand berechnen kann.

## Woher das kam

Andrej Markow war ein russischer Mathematiker. Anfang des zwanzigsten Jahrhunderts nahm er sich etwas scheinbar Belangloses vor: Buchstabenfolgen in Puschkins „Eugen Onegin". Er zählte, wie oft auf einen Vokal ein Konsonant folgt, und es kam heraus, dass das nächste Zeichen vor allem vom vorherigen abhängt. So entstand die Markow-Kette, eine Welt, in der die Zukunft vom Zustand jetzt abhängt und nicht von der ganzen Geschichte.

Das Wort „versteckt" kam viel später dazu. In den sechziger Jahren fügte Leonard Baum mit seinem Team eine Schicht hinzu, die man nicht direkt sieht, und erdachte einen Weg, sie allein aus den Beobachtungen herauszuziehen. Daher der Name des Lernalgorithmus: Baum und Welch. Die erste große Anwendung war nicht die Börse, sondern die Spracherkennung: der Computer hört Schallwellen und errät die versteckte Folge von Lauten. Dann wanderten dieselben Gleichungen in die Biologie, ins Lesen der DNA, und am Ende in die Märkte. Die Idee ist überall dieselbe. Du siehst die Wirkung, du errätst die versteckte Ursache.

## Übergänge: wie der Markt zwischen den Modi springt

Die Modi ändern sich, aber träge. Aus der Ruhe fällt man selten direkt in die Panik. Meist gibt es zuerst einen Trend, und erst dann bricht es zusammen. Diese Neigungen schreibt die Übergangsmatrix auf: für jeden Modus sagt sie, wie wahrscheinlich es ist, dass der Markt darin bleibt, und wie wahrscheinlich, dass er woanders hinspringt.

![Drei Zustände mit Schleifen und Übergangspfeilen, beschriftet mit Wahrscheinlichkeiten fürs Bleiben und Springen](/de/blog/hmm/02-graf-przejsc.svg)

Die dicken Schleifen sind „bleib im selben Modus". Die dünnen Pfeile sind Sprünge. Die Zahlen sind Beispiele, aber der Aufbau ist typisch: die Modi sind klebrig.

| von ↓ \ nach → | Ruhe | Trend | Panik |
|---|---|---|---|
| **Ruhe** | 0.94 | 0.05 | 0.01 |
| **Trend** | 0.07 | 0.83 | 0.10 |
| **Panik** | 0.05 | 0.15 | 0.80 |

Jede Zeile summiert sich zu eins. Das ist alles, was die Übergangsmatrix in sich hat: nur Neigungen zu bleiben oder zu wechseln.

## Emissionen: welche Spur jeder Modus hinterlässt

Der zweite Bestandteil sind die Emissionen. Für jeden Modus beschreiben sie, wie die Preisänderungen aussehen, die wir von ihm erwarten. In der Ruhe ist die Verteilung schmal, um die Null gebündelt. Im Trend ist sie zur einen Seite verschoben. In der Panik ist sie breit, mit dicken Rändern, weil große Bewegungen in beide Richtungen vorkommen.

![Drei Verteilungen der Preisänderung: Ruhe schmal um die Null, Trend verschoben, Panik breit mit dicken Rändern](/de/blog/hmm/03-emisje.svg)

Hier sitzt der Haken. Eine Bewegung, sagen wir plus 0,75 Prozent an einem Tag, passt zu allen drei Modi. Nur mit unterschiedlicher Wahrscheinlichkeit. Deshalb bist du dir aus einer einzelnen Kerze nie sicher. Ein Ersatz für Sicherheit kommt erst aus der ganzen Folge von Beobachtungen, nicht aus einem einzelnen Punkt.

## Drei Fragen, die ein HMM beantwortet

Mit Übergängen und Emissionen kann das Modell drei Fragen beantworten.

Erste: wie wahrscheinlich ist die Folge von Kerzen, die ich gesehen habe? Das erlaubt, Varianten zu vergleichen und zu sagen „diese erklärt die Daten besser als jene".

Zweite, die im Trading interessanteste: in welchem Modus war ich in jedem Moment? Das nennt sich Dekodierung. Aus den Beobachtungen allein rekonstruierst du den wahrscheinlichsten Pfad der versteckten Zustände.

![Ein Gitter von Zuständen über die Zeit mit einem hervorgehobenen goldenen Pfad, der wahrscheinlichsten Folge von Modi, rekonstruiert aus den Beobachtungen](/de/blog/hmm/04-krata-viterbi.svg)

In jedem Schritt konnte der Markt in jedem beliebigen Modus sein. Der Algorithmus (er heißt Viterbi) betrachtet alle möglichen Pfade und wählt den, der am besten erklärt, was man sieht. Die goldene Linie ist das Ergebnis.

Die dritte Frage: woher all diese Zahlen nehmen, wenn sie mir niemand gegeben hat? Aus den Daten. Das Modell stimmt selbst die Übergänge und Emissionen so ab, dass sie möglichst gut zur Geschichte passen (das macht der Algorithmus von Baum und Welch). Und genau „möglichst gut zur Geschichte passen" ist der Moment, in dem man sich am leichtesten selbst belügt.

## Die Matrixmethode

Das ganze Modell läuft auf drei Tabellen von Zahlen hinaus. Der Startvektor, mit welchem Modus wir beginnen. Die Übergangsmatrix A, die du oben gesehen hast. Und die Emissionsmatrix B, wie wahrscheinlich eine Bewegung in einem Modus ist. Das ist alles, drei Tabellen.

Das Beste daran ist, dass das Rechnen auch nur ein Multiplizieren von Tabellen ist. Du hältst einen „Glaubensvektor": drei Zahlen, die sagen, wie sehr du glaubst, in der Ruhe, im Trend und in der Panik zu sein. Eine neue Kerze kommt, und du machst zwei Schritte. Zuerst multiplizierst du den Vektor mit der Übergangsmatrix, denn der Markt konnte gesprungen sein. Dann mit der Chance, dass ein Modus genau diese Kerze hervorgebracht hätte. Das Ergebnis ist ein neuer Glaubensvektor.

![Ein Schritt der Matrixmethode: der Glaubensvektor multipliziert mit der Übergangsmatrix und mit den Emissionswahrscheinlichkeiten der neuen Kerze ergibt den aktualisierten Glaubensvektor](/de/blog/hmm/06-metoda-macierzowa.svg)

Ein Schritt: alter Glaube mal Übergangsmatrix, mal Chance der neuen Kerze in jedem Modus, gleich neuer Glaube. Dann dasselbe für die nächste Kerze.

Das nennt sich Vorwärtsalgorithmus. Die Dekodierung, dieser goldene Pfad durch das Gitter, ist sein schlauerer Vetter: statt über alle Wege zu summieren, merkt er sich in jedem Schritt nur den besten. Der Motor ist aber derselbe, Matrixmultiplikation Schritt für Schritt. Deshalb rechnet ein HMM auch auf einer langen Geschichte schnell, und deshalb lässt sich das Ganze in drei Tabellen fassen und nicht in hundert „wenn, dann"-Regeln.

## Was es auf dem Chart bringt

Du nimmst die Geschichte, lässt das Modell sie in Modi zerlegen und färbst den Chart mit dem, was herauskam.

![Derselbe Preis-Chart, gefärbt nach dem Modus, den das Modell im jeweiligen Abschnitt für am wahrscheinlichsten hielt](/de/blog/hmm/05-wykres-rezimy.svg)

Derselbe Chart, nur nach Modus bemalt. Und das ist wirklich angenehm fürs Auge. Man sieht sofort, wo der Markt döste und wo er brannte. Nur sind „angenehm fürs Auge" und „verdient Geld" zwei völlig verschiedene Dinge, dazu gleich mehr.

## Die Grenzen der Methode, und wofür sie nicht da ist

Das Wichtigste ist, nicht zu verwechseln, wofür dieses Modell überhaupt da ist. Ein HMM zeigt keine Richtung. Es sagt nicht „kauf" und nicht „der Preis geht hoch". Schon vom Aufbau her beantwortet es eine andere Frage: welchen Typs der Markt jetzt ist.

Die zweite Sache ist die Verzögerung, und auch das ist kein Fehler, sondern eine Eigenschaft. Damit das Modell entscheidet, dass ein Trend begonnen hat, muss dieser Trend schon eine Weile gelaufen sein, denn das Etikett kommt aus einer Folge von Beobachtungen, nicht aus einer einzelnen Kerze. Wer eine Erkennung der Wende genau im Wendepunkt verspricht, verkauft eine Illusion. Das HMM funktioniert so nicht, und besser erwartet man das nicht von ihm.

Das fügt sich zu einem stimmigen Ganzen mit einer harten Wahrheit über den Markt: es ist leichter, sinnvoll zu beurteilen, wie groß eine Bewegung wird, als in welche Richtung sie geht. Das HMM spielt genau in dieser ersten Liga. Es spricht über den Charakter und die Temperatur des Marktes, nicht über die Richtung. Und genau dort, als Maß für den Charakter, ist es wirklich nützlich.

## Wie man es also ehrlich benutzt

Da es kein Orakel ist, wofür taugt es? Als Kontext, nie als Befehl. Ein paar Anwendungen, die wirklich Sinn ergeben:

- **Ein Risikofilter.** Im Modus „Panik" gehst du mit der Positionsgröße runter oder steigst gar nicht ein. Nicht weil du weißt, wohin der Preis geht, sondern weil du weißt, dass es ruckeln wird.
- **Das Werkzeug zum Wetter passend wählen.** Eine Strategie, die im Trend Geld verdient, zahlt in der Ruhe nur den Spread. Der Modus deutet an, wann man sie einschaltet und wann man verzichtet.
- **Eine ehrliche Oberfläche.** Eine Farbe auf dem Chart, die sagt „pass auf, heute ein anderer Markt". Das ist manchmal mehr wert als zehn blinkende Pfeile, die ein Signal vortäuschen.

Dazu zwei Fallen, in die man leicht tappt. Die erste ist die Zahl der Modi. Drei ist meine Wahl, keine offenbarte Wahrheit. Gib dem Modell fünf, es findet fünf, auch hübsch gefärbt. Die zweite ist die Stabilität. Dieselben Daten mit einem anderen Start können andere Modi ergeben. Wenn das Etikett sich bei jeder Berührung ändert, ist das kein Wissen über den Markt, nur eine Anpassung an das Rauschen.

## Das Fazit

Ein verstecktes Markow-Modell ist keine Maschine, um den Preis vorherzusagen. Es ist ein Weg, nüchtern zu sagen, in welchem Markt wir jetzt sind, anhand der Spuren allein, die dieser Markt hinterlässt. Als Kontext benutzt kann es helfen. Als Orakel der Richtung benutzt kostet es.

Wie immer endet es gleich. Bevor du glaubst, dass etwas weiß, teste es an Daten, die es noch nicht gesehen hat. Eine hübsche Farbe auf dem Chart ist erst der Anfang der Frage, nicht die Antwort.
