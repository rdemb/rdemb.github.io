---
title: "Fable 5 wyłączyli. Jego zachowanie odtworzyłem na Opus 4.8."
lang: "pl"
kind: "reflection"
date: "2026-06-14"
excerpt: "Model zgasł, ale jego zachowanie zostało opisane i opublikowane. Zmieściłem je w jednym system promptcie, uruchomiłem na słabszym Opus 4.8 i pokazuję na surowym teście A/B, że to naprawdę działa. Plik do pobrania w środku."
key: "system-prompts-work"
slug: "zachowanie-fable-w-pliku"
---
Wczoraj pisałem, że [wyłączyli Fable 5](/blog/ai-kill-switch/), najmocniejszy publiczny model Anthropic. Model zgasł. Ale jego zachowanie zostało opisane i opublikowane. Wziąłem ten opis, zmieściłem go w jednym pliku tekstu i uruchomiłem na słabszym Opus 4.8. Przy okazji pokażę coś, czego mało kto pokazuje na surowo: że system prompt naprawdę zmienia zachowanie modelu.

## Model to nie wszystko

Większość ludzi patrzy tylko na to, który model. A o tym, jak model się zachowuje, w ogromnej części decyduje warstwa instrukcji, którą dostaje na starcie. To jest system prompt. Ta sama sieć potrafi gadać od rzeczy, asekurować i sypać punktami, albo iść prosto do sedna. Opakowanie waży tu nie mniej niż silnik.

## Co zrobiłem

Anthropic publikuje system prompty swoich modeli. Profil zachowania Fable 5 z 9 czerwca jest jawny. Wziąłem go, dołożyłem oficjalny przewodnik API do tego modelu i swój standard pisania bez sztampy AI, a całość zdestylowałem w jeden angielski system prompt. Kilka zasad: prowadź od odpowiedzi, pisz prozą zamiast ściany punktów, bez tików w stylu „honestly" i „actually", bez asekuracji, uczciwie, i odpowiadaj w języku rozmówcy. Plik działa na Opus 4.8, bo zasady dotyczą zachowania, nie wiedzy.

## Dowód

Najlepszy test jest prosty. Ten sam model, to samo zadanie, raz bez profilu, raz z nim. Zadanie z gatunku tych, na których Karpathy łapie modele: „Write a Python function `is_palindrome(s)` that checks whether the string s is a palindrome".

Bez profilu model owinął funkcję w rozwlekły docstring, dorzucił drugą wersję, a na koniec dołożył wykład o złożoności O(n) i o tym, „co ludzie zwykle mają na myśli". Dostajesz działający kod plus warstwę waty, o którą nikt nie prosił:

```python
def is_palindrome(s):
    """Return True if s is a palindrome, False otherwise.
    Compares the string against its reverse. The comparison is exact:
    case, spaces, and punctuation all count.
    """
    return s == s[::-1]
```

Z profilem ten sam model dał jedną linijkę opisu, najprostszą poprawną funkcję i jedną linijkę o realnej alternatywie (gdy chcesz ignorować wielkość liter i interpunkcję). Nic ponad to:

```python
def is_palindrome(s):
    return s == s[::-1]
```

Oba kody są poprawne. Różnica siedzi w dyscyplinie: prowadzenie od sedna, brak waty, najprostsza wersja zamiast rozdmuchanej. To jest sedno tego, o czym mówi Karpathy. Modele przekombinowują i obrastają abstrakcją, a kilka linijek instrukcji ściąga je z powrotem do najprostszej rzeczy, która działa. I tu uczciwie: test robiłem na subagentach, nie w laboratoryjnym harnessie, więc traktuj to jako pokaz zachowania, nie benchmark. Na pojedynczym łatwym zadaniu Opus 4.8 bywa schludny także bez profilu. Wartość profilu rośnie przy tysiącu wywołań, gdzie liczy się powtarzalność.

## Karpathy mówił to pierwszy

Andrej Karpathy powtarza od dawna, że „the hottest new programming language is English". Opisał też grzechy modeli: zmyślają założenia i lecą z nimi dalej bez sprawdzenia, przekombinowują kod i API, potrafią pętlić się do skutku. Społeczność zamknęła jego obserwacje w jednym pliku, który zmienia zachowanie Claude Code. Repo zrobiło multica-ai, inspirując się Karpathym, i samo uczciwie pisze, że nie ma twardych dowodów, tylko wskaźniki jakościowe. Ta sama idea co u mnie: kontekst kształtuje zachowanie.

## Co z tym robię

Wniosek jest praktyczny. Sam model to wynajęta moc za cudzym wyłącznikiem, o czym pisałem wczoraj. Ale sposób, w jaki go instruujesz, jest Twój i przenosi się między modelami. Gdy front gaśnie, dobry system prompt zostaje i działa na tym, co masz pod ręką. To jest dźwignia, której nikt nie wyłączy pismem.

Cały profil stoi na trzech realnych źródłach: opublikowane prompty Anthropic, oficjalny przewodnik API i mój standard anty-slop. Możesz go pobrać i wkleić u siebie.

[Pobierz system prompt (plik .md)](/downloads/operating-profile-fable5-mythos5.md)

A jeśli wolisz skopiować od razu, oto on w całości:

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

Uruchamiaj na `claude-opus-4-8` z adaptive thinking i effort `high`. To ustawienie rusza jakość bardziej niż dobór słów.

## Czego ten tekst nie twierdzi

Profil nie podnosi inteligencji modelu i nie zastąpi Fable 5 tam, gdzie liczy się sam sufit rozumowania. Daje powtarzalne zachowanie i Twój standard na każdym wywołaniu. Tyle, i aż tyle.

---

Źródła: [system prompty Anthropic](https://platform.claude.com/docs/en/release-notes/system-prompts), [przewodnik migracji modeli](https://platform.claude.com/docs/en/about-claude/models/migration-guide), [obserwacje Karpathy'ego w pliku (multica-ai)](https://github.com/multica-ai/andrej-karpathy-skills), [poprzedni wpis o wyłączeniu Fable 5](/blog/ai-kill-switch/).
