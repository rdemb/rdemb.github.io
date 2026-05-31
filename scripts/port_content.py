#!/usr/bin/env python3
"""Przenosi realna tresc Rafala (Jekyll) -> Astro content collections.
Posty: _posts/{pl,en,de}/*.md  ->  src/content/blog/{lang}/<slug>.md
Projekty: aai.md/mocps.md (+ en/ de/) -> src/content/projects/{lang}/<name>.md
Normalizuje frontmatter do schematu Astro. Body zostaje 1:1 (czysty markdown)."""
import os, re, glob, pathlib

SRC = "/root/projects/rdemb.github.io"
DST = "/root/projects/dlogic-site/src/content"


def parse(path):
    raw = open(path, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", raw, re.S)
    if not m:
        return {}, raw
    fm_raw, body = m.group(1), m.group(2)
    fm = {}
    for line in fm_raw.splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        v = v.strip().strip('"').strip("'")
        fm[k.strip()] = v
    return fm, body.strip()


def yamlescape(s):
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'


def write(dstpath, fm, body):
    pathlib.Path(os.path.dirname(dstpath)).mkdir(parents=True, exist_ok=True)
    lines = ["---"]
    for k, v in fm.items():
        lines.append(f"{k}: {yamlescape(v)}" if isinstance(v, str) else f"{k}: {v}")
    lines.append("---\n")
    open(dstpath, "w", encoding="utf-8").write("\n".join(lines) + body + "\n")


def tkey(fm, fallback):
    """translationKey = ostatni segment en_url (wspolny dla pl/en/de tej samej tresci)."""
    u = fm.get("en_url", "")
    seg = [p for p in u.strip("/").split("/") if p]
    return seg[-1] if seg else fallback


n = 0
# --- POSTY ---
for lang in ("pl", "en", "de"):
    for f in sorted(glob.glob(f"{SRC}/_posts/{lang}/*.md")):
        fm, body = parse(f)
        base = os.path.basename(f)
        mdate = re.match(r"(\d{4})-(\d{2})-(\d{2})-(.+)\.md", base)
        date = f"{mdate.group(1)}-{mdate.group(2)}-{mdate.group(3)}" if mdate else "2026-05-18"
        slug = mdate.group(4) if mdate else base[:-3]
        out = {
            "title": fm.get("title", slug),
            "lang": lang,
            "kind": fm.get("kind", "reflection"),
            "date": date,
            "excerpt": fm.get("excerpt", ""),
            "key": tkey(fm, slug),
            "slug": slug,
        }
        write(f"{DST}/blog/{lang}/{slug}.md", out, body)
        n += 1

# --- PROJEKTY (aai, mocps) ---
proj_src = {"pl": SRC, "en": f"{SRC}/en", "de": f"{SRC}/de"}
for name in ("aai", "mocps"):
    for lang, d in proj_src.items():
        f = f"{d}/{name}.md"
        if not os.path.exists(f):
            continue
        fm, body = parse(f)
        out = {
            "title": fm.get("title", name.upper()),
            "lang": lang,
            "kind": "project",
            "excerpt": fm.get("excerpt", ""),
            "key": name,
            "slug": name,
        }
        write(f"{DST}/projects/{lang}/{name}.md", out, body)
        n += 1

print(f"przeniesiono {n} plikow tresci do {DST}")
for lang in ("pl", "en", "de"):
    bc = len(glob.glob(f"{DST}/blog/{lang}/*.md"))
    pc = len(glob.glob(f"{DST}/projects/{lang}/*.md"))
    print(f"  {lang}: blog={bc} projects={pc}")
