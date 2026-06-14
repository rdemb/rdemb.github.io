---
title: "They switched Fable 5 off. I rebuilt its behavior on Opus 4.8."
lang: "en"
kind: "reflection"
date: "2026-06-14"
excerpt: "The model went dark, but its behavior was documented and published. I folded that into one system prompt, ran it on the weaker Opus 4.8, and a raw A/B shows it works. The file is in the post."
key: "system-prompts-work"
slug: "rebuilt-fable-behavior"
---
A week ago I wrote that [Fable 5 was switched off](/en/blog/ai-kill-switch/), Anthropic's strongest public model. The model is gone, but its behavior was written down and published. I took that, folded it into one text file, and ran it on the weaker Opus 4.8. Along the way I will show something people rarely show raw: a system prompt really does change how a model behaves.

## The model is not the whole story

Most people look only at which model. How a model behaves is set, in large part, by the layer of instructions it gets at the start. That is the system prompt. The same network can ramble, hedge, and dump bullet lists, or go straight to the point. The wrapper weighs as much as the engine.

## What I did

Anthropic publishes the system prompts for its models. The Fable 5 behavioral profile from June 9 is public. I took it, added the official API guide for that model and my own anti-slop standard, and distilled the lot into one English system prompt. A few rules: lead with the answer, write prose instead of a wall of bullets, drop the tics like "honestly" and "actually", no hedging, stay honest, and reply in the reader's language. The file runs on Opus 4.8 because the rules govern behavior, not knowledge.

## The proof

The best test is simple. Same model, same task, once without the profile, once with it. A task of the kind Karpathy catches models on: "Write a Python function `is_palindrome(s)` that checks whether the string s is a palindrome".

Without the profile, the model wrapped the function in a long docstring, added a second version, and capped it with a lecture on O(n) complexity and on "what people usually mean". You get working code plus a layer of padding nobody asked for:

```python
def is_palindrome(s):
    """Return True if s is a palindrome, False otherwise.
    Compares the string against its reverse. The comparison is exact:
    case, spaces, and punctuation all count.
    """
    return s == s[::-1]
```

With the profile, the same model gave one line of description, the simplest correct function, and one line about the real alternative (when you want to ignore case and punctuation). Nothing beyond that:

```python
def is_palindrome(s):
    return s == s[::-1]
```

Both are correct. The difference is discipline: lead with the point, no padding, the simplest version instead of an inflated one. This is the core of what Karpathy keeps saying. Models overcomplicate and grow abstractions, and a few lines of instruction pull them back to the simplest thing that works. To be straight: I ran this on subagents, not a lab harness, so read it as a behavior demo, not a benchmark. On a single easy task Opus 4.8 is often tidy even without the profile. The profile earns its keep across a thousand calls, where consistency is the whole game.

## Karpathy said it first

Andrej Karpathy has said for a while that "the hottest new programming language is English". He also named the model sins precisely: they make wrong assumptions and run with them without checking, they overcomplicate code and APIs, they will loop until they hit a goal. Someone folded his observations into a single file that changes how Claude Code behaves. The repo is by multica-ai, derived from his observations, and it states plainly that it has no hard evidence, only qualitative indicators. The same idea as mine: context shapes behavior.

## What I do with this

The takeaway is practical. The model itself is rented power behind someone else's switch, which is what I wrote about last week. The way you instruct it is yours, and it carries across models. When the frontier goes dark, a good system prompt stays and runs on whatever you have at hand. That is leverage nobody switches off with a memo.

The whole profile rests on three real sources: Anthropic's published prompts, the official API guide, and my anti-slop standard. You can download it and paste it into your own setup.

[Download the system prompt (.md file)](/downloads/operating-profile-fable5-mythos5.md)

If you would rather copy it now, here it is in full:

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

Run it on `claude-opus-4-8` with adaptive thinking and effort `high`. That setting moves quality more than any wording.

## What this post does not claim

The profile does not raise the model's intelligence and will not replace Fable 5 where the reasoning ceiling itself is what matters. It gives repeatable behavior and your standard on every call. That much, and that is plenty.

---

Sources: [Anthropic system prompts](https://platform.claude.com/docs/en/release-notes/system-prompts), [model migration guide](https://platform.claude.com/docs/en/about-claude/models/migration-guide), [Karpathy's observations in a file (multica-ai)](https://github.com/multica-ai/andrej-karpathy-skills), [last week's post on Fable 5 being switched off](/en/blog/ai-kill-switch/).
