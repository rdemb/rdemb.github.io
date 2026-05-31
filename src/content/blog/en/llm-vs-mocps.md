---
title: "How an LLM differs from MOCPS"
lang: "en"
kind: "reflection"
date: "2026-05-18"
excerpt: "An LLM helps me think and write code. MOCPS is a small motion-prediction test. Different tools, different questions."
key: "llm-vs-mocps"
slug: "llm-vs-mocps"
---
It is easy to put LLMs and MOCPS in the same bucket because both touch models and prediction. That would be misleading.

An LLM is a tool for working with language and code. It helps summarize, plan, inspect mistakes, organize experiments, and move from an idea to a running sketch faster. Its medium is tokens: text, instructions, program fragments, descriptions.

MOCPS is not trying to be that kind of tool. It is a small research diagnostic. It runs in simple pixel worlds where one narrow question can be measured: does an object representation predict a future position better than persistence?

Key differences:

| area | LLM | MOCPS |
| --- | --- | --- |
| medium | text / tokens | tiny pixel images |
| scale | huge models and datasets | CPU-friendly toy diagnostic |
| goal | language, code, and text-pattern work | predictive object-state test |
| baseline | task-dependent | explicit position persistence |
| result | answer quality / downstream tasks | position MAE and winrate vs baseline |
| claim | broad language interface | narrow diagnostic result |

The simplest split is this: an LLM helps me build and think; MOCPS is one of the things I build and test.

I do not treat MOCPS as a competitor to LLMs. It asks a different kind of question at a different scale. An LLM is a broad language interface. MOCPS is a narrow diagnostic test: it should show when a predictive object state works better than a simple baseline.
