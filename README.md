# rdemb.github.io

Minimal multilingual research blog. Jekyll, no build step, no tracking.

## Structure

- Posts: `_posts/pl/`, `_posts/en/`, `_posts/de/`
- Pages: `index.html`, `projects.md`, `mocps.md`, `refleksje.md`, `about.md`
- i18n: `en/`, `de/`
- Nav config: `_data/navigation.yml`
- Style rules: `docs/SITE_STYLE.md`

## Local Preview

```bash
bundle exec jekyll serve
```

Without Jekyll: edit Markdown directly, push to trigger GitHub Pages build.

## Scope

MOCPS is a small CPU-friendly diagnostic - not a benchmark, not SOTA, not a market prediction tool.

## Hygiene

Before pushing: run `scripts/public_repo_check.sh` and verify `git ls-files` contains no private material.
