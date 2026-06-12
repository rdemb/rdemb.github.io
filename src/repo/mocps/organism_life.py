"""Life ledger: the organism's age and lifetime counters survive restarts.

A tiny JSON file in the run dir. The brain holds one Life and bumps its
counters; the server asks it to save() periodically and on shutdown. Sums are
kept instead of per-trial lists so memory stays flat over months of life.
"""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path


class Life:
    def __init__(self, run_dir: str) -> None:
        self.path = Path(run_dir) / "life.json"
        self.process_start = time.time()
        d: dict = {}
        if self.path.exists():
            try:
                d = json.loads(self.path.read_text(encoding="utf-8"))
            except Exception:
                d = {}
        self.born = float(d.get("born", self.process_start))
        self.steps = int(d.get("steps_total", 0))
        self.trials = int(d.get("trials_total", 0))
        self.ok = int(d.get("ok_total", 0))
        self.surprises = int(d.get("surprises_total", 0))
        self.phys_ok = int(d.get("phys_ok_total", 0))
        self.phys_tot = int(d.get("phys_tot_total", 0))
        self.poss_sum = float(d.get("poss_sum", 0.0))
        self.poss_n = int(d.get("poss_n", 0))
        self.imp_sum = float(d.get("imp_sum", 0.0))
        self.imp_n = int(d.get("imp_n", 0))
        self.base_ok = int(d.get("baseline_ok_total", 0))
        self.base_tot = int(d.get("baseline_tot_total", 0))
        # per-kind verdict counters: kind -> [correct, total]
        kc = d.get("kind_counts", {})
        self.kind_counts: dict[str, list[int]] = {k: [int(v[0]), int(v[1])] for k, v in kc.items()}
        self._last_save = 0.0

    def bump_kind(self, kind: str, correct: bool) -> None:
        c = self.kind_counts.setdefault(kind, [0, 0])
        c[0] += int(correct)
        c[1] += 1

    # ---- persistence -----------------------------------------------------
    def save(self, force: bool = False) -> None:
        now = time.time()
        if not force and now - self._last_save < 30.0:
            return
        self._last_save = now
        payload = {
            "born": self.born,
            "steps_total": self.steps,
            "trials_total": self.trials,
            "ok_total": self.ok,
            "surprises_total": self.surprises,
            "phys_ok_total": self.phys_ok,
            "phys_tot_total": self.phys_tot,
            "poss_sum": self.poss_sum,
            "poss_n": self.poss_n,
            "imp_sum": self.imp_sum,
            "imp_n": self.imp_n,
            "baseline_ok_total": self.base_ok,
            "baseline_tot_total": self.base_tot,
            "kind_counts": self.kind_counts,
            "saved_at": now,
        }
        tmp = self.path.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(payload, indent=1), encoding="utf-8")
        tmp.replace(self.path)  # atomic on POSIX

    # ---- views -----------------------------------------------------------
    def block(self) -> dict:
        now = time.time()
        return {
            "born": datetime.fromtimestamp(self.born, tz=timezone.utc).isoformat(timespec="seconds"),
            "age_days": round((now - self.born) / 86400.0, 2),
            "uptime_s": int(now - self.process_start),
            "steps_total": self.steps,
            "trials_total": self.trials,
        }
