---
title: "MOCPS: learned occlusion gate"
lang: de
kind: project
project: mocps
pl_url: /pl/2026/05/19/mocps-learned-occlusion-gate/
en_url: /en/2026/05/19/mocps-learned-occlusion-gate/
excerpt: "Kurze Okklusion trennte einfache Memory von prädiktiver Memory. Ein kleines learned Gate reproduzierte das handcodierte prädiktive Verhalten auf dem geprüften Grid."
---

Nach dem Crossing-Object-Test war die nächste Frage einfach: Was passiert, wenn zwei ähnliche Objekte nicht nur kreuzen, sondern kurz zu einer sichtbaren Komponente verschmelzen?

Das ist schwieriger als normales Crossing. Wenn beide Objekte sichtbar bleiben, reicht Zentroid-Kontinuität. Während einer kurzen Okklusion wird die Beobachtung mehrdeutig: Das Modell muss eine Identitätshypothese halten, ohne volle Bestätigung aus dem Bild.

Audit-Ergebnis:

- frozen nearest / velocity / learned memory: `15/20`
- frozen velocity assignment nach Okklusion: `0.000`
- handcodierte predictive occlusion memory: `20/20`
- learned recurrent occlusion gate: `20/20`
- learned gate assignment während Okklusion: `1.000`
- learned gate assignment nach Okklusion: `1.000`
- identity switch rate: `0.000`
- gate final update accuracy: `1.000`

Der Schluss ist eng, aber nützlich: einfache Komponenten-Memory reicht nicht, wenn das Bild zwei Objekte kurz in eine Komponente kollabieren lässt. Der Zustand muss den Slot weiterrollen, wenn die Beobachtung nicht eindeutig bindbar ist. Ein kleines learned Gate lernte diese Entscheidung aus image-derived Pseudo-Targets: wann die Beobachtung vertraut wird und wann der Zustand aus Memory vorhergesagt wird.

Das ist weiterhin kein vollständiges trainable Slot Attention. Das Gate sitzt auf dem bestehenden image-derived slot state und learned memory scorer. Ich behaupte keine breite Okklusionsrobustheit. Der nächste Test sollte unbequemer sein: längere Okklusion und Beschleunigung, wo konstante Geschwindigkeit keine einfache Annahme mehr ist.
