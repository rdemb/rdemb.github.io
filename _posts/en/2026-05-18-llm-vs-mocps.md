---
title: "How an LLM differs from MOCPS"
lang: en
kind: reflection
pl_url: /pl/2026/05/18/llm-a-mocps/
de_url: /de/2026/05/18/llm-vs-mocps/
excerpt: "An LLM models language and statistical knowledge in text. MOCPS tests a tiny predictive object state in a controlled pixel world."
---

An LLM and MOCPS live at very different scales.

An LLM is a large language model. It learns to predict text tokens over huge corpora. Its strength is language: summarization, code, dialogue, planning, and pattern recognition in text. It is broad as a language interface, but its primary medium is tokenized text.

MOCPS is not trying to do the same thing. It is a small research diagnostic. It runs in simple procedural worlds where one narrow question can be measured: does an object-centric latent state predict a future position better than persistence?

Key differences:

| area | LLM | MOCPS |
| --- | --- | --- |
| medium | text / tokens | tiny pixel images |
| scale | huge models and datasets | CPU-friendly toy diagnostic |
| goal | language and text-pattern modeling | predictive object-state test |
| baseline | task-dependent | explicit position persistence |
| result | answer quality / downstream tasks | position MAE and winrate vs baseline |
| claim | broad language interface | narrow diagnostic result |

An LLM can help me write code, organize experiments, and inspect mistakes. MOCPS is the object of study: a small attempt to understand when a predictive representation actually carries state, and when it only looks plausible.

I do not treat MOCPS as a competitor to LLMs. It asks a different kind of question. An LLM is a language tool. MOCPS is a diagnostic microscope for object-centric predictive state.
