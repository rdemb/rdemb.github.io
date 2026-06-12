"""Calibrate the VoE surprise threshold from the organism's lived trials.

Reads runs/<run>/trials.jsonl (one JSON line per scored trial, written by
organism.brain) and reports:

  - ROC AUC of latent surprise as a possible/impossible classifier,
  - the Youden-optimal threshold (max TPR - FPR) vs the live one,
  - detection rate per miracle kind at both thresholds,
  - the same for the kinematic pixel baseline (where logged).

Pure standard library. Usage:

  python -m organism.calibrate --run-dir runs/gravity_v3 [--threshold 0.27]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

LIVE_THRESHOLD = 0.27
BASELINE_PX_THRESH = 2.5


def load(path: Path) -> list[dict]:
    rows = []
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return rows


def auc(scores_pos: list[float], scores_neg: list[float]) -> float | None:
    """Rank-based AUC (Mann-Whitney), ties counted half."""
    if not scores_pos or not scores_neg:
        return None
    ranked = sorted([(s, 1) for s in scores_pos] + [(s, 0) for s in scores_neg])
    # assign mean ranks for ties
    ranks: dict[int, float] = {}
    i = 0
    while i < len(ranked):
        j = i
        while j + 1 < len(ranked) and ranked[j + 1][0] == ranked[i][0]:
            j += 1
        mean_rank = (i + j) / 2 + 1
        for k in range(i, j + 1):
            ranks[k] = mean_rank
        i = j + 1
    rank_sum_pos = sum(ranks[idx] for idx, (_, lab) in enumerate(ranked) if lab == 1)
    n_pos, n_neg = len(scores_pos), len(scores_neg)
    return (rank_sum_pos - n_pos * (n_pos + 1) / 2) / (n_pos * n_neg)


def youden(scores_pos: list[float], scores_neg: list[float]) -> tuple[float, float, float]:
    """Threshold maximizing TPR - FPR; returns (threshold, tpr, fpr)."""
    candidates = sorted(set(scores_pos + scores_neg))
    best = (candidates[0], 0.0, 0.0)
    best_j = -2.0
    for t in candidates:
        tpr = sum(s > t for s in scores_pos) / len(scores_pos)
        fpr = sum(s > t for s in scores_neg) / len(scores_neg)
        if tpr - fpr > best_j:
            best_j = tpr - fpr
            best = (t, tpr, fpr)
    return best


def pct(n: int, d: int) -> str:
    return f"{100 * n / d:5.1f}%" if d else "    —"


def main() -> None:
    ap = argparse.ArgumentParser(description="VoE threshold calibration from lived trials.")
    ap.add_argument("--run-dir", default="runs/gravity_v3")
    ap.add_argument("--threshold", type=float, default=LIVE_THRESHOLD, help="live threshold to evaluate")
    args = ap.parse_args()

    path = Path(args.run_dir) / "trials.jsonl"
    if not path.exists():
        raise SystemExit(f"no {path} yet — let the organism live a while first")
    rows = load(path)
    pos = [r["latent_surprise"] for r in rows if r["impossible"]]
    neg = [r["latent_surprise"] for r in rows if not r["impossible"]]
    print(f"trials: {len(rows)}  (impossible {len(pos)} / possible {len(neg)})")

    a = auc(pos, neg)
    print(f"latent surprise AUC: {a:.4f}" if a is not None else "latent surprise AUC: — (need both classes)")
    if pos and neg:
        t, tpr, fpr = youden(pos, neg)
        acc_live = (sum(s > args.threshold for s in pos) + sum(s <= args.threshold for s in neg)) / len(rows)
        acc_youden = (sum(s > t for s in pos) + sum(s <= t for s in neg)) / len(rows)
        print(f"live threshold  {args.threshold:.3f}: accuracy {acc_live:6.1%}")
        print(f"youden optimum  {t:.3f}: accuracy {acc_youden:6.1%}  (TPR {tpr:.1%}, FPR {fpr:.1%})")

    print("\nper kind (detection = surprised on impossible / calm on possible):")
    kinds = sorted({r["kind"] for r in rows})
    for k in kinds:
        kr = [r for r in rows if r["kind"] == k]
        det = sum(r["surprised"] == r["impossible"] for r in kr)
        print(f"  {k:14s} n={len(kr):5d}  correct {pct(det, len(kr))}")

    base = [r for r in rows if r.get("baseline_dist_px") is not None]
    if base:
        bp = [r["baseline_dist_px"] for r in base if r["impossible"]]
        bn = [r["baseline_dist_px"] for r in base if not r["impossible"]]
        ab = auc(bp, bn)
        print(f"\nkinematic pixel baseline: n={len(base)}, AUC {ab:.4f}" if ab is not None else f"\nkinematic pixel baseline: n={len(base)}")
        for k in kinds:
            kr = [r for r in base if r["kind"] == k]
            if not kr:
                continue
            det = sum((r["baseline_dist_px"] > BASELINE_PX_THRESH) == r["impossible"] for r in kr)
            print(f"  {k:14s} n={len(kr):5d}  correct {pct(det, len(kr))}")


if __name__ == "__main__":
    main()
