# Content Maintenance

This is the safe replacement for a public admin panel. Edit content as files, review the diff, then push.

## Add a Post

Create a Markdown file in the matching language folder:

```text
_posts/pl/YYYY-MM-DD-title.md
_posts/en/YYYY-MM-DD-title.md
_posts/de/YYYY-MM-DD-title.md
```

Use this front matter:

```yaml
---
layout: post
title: "Post title"
lang: pl
ref: shared-post-id
---
```

Use the same `ref` value for translations of the same post. Keep drafts outside the repository until they are safe to publish.

## Remove a Post

Delete the Markdown file from `_posts/<lang>/`, then check:

```bash
git status --short
```

## Edit Navigation

Navigation is in:

```text
_data/navigation.yml
```

Each language has its own list. Add only links that exist in the site.

## Edit Main Pages

- Polish: `index.html`, `projects.md`, `mocps.md`, `refleksje.md`, `about.md`
- English: `en/index.html`, `en/projects.md`, `en/mocps.md`, `en/reflections.md`, `en/about.md`
- German: `de/index.html`, `de/projects.md`, `de/mocps.md`, `de/reflexionen.md`, `de/about.md`

Tone and UI rules live in `docs/SITE_STYLE.md`.

## Safe Publish Checklist

Before every push:

```bash
git status --short
git ls-files | sort
scripts/public_repo_check.sh
```

Then push:

```bash
git push origin main
```

GitHub Actions will build and deploy the site.
