#!/usr/bin/env python3
"""Phase analysis: V(L) = value of a predictive memory (identity accuracy after occlusion),
predictive/learned vs a memoryless velocity baseline, with per-seed statistics.
Reads the summary.json produced by the long-occlusion and accel-occlusion runs.
Usage: python analyze_phase.py runs/<dir>/summary.json [...]
"""
import json, sys, math
from collections import defaultdict

VEL = "memory_velocity_two_slot"                       # memoryless baseline (constant-velocity extrapolation)
PRED = "predictive_occlusion_memory_two_slot"          # hand-coded predictive memory
LEARN = "learned_recurrent_occlusion_memory_two_slot"  # learned recurrent gate
KEY = "assignment_accuracy_after_occlusion"            # identity metric after occlusion (0..1)


def stats(xs):
    n = len(xs)
    if n == 0:
        return (float("nan"), float("nan"), 0, [])
    m = sum(xs) / n
    sd = math.sqrt(sum((x - m) ** 2 for x in xs) / n) if n > 1 else 0.0
    return (m, sd, n, sorted(xs))


def analyze(path):
    d = json.load(open(path))
    rows = d.get("rows", [])
    has_mode = any("acceleration_mode" in r for r in rows)
    settings = d.get("settings", {})
    print("=" * 78)
    print(f"FILE: {path}")
    print(f"world: {d.get('model',{}).get('world','?')} | seeds: {settings.get('seeds','?')} | "
          f"{'acceleration modes' if has_mode else 'constant velocity'}")
    # group by (mode, length, variant) -> list of post-occlusion accuracy over seeds
    g = defaultdict(list)
    for r in rows:
        mode = r.get("acceleration_mode", "-")
        L = r.get("occlusion_length")
        v = r.get("variant")
        val = r.get(KEY)
        if val is not None:
            g[(mode, L, v)].append(val)

    modes = sorted({k[0] for k in g})
    lengths = sorted({k[1] for k in g if k[1] is not None})
    for mode in modes:
        if has_mode:
            print(f"\n--- mode: {mode} ---")
        print(f"  {'L':>2} | {'velocity (memoryless)':>22} | {'predictive (hand-coded)':>24} | "
              f"{'learned':>16} | {'V(L)=learn-vel':>14}")
        for L in lengths:
            vel = stats(g.get((mode, L, VEL), []))
            pred = stats(g.get((mode, L, PRED), []))
            lrn = stats(g.get((mode, L, LEARN), []))
            V = (lrn[0] - vel[0]) if not math.isnan(lrn[0]) and not math.isnan(vel[0]) else float("nan")
            def fmt(s):
                return f"{s[0]:.3f}+/-{s[1]:.3f}(n{s[2]})"
            flag = "  <- learned holds" if (not math.isnan(V) and lrn[0] >= 0.9 and vel[0] <= 0.5) else (
                   "  <- learned breaks" if (not math.isnan(lrn[0]) and lrn[0] < 0.5) else "")
            print(f"  {L:>2} | {fmt(vel):>22} | {fmt(pred):>24} | {fmt(lrn):>16} | {V:>+13.3f}{flag}")


if __name__ == "__main__":
    paths = sys.argv[1:] or ["runs/phase/summary.json"]
    for p in paths:
        try:
            analyze(p)
        except Exception as e:
            print(f"ERROR {p}: {e}")
