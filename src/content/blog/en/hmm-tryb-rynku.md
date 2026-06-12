---
title: "Hidden Markov models: the market mode you cannot see"
lang: "en"
kind: "trading"
date: "2026-06-06"
excerpt: "The market sometimes dozes and sometimes goes wild, and the switch is invisible. An HMM is an honest attempt to guess which mode we are in. And a story about what this method cannot do."
key: "hmm-tryb-rynku"
slug: "ukryte-modele-markowa"
---

The market does not behave the same way all the time. There are weeks when the price barely moves. There are days when everything flies around like crazy. The switch that changes this is invisible. You only see the result, the candles.

A hidden Markov model, HMM for short, is an attempt to guess that switch. The assumption is simple. The market is in one of a few hidden modes, and what we have on the chart is only the trace that a given mode leaves on the price. The whole art is to guess the mode from the trace alone.

## What is hidden and what you see

Let us name these modes in plain terms: Calm, Trend, Panic. These are the hidden states. They have no light that turns on. The market simply sits in one of them and sometimes jumps to another.

What you see are the observations: the price change, the size of the candle, the volatility. Each mode leaves a different trace. In Calm the candles are small. In Panic huge. The trouble is that the same move can fit two modes at once, and that is exactly where the whole difficulty comes from.

![Hidden states Calm, Trend and Panic at the top and observed candles at the bottom, joined by arrows of transitions and emissions](/en/blog/hmm/01-ukryte-obserwacje.svg)

At the top, the mode you cannot see. At the bottom, what you actually have on the screen. The HMM is a bridge between the two.

## Why "Markov"

Markov is an assumption about memory, or rather about its absence. The model takes it that to guess what comes next, it is enough to know where you are now. Not the whole history, just the current state.

> Tomorrow depends on today, not on the whole road that got us here.

It sounds like a simplification and it is one. The market remembers more than this rule says. But it is a simplification you can compute, and a computable model is sometimes worth more than a model closer to the truth that nobody can compute.

## Where it came from

Andrey Markov was a Russian mathematician. In the early twentieth century he took up something seemingly trivial: sequences of letters in Pushkin's "Eugene Onegin". He counted how often a consonant follows a vowel, and it turned out the next character depends mostly on the previous one. That is how the Markov chain was born, a world in which the future depends on the state now, not on the whole history.

The word "hidden" was added much later. In the 1960s Leonard Baum and his team added a layer you do not see directly, and worked out a way to pull it out of the observations alone. Hence the name of the learning algorithm: Baum and Welch. The first big application was not the stock market but speech recognition: the computer hears sound waves and guesses the hidden sequence of phonemes. Then the same equations moved into biology, into reading DNA, and finally into markets. The idea is everywhere the same. You see the result, you guess the hidden cause.

## Transitions: how the market jumps between modes

The modes change, but lazily. From Calm you rarely fall straight into Panic. Usually there is a trend first, and only then it falls apart. These tendencies are written in the transition matrix: for each mode it says how likely the market is to stay in it, and how likely it is to jump elsewhere.

![Three states with loops and transition arrows labelled with probabilities of staying and jumping](/en/blog/hmm/02-graf-przejsc.svg)

The thick loops are "stay in the same mode". The thin arrows are jumps. The numbers are examples, but the layout is typical: modes are sticky.

| from ↓ \ to → | Calm | Trend | Panic |
|---|---|---|---|
| **Calm** | 0.94 | 0.05 | 0.01 |
| **Trend** | 0.07 | 0.83 | 0.10 |
| **Panic** | 0.05 | 0.15 | 0.80 |

Each row sums to one. That is all the transition matrix has inside: just tendencies to stay or to change.

## Emissions: what trace each mode leaves

The second component is the emissions. For each mode they describe what the price changes we expect from it look like. In Calm the distribution is narrow, clustered around zero. In Trend it is shifted to one side. In Panic it is wide, with fat tails, because big moves happen in both directions.

![Three distributions of price change: Calm narrow around zero, Trend shifted, Panic wide with fat tails](/en/blog/hmm/03-emisje.svg)

Here sits the catch. One move, say plus 0.75 percent over a day, fits all three modes. Only with different probability. That is why from a single candle you are never sure. A substitute for certainty comes only from the whole sequence of observations, not from a single point.

## Three questions an HMM answers

With transitions and emissions, the model can answer three questions.

First: how likely is the sequence of candles I saw? This lets you compare variants and say "this one explains the data better than that one".

Second, the most interesting in trading: which mode was I in at each moment? This is called decoding. From the observations alone you reconstruct the most likely path of the hidden states.

![A lattice of states over time with a highlighted golden path, the most likely sequence of modes reconstructed from the observations](/en/blog/hmm/04-krata-viterbi.svg)

At every step the market could have been in any mode. The algorithm (it is called Viterbi) considers all possible paths and picks the one that best explains what you see. The golden line is the result.

The third question: where do all these numbers come from if nobody gave them to me? From the data. The model itself tunes the transitions and emissions to fit the history as well as possible (the Baum and Welch algorithm does this). And "fit the history as well as possible" is exactly the moment where it is easiest to fool yourself.

## The matrix method

The whole model comes down to three tables of numbers. The starting vector, which mode we begin in. The transition matrix A, which you saw above. And the emission matrix B, how likely a given move is in a given mode. That is all, three tables.

The best part is that the computation is also just multiplying tables. You hold a "belief vector": three numbers saying how much you believe you are in Calm, in Trend and in Panic. A new candle arrives and you make two moves. First you multiply the vector by the transition matrix, because the market could have jumped. Then by the chance that a given mode would have produced exactly this candle. The result is a new belief vector.

![One step of the matrix method: the belief vector multiplied by the transition matrix and by the emission probabilities of the new candle gives the updated belief vector](/en/blog/hmm/06-metoda-macierzowa.svg)

One step: old belief times the transition matrix, times the chance of the new candle in each mode, equals new belief. Then the same for the next candle.

This is called the forward algorithm. Decoding, that golden path through the lattice, is its cleverer cousin: instead of summing over all roads, at each step it remembers only the best one. The engine is the same, matrix multiplication step by step. That is why an HMM computes fast even on a long history, and why the whole thing fits into three tables and not a hundred "if, then" rules.

## What it gives you on the chart

You take the history, let the model split it into modes, and colour the chart with what came out.

![The same price chart coloured by the mode the model judged most likely in each segment](/en/blog/hmm/05-wykres-rezimy.svg)

The same chart, just painted by mode. And it is genuinely pleasant to the eye. You see at once where the market dozed and where it was on fire. Except that "pleasant to the eye" and "makes money" are two completely different things, which I will get to in a moment.

## The limits of the method, and what it is not for

The most important thing is not to confuse what this model is even for. An HMM does not point direction. It does not say "buy" or "the price will go up". By its very construction it answers a different question: what type the market is now.

The second thing is lag, and that too is not a fault but a feature. For the model to decide a trend has started, that trend has to have been running for a while, because the label comes from a sequence of observations, not from a single candle. Anyone who promises detection of a turn exactly at the turning point is selling an illusion. The HMM does not work that way, and it is better not to expect that from it.

This fits into a coherent whole with a hard truth about the market: it is easier to sensibly judge how big a move will be than which way it will go. The HMM plays in exactly that first league. It speaks about the character and the temperature of the market, not about direction. And it is right there, as a measure of character, that it is genuinely useful.

## So how to use it honestly

Since it is not an oracle, what is it good for? As context, never as an order. A few uses that really make sense:

- **A risk filter.** In "Panic" mode you cut position size or you do not enter at all. Not because you know where the price will go, but because you know it will thrash.
- **Matching the tool to the weather.** A strategy that makes money in a trend only pays the spread in Calm. The mode hints when to switch it on and when to leave it.
- **An honest interface.** One colour on the chart that says "watch out, a different market today". That is sometimes worth more than ten blinking arrows pretending to be a signal.

To that, two traps that are easy to fall into. The first is the number of modes. Three is my choice, not revealed truth. Give the model five, it will find five, also nicely coloured. The second is stability. The same data with a different start can give different modes. If the label changes at every touch, that is not knowledge about the market, just a fit to noise.

## The takeaway

A hidden Markov model is not a machine for predicting the price. It is a way to soberly say what market we are in now, based on the traces alone that this market leaves. Used as context it can help. Used as an oracle of direction it costs.

As always it ends the same way. Before you believe something knows, test it on data it has not seen yet. A nice colour on the chart is only the start of the question, not the answer.
