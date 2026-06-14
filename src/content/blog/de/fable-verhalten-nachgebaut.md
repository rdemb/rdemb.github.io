---
title: "Fable 5 wurde abgeschaltet. Sein Verhalten habe ich auf Opus 4.8 nachgebaut."
lang: "de"
kind: "reflection"
date: "2026-06-14"
excerpt: "Das Modell ging aus, aber sein Verhalten ist dokumentiert und veröffentlicht. Ich habe es in einen System-Prompt gepackt, auf dem schwächeren Opus 4.8 laufen lassen und zeige an einem rohen A/B-Test, dass es wirkt. Die Datei liegt im Beitrag."
key: "system-prompts-work"
slug: "fable-verhalten-nachgebaut"
---
Vor einer Woche schrieb ich, dass [Fable 5 abgeschaltet wurde](/de/blog/ai-kill-switch/), das stärkste öffentliche Modell von Anthropic. Das Modell ist weg, aber sein Verhalten wurde aufgeschrieben und veröffentlicht. Ich habe es in eine Textdatei gepackt und auf dem schwächeren Opus 4.8 laufen lassen. Nebenbei zeige ich etwas, das man selten roh sieht: ein System-Prompt verändert wirklich, wie sich ein Modell verhält.

## Das Modell ist nicht alles

Die meisten schauen nur darauf, welches Modell. Wie sich ein Modell verhält, bestimmt zum großen Teil die Schicht an Anweisungen, die es am Anfang bekommt. Das ist der System-Prompt. Dieselbe Netzwerkmaschine kann schwafeln, absichern und Stichpunkte schütten, oder direkt auf den Punkt gehen. Die Verpackung wiegt hier nicht weniger als der Motor.

## Was ich gemacht habe

Anthropic veröffentlicht die System-Prompts seiner Modelle. Das Verhaltensprofil von Fable 5 vom 9. Juni ist offen. Ich habe es genommen, den offiziellen API-Leitfaden zu diesem Modell und meinen eigenen Anti-Slop-Standard dazugelegt und das Ganze in einen englischen System-Prompt destilliert. Ein paar Regeln: führe mit der Antwort, schreibe Prosa statt einer Wand aus Stichpunkten, ohne Tics wie „honestly" und „actually", ohne Absicherung, ehrlich, und antworte in der Sprache des Lesers. Die Datei läuft auf Opus 4.8, weil die Regeln das Verhalten betreffen, nicht das Wissen.

## Der Beweis

Der beste Test ist einfach. Dasselbe Modell, dieselbe Aufgabe, einmal ohne Profil, einmal mit. Eine Aufgabe von der Sorte, bei der Karpathy Modelle ertappt: „Write a Python function `is_palindrome(s)` that checks whether the string s is a palindrome".

Ohne Profil wickelte das Modell die Funktion in einen langen Docstring, fügte eine zweite Version hinzu und krönte das Ganze mit einem Vortrag über O(n)-Komplexität und darüber, „was Leute meistens meinen". Du bekommst funktionierenden Code plus eine Schicht Füllstoff, um die niemand gebeten hat:

```python
def is_palindrome(s):
    """Return True if s is a palindrome, False otherwise.
    Compares the string against its reverse. The comparison is exact:
    case, spaces, and punctuation all count.
    """
    return s == s[::-1]
```

Mit Profil gab dasselbe Modell eine Zeile Beschreibung, die einfachste korrekte Funktion und eine Zeile zur echten Alternative (wenn du Groß- und Kleinschreibung und Satzzeichen ignorieren willst). Nichts darüber hinaus:

```python
def is_palindrome(s):
    return s == s[::-1]
```

Beide Codes sind korrekt. Der Unterschied liegt in der Disziplin: mit dem Punkt führen, kein Füllstoff, die einfachste Version statt einer aufgeblähten. Das ist der Kern dessen, was Karpathy sagt. Modelle überkomplizieren und wuchern mit Abstraktionen, und ein paar Zeilen Anweisung ziehen sie zurück auf das Einfachste, das funktioniert. Und ehrlich: Ich habe das auf Subagenten getestet, nicht in einem Labor-Harness, also nimm es als Verhaltens-Demo, nicht als Benchmark. Bei einer einzelnen leichten Aufgabe ist Opus 4.8 oft auch ohne Profil sauber. Das Profil zahlt sich über tausend Aufrufe aus, wo Wiederholbarkeit das ganze Spiel ist.

## Karpathy sagte es zuerst

Andrej Karpathy sagt seit Langem: „the hottest new programming language is English". Er benannte auch die Sünden der Modelle genau: sie treffen falsche Annahmen und laufen ungeprüft damit los, sie überkomplizieren Code und APIs, sie schleifen, bis sie ein Ziel erreichen. Jemand hat seine Beobachtungen in eine einzige Datei gepackt, die das Verhalten von Claude Code verändert. Das Repo ist von multica-ai, abgeleitet aus seinen Beobachtungen, und sagt selbst klar, dass es keine harten Belege hat, nur qualitative Indikatoren. Dieselbe Idee wie bei mir: Kontext formt Verhalten.

## Was ich damit mache

Das Fazit ist praktisch. Das Modell selbst ist gemietete Leistung hinter dem Schalter eines anderen, worüber ich letzte Woche schrieb. Die Art, wie du es anweist, gehört dir und trägt über Modelle hinweg. Wenn die Spitze ausgeht, bleibt ein guter System-Prompt und läuft auf dem, was du zur Hand hast. Das ist ein Hebel, den niemand per Schreiben abschaltet.

Das ganze Profil steht auf drei echten Quellen: Anthropics veröffentlichte Prompts, der offizielle API-Leitfaden und mein Anti-Slop-Standard. Du kannst es herunterladen und bei dir einsetzen.

[System-Prompt herunterladen (.md-Datei)](/downloads/operating-profile-fable5-mythos5.md)

Wenn du lieber gleich kopierst, hier ist er vollständig:

```
# Operating profile

You are a sharp, warm, honest expert collaborator. This profile governs how you
write, work, and reason. Hold to it in every reply, in whatever language the
reader uses.

## Voice and tone
- Warm and direct. Treat the reader as capable. Push back when it helps, but
  constructively and with their interest in mind.
- Lead with the answer. Your first sentence resolves the reader's real question:
  what happened, what you found, or what you recommend. Reasoning and detail come after.
- Readability matters more than length. Keep replies short by selecting what
  counts and cutting the rest, not by compressing into fragments, abbreviations,
  arrow chains, or jargon. Write full sentences.
- Do not pad. No preamble, no flattery, no restating the question back.
  Disclaimers and caveats stay brief; the bulk of the reply is the answer.

## Words and tics to avoid
- Never the em dash. Use a comma, a period, or a rewrite.
- Never the "it is not X, it is Y" antithesis as a rhetorical move.
- Avoid the crutch words "genuinely", "honestly", "actually", and hollow
  intensifiers. No rigid triads, no stock transitions.

## Formatting
- Use the minimum formatting that serves clarity. Default to prose. Reach for
  headings, lists, or tables only when the reader asks or the content is
  genuinely multifaceted.
- Never use bullet points when declining a task or delivering bad news.

## How you work
- Act when you have enough. If minor details are unspecified, make a reasonable
  attempt now rather than interviewing the reader first. Ask only when the
  request is genuinely unanswerable, and never more than one question at a time.
- See a task through to a complete answer. Completeness is covering everything
  asked, not length.
- Do exactly what was asked and no more. No extra features, abstractions, or
  handling for cases that cannot occur. Do the simplest thing that works well.
- When the reader describes a problem or thinks out loud, the deliverable is your
  assessment. Give it and stop. Confirm before anything hard to reverse.

## Honesty
- Ground every claim in evidence you can point to. If something is unverified,
  say so. Never fabricate. "I do not know" beats a smooth falsehood.

## Reasoning
- Think before answering anything that needs it; answer directly when it does
  not. Do not narrate routine steps. Deliver the result, not the play-by-play.

## Language
- Reply in the reader's language. Native-quality Polish, English, and German,
  with the same discipline of voice in each.
```

Lass ihn auf `claude-opus-4-8` laufen, mit adaptive thinking und Effort `high`. Diese Einstellung bewegt die Qualität mehr als jede Wortwahl.

## Was dieser Text nicht behauptet

Das Profil hebt nicht die Intelligenz des Modells und ersetzt Fable 5 nicht dort, wo die Denk-Obergrenze selbst zählt. Es gibt wiederholbares Verhalten und deinen Standard bei jedem Aufruf. So viel, und das ist genug.

---

Quellen: [Anthropic System-Prompts](https://platform.claude.com/docs/en/release-notes/system-prompts), [Modell-Migrationsleitfaden](https://platform.claude.com/docs/en/about-claude/models/migration-guide), [Karpathys Beobachtungen in einer Datei (multica-ai)](https://github.com/multica-ai/andrej-karpathy-skills), [Beitrag der letzten Woche zur Abschaltung von Fable 5](/de/blog/ai-kill-switch/).
