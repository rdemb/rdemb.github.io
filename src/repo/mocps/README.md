# Learned object permanence: a minimal, CPU-reproducible phase diagram

This is the curated, public subset of an ongoing research probe (a JEPA-style "petri dish"). It
contains the write-up, the two figures, and the exact analysis code behind them. The full working
environment is held back on purpose; this bundle is meant to be read, not to hide anything.

## The result, in one paragraph

In a 32x32 two-ball pixel world, a learned recurrent predictive state gives no advantage over a
constant-velocity baseline on fully observed prediction. Its value is confined to occlusion, where
it must keep object identity. Across an acceleration by occlusion sweep, the learned state beats both
a physics baseline and a hand-coded predictive memory in exactly one regime: a direction change
while the object is hidden. A single geometric quantity, the separation margin at reappearance,
predicts which of two failure modes a setting falls into.

- Dynamics-limited (comfortable separation, baseline extrapolates the wrong way): learning wins.
  Above about 6 px the learned state averages 0.96 identity accuracy against 0.14 for velocity (18 cells).
- Separation-limited (objects pass within about one object diameter): irreducible geometry. In the
  four tightest cells the learned state drops to 0.40 and is beaten by the memoryless baseline (0.76).

This is not SOTA, not a benchmark, and not a claim that the model understands physics or is a general
world model. It is an honest map of when a learned predictive state earns its keep.

## Files

- `RESULT_LEARNED_OBJECT_PERMANENCE.md` - the full write-up: theory, phase diagram, two mechanisms, the fix, limitations.
- `figures/fig1_phase.png` - the phase diagram (learning advantage across modes by lengths).
- `figures/fig2_mechanisms.png` - the two failure modes against the separation margin.
- `figures/mocps_hero.gif` - a looping animation of the headline scenario (direction change under occlusion).
- `analyze_phase.py` - computes V(L) = learned minus velocity per cell, with per-seed statistics.
- `separation_margin.py` - computes the separation margin d_min, the geometry behind the ceiling.
- `make_figures.py` - regenerates both figures from the run summaries.
- `make_animation.py` - renders the hero animation from the ground-truth trajectory (no fabricated guesses).

## Reproduce

The analysis scripts read run summaries and the world generator from the `jepa_petri` package, which
is not included here (it is the full working environment). A runnable, single-command repository is a
separate, deliberately extracted release. The commands that produce the runs and the figures are
listed in section 9 of the write-up. Everything runs on CPU.
