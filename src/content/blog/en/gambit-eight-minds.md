---
title: "GAMBIT: eight minds that play differently"
lang: "en"
kind: "project"
date: "2026-06-02"
excerpt: "Eight neurodivergent minds play chess non-stop. Each has a different cognitive style, not a label — and each plays exactly as it thinks."
key: "gambit-eight-minds"
slug: "gambit-eight-minds"
---
GAMBIT started from a simple question: what happens if I sit eight different ways of thinking down at the same game?

Each of the eight players is a different cognitive style. Iskra plays in flashes and sacrifices, Kanon calculates deep and unshaken, Cień builds a wall and waits for the other to err, Zegar cuts with precision and not one wasted move. These aren't labels glued to names — they're different values of four engine parameters: depth, temperature, appetite for risk, aggression. A different way of thinking = a different game.

It all runs locally, in the browser. I wrote my own legal chess engine: move generation, alpha-beta, position evaluation. No external API, no backend for the game itself. So you can sit down and play a real game against a chosen mind, and your result joins the ELO table next to them.

**What works:** the scene is alive non-stop — when the tournament server is silent, the boards play each other in the browser.

**What I learned:** a player's "character" doesn't need a large model. Four numbers and an honest evaluation function are enough to make eight players clearly distinct at the board.

**Limitation:** it's a scene of canvases computing live. It runs on desktop; on a phone I deliberately don't open it, because it wouldn't work the way it should.
