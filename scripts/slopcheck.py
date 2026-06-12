#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
slopcheck — deterministyczny gate na "AI-tiki" w prozie markdown (PL + EN).

Filozofia: NIE zastępuje osądu, tylko łapie mechaniczne sygnały, których Rafał
nie chce w tekstach (blog/lab/oferta). Dwa poziomy:

  HARD  — twarde, prawie zero false-positive. Blokuje (exit 1):
          • myślnik —  (em-dash)
          • " = " jako spójnik w prozie (np. "fosa = uczciwość")
          • antyteza "to nie X, to/lecz Y" / "it's not X, it's Y"
  WARN  — miękkie, statystyka (przysłówki-wypełniacze, skrajności, throat-clearing).
          Domyślnie tylko liczone, nie blokują. --strict podnosi je do blokady.

Najpierw MASKUJEMY strefy nie-prozy (frontmatter YAML, bloki kodu ``` ```,
inline `code`, tabele, linki/URL, HTML, liquid {% %}/{{ }}), żeby reguły
działały tylko na zdaniach. Maskowanie zamienia znaki na spacje, więc numery
linii i kolumn pozostają prawdziwe.

Użycie:
  python3 tools/slopcheck.py plik1.md plik2.md      # konkretne pliki
  python3 tools/slopcheck.py                         # domyślne katalogi treści
  python3 tools/slopcheck.py --staged                # tylko pliki w git index
  python3 tools/slopcheck.py --warn-detail           # pokaż też każdy WARN
  python3 tools/slopcheck.py --strict                # WARN też blokuje
  python3 tools/slopcheck.py --lang pl               # tylko reguły PL (pl|en|both)

Exit: 0 = czysto (wg progu), 1 = znaleziono blokujące, 2 = błąd użycia.
"""

import argparse
import glob
import os
import re
import subprocess
import sys

# Katalogi treści skanowane domyślnie (względem korzenia repo).
DEFAULT_DIRS = ["_posts", "_entries", "_pages"]
DEFAULT_FILES = ["index.md"]

# --- listy WARN (zalążek; dopisuj śmiało) ----------------------------------
# Przysłówki-wypełniacze i "wzmacniacze", które zwykle da się wyciąć bez straty.
FILLERS_PL = [
    "po prostu", "dosłownie", "naprawdę", "właśnie", "wręcz", "zwyczajnie",
    "tak naprawdę", "niejako", "poniekąd", "zasadniczo", "fundamentalnie",
    "nieodłącznie", "nieuchronnie", "bezsprzecznie", "zdecydowanie",
    "absolutnie", "dokładnie", "istotnie", "rzeczywiście",
]
FILLERS_EN = [
    "just", "really", "literally", "actually", "simply", "genuinely", "truly",
    "deeply", "fundamentally", "inherently", "inevitably", "basically",
    "essentially", "very", "quite", "clearly", "obviously",
]
# Leniwe skrajności (każdy/zawsze/nigdy) — rzadko prawdziwe, prawie zawsze do osłabienia.
EXTREMES_PL = ["zawsze", "nigdy", "każdy", "każda", "każde", "wszyscy", "wszystko", "nikt", "żaden"]
EXTREMES_EN = ["always", "never", "every", "everyone", "everything", "nobody", "none"]
# Odchrząkiwania / fillery frazowe (regex, bez \b wokół spacji).
THROAT_PL = [
    r"prawda jest taka", r"co więcej", r"warto zauważyć", r"warto podkreślić",
    r"należy pamiętać", r"rzecz w tym", r"chodzi o to,? że", r"otóż",
]
THROAT_EN = [
    r"here'?s the thing", r"it turns out", r"the truth is", r"let'?s be honest",
    r"at the end of the day", r"needless to say", r"it'?s worth noting",
]

# --- reguły HARD (antyteza; regex, IGNORECASE) ------------------------------
ANTITHESIS_PL = [
    r"\bto nie\b[^.,;:!?\n]{2,50},\s*(?:to|lecz)\b",
    r"\bnie chodzi o\b[^.;:!?\n]{2,60}\bchodzi o\b",
]
ANTITHESIS_EN = [
    r"\bit'?s not\b[^.;:!?\n]{2,50},\s*it'?s\b",
    r"\bisn'?t\b[^.;:!?\n]{2,50},\s*it'?s\b",
]

EM_DASH = re.compile(r"[—―]")                       # U+2014 / U+2015
EN_DASH_SPACED = re.compile(r"\s–\s")               # U+2013 spacjowany (WARN)
EQUALS_CONNECTIVE = re.compile(r"(?<=\S) = (?=\S)")  # " = " między słowami
# linia ze wzorem matematycznym (Σ, greka, f(x)…) — nie traktuj "=" jak spójnik
MATH_HINT = re.compile(r"[Σ∑∫∏√±×÷≈≤≥≠∞·∂∇θπφψλμνσΔΩ]|\w\(")
# świadome dopuszczenie w treści: <!-- slop-ok: powód --> wyłącza reguły w tej linii
SLOP_OK = re.compile(r"<!--\s*slop-ok")


def mask_nonprose(text: str) -> list:
    """Zwraca listę linii, w których strefy nie-prozy zamieniono na spacje
    (zachowując długości, by kolumny/numery linii pozostały prawdziwe)."""
    lines = text.split("\n")
    out = []
    in_front = False
    in_code = False
    fence = ""
    for i, line in enumerate(lines):
        s = line.strip()
        # frontmatter YAML: '---' w pierwszej linii otwiera, kolejne '---' zamyka
        if i == 0 and s == "---":
            in_front = True
            out.append(" " * len(line)); continue
        if in_front:
            out.append(" " * len(line))
            if s == "---" or s == "...":
                in_front = False
            continue
        # fenced code block
        if in_code:
            out.append(" " * len(line))
            if s.startswith(fence):
                in_code = False
            continue
        m = re.match(r"^\s*(```+|~~~+)", line)
        if m:
            in_code = True
            fence = m.group(1)[:3]
            out.append(" " * len(line)); continue
        # tabela markdown (linia z |) albo setext underline (=== / ---)
        if "|" in line and re.search(r"\|", line):
            out.append(" " * len(line)); continue
        if re.match(r"^\s*=+\s*$", line) or re.match(r"^\s*-{3,}\s*$", line):
            out.append(" " * len(line)); continue
        out.append(mask_inline(line))
    return out


def _spaces(m):
    return " " * len(m.group(0))


def mask_inline(line: str) -> str:
    """Maskuje inline: kod, obrazy/linki, gołe URL/maile, HTML, liquid."""
    line = re.sub(r"`[^`]*`", _spaces, line)                 # inline code
    line = re.sub(r"!?\[[^\]]*\]\([^)]*\)", _spaces, line)   # ![]() i []()
    line = re.sub(r"https?://\S+", _spaces, line)            # gołe URL
    line = re.sub(r"www\.\S+", _spaces, line)
    line = re.sub(r"\S+@\S+\.\S+", _spaces, line)            # maile
    line = re.sub(r"<[^>]+>", _spaces, line)                 # HTML
    line = re.sub(r"{%[^%]*%}", _spaces, line)               # liquid tag
    line = re.sub(r"{{[^}]*}}", _spaces, line)               # liquid var
    return line


def build_word_regex(words):
    # granica "słowa" działająca dla polskich znaków (bez \b, bo \b gubi diakrytyki)
    alt = "|".join(re.escape(w) for w in sorted(words, key=len, reverse=True))
    return re.compile(r"(?<![\wÀ-ſ])(?:" + alt + r")(?![\wÀ-ſ])",
                      re.IGNORECASE)


def build_phrase_regexes(patterns):
    return [re.compile(p, re.IGNORECASE) for p in patterns]


class Finding:
    __slots__ = ("path", "line", "col", "level", "rule", "snippet")

    def __init__(self, path, line, col, level, rule, snippet):
        self.path, self.line, self.col = path, line, col
        self.level, self.rule, self.snippet = level, rule, snippet


def snippet_for(orig_line: str, start: int, end: int, pad: int = 30) -> str:
    a = max(0, start - pad)
    b = min(len(orig_line), end + pad)
    pre = "…" if a > 0 else ""
    post = "…" if b < len(orig_line) else ""
    return (pre + orig_line[a:b].strip() + post).replace("\n", " ")


def check_file(path: str, langs: set) -> list:
    try:
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
    except (OSError, UnicodeDecodeError) as e:
        print(f"  ! pominięto {path}: {e}", file=sys.stderr)
        return []

    orig = text.split("\n")
    masked = mask_nonprose(text)
    findings = []

    # zestawy reguł zależne od języka
    hard_word_rules = []   # (rule_name, compiled)
    warn_word_rules = []
    warn_phrase_rules = []  # (rule_name, [compiled])
    hard_phrase_rules = []

    if "pl" in langs:
        warn_word_rules.append(("filler-pl", build_word_regex(FILLERS_PL)))
        warn_word_rules.append(("extreme-pl", build_word_regex(EXTREMES_PL)))
        warn_phrase_rules.append(("throat-pl", build_phrase_regexes(THROAT_PL)))
        hard_phrase_rules.append(("antithesis-pl", build_phrase_regexes(ANTITHESIS_PL)))
    if "en" in langs:
        warn_word_rules.append(("filler-en", build_word_regex(FILLERS_EN)))
        warn_word_rules.append(("extreme-en", build_word_regex(EXTREMES_EN)))
        warn_phrase_rules.append(("throat-en", build_phrase_regexes(THROAT_EN)))
        hard_phrase_rules.append(("antithesis-en", build_phrase_regexes(ANTITHESIS_EN)))

    for idx, mline in enumerate(masked):
        ln = idx + 1
        oline = orig[idx] if idx < len(orig) else ""

        # świadome dopuszczenie: <!-- slop-ok --> wyłącza reguły w tej linii
        if SLOP_OK.search(oline):
            continue

        is_math = MATH_HINT.search(mline) is not None

        # HARD: znaki
        for m in EM_DASH.finditer(mline):
            findings.append(Finding(path, ln, m.start() + 1, "HARD", "em-dash",
                                    snippet_for(oline, m.start(), m.end())))
        if not is_math:
            for m in EQUALS_CONNECTIVE.finditer(mline):
                findings.append(Finding(path, ln, m.start() + 1, "HARD", "equals-connective",
                                        snippet_for(oline, m.start(), m.end())))
        # HARD: antyteza
        for rule, regs in hard_phrase_rules:
            for r in regs:
                for m in r.finditer(mline):
                    findings.append(Finding(path, ln, m.start() + 1, "HARD", rule,
                                            snippet_for(oline, m.start(), m.end())))
        # WARN: en-dash spacjowany
        for m in EN_DASH_SPACED.finditer(mline):
            findings.append(Finding(path, ln, m.start() + 1, "WARN", "en-dash-spaced",
                                    snippet_for(oline, m.start(), m.end())))
        # WARN: słowa
        for rule, reg in warn_word_rules:
            for m in reg.finditer(mline):
                findings.append(Finding(path, ln, m.start() + 1, "WARN", rule,
                                        snippet_for(oline, m.start(), m.end())))
        # WARN: frazy
        for rule, regs in warn_phrase_rules:
            for r in regs:
                for m in r.finditer(mline):
                    findings.append(Finding(path, ln, m.start() + 1, "WARN", rule,
                                            snippet_for(oline, m.start(), m.end())))
    return findings


def resolve_targets(args) -> list:
    if args.files:
        return [f for f in args.files if f.endswith(".md")]
    if args.staged:
        try:
            out = subprocess.check_output(
                ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
                text=True)
        except subprocess.CalledProcessError:
            return []
        staged = [f for f in out.splitlines() if f.endswith(".md") and os.path.exists(f)]
        # gate dotyczy publikowanych treści, nie wewnętrznych .md (README/docs narzędzi)
        pref = tuple(d + "/" for d in DEFAULT_DIRS)
        return [f for f in staged if f.startswith(pref) or f in DEFAULT_FILES]
    targets = []
    for d in DEFAULT_DIRS:
        targets.extend(sorted(glob.glob(os.path.join(d, "**", "*.md"), recursive=True)))
    for f in DEFAULT_FILES:
        if os.path.exists(f):
            targets.append(f)
    return targets


def main():
    ap = argparse.ArgumentParser(description="Anty-slop gate (PL+EN) dla markdown.")
    ap.add_argument("files", nargs="*", help="pliki .md (domyślnie katalogi treści)")
    ap.add_argument("--staged", action="store_true", help="tylko pliki w git index")
    ap.add_argument("--strict", action="store_true", help="WARN też blokuje")
    ap.add_argument("--warn-detail", action="store_true", help="pokaż każdy WARN, nie tylko zliczenia")
    ap.add_argument("--lang", choices=["pl", "en", "both"], default="both")
    args = ap.parse_args()

    langs = {"pl", "en"} if args.lang == "both" else {args.lang}
    targets = resolve_targets(args)
    if not targets:
        print("slopcheck: brak plików .md do sprawdzenia.")
        return 0

    all_findings = []
    for path in targets:
        all_findings.extend(check_file(path, langs))

    hard = [f for f in all_findings if f.level == "HARD"]
    warn = [f for f in all_findings if f.level == "WARN"]

    # raport HARD — zawsze szczegółowo
    if hard:
        print("\n  TWARDE (blokują):")
        for f in sorted(hard, key=lambda x: (x.path, x.line, x.col)):
            print(f"    {f.path}:{f.line}:{f.col}  [{f.rule}]  {f.snippet}")

    # raport WARN — zliczenia, opcjonalnie szczegóły
    if warn:
        counts = {}
        for f in warn:
            counts[f.rule] = counts.get(f.rule, 0) + 1
        print("\n  MIĘKKIE (do rozważenia):")
        for rule, n in sorted(counts.items(), key=lambda x: -x[1]):
            print(f"    {n:4d}  {rule}")
        if args.warn_detail:
            print("\n  MIĘKKIE — szczegóły:")
            for f in sorted(warn, key=lambda x: (x.path, x.line, x.col)):
                print(f"    {f.path}:{f.line}:{f.col}  [{f.rule}]  {f.snippet}")

    n_files = len(targets)
    print(f"\nslopcheck: {n_files} plik(ów), {len(hard)} twardych, {len(warn)} miękkich.")
    if not hard and not warn:
        print("  czysto.")

    blocking = len(hard) + (len(warn) if args.strict else 0)
    return 1 if blocking else 0


if __name__ == "__main__":
    sys.exit(main())
