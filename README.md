# rdemb.github.io

Minimal multilingual blog and research site for rdemb.

This is a local GitHub Pages site using a small custom Jekyll theme inspired by simple technical blogs:

- no npm build step
- no analytics or tracking
- simple typography and narrow text column
- Polish, English, and German versions
- posts in `_posts/pl`, `_posts/en`, and `_posts/de`
- no public admin panel or browser CMS

## Local preview

GitHub Pages will render the Jekyll templates. If Jekyll is not installed locally, the raw files are still editable, but Liquid loops will not be rendered by `python3 -m http.server`.

```bash
bundle exec jekyll serve
```

When Jekyll is unavailable, edit Markdown directly and rely on GitHub Pages to build after push.

## Content maintenance

Content is managed directly in the repository:

- posts: `_posts/pl`, `_posts/en`, `_posts/de`
- main pages: `index.html`, `mocps.md`, `refleksje.md`, `about.md`
- English pages: `en/`
- German pages: `de/`
- navigation: `_data/navigation.yml`

See `docs/CONTENT_MAINTENANCE.md` for the safe editing workflow. This keeps the public site static and avoids exposing a CMS/admin surface.

## Scope and claims

The first project is MOCPS — Motion-Grounded Object-Centric Predictive State. The copy is based on local research files from `/opt/algotrading/jepa-petri-dish` and keeps the claims narrow:

- toy diagnostic only
- no benchmark claim
- no SOTA claim
- no physics-understanding claim
- no claim that JEPA works
- no trading, finance, crypto, or market-prediction claim
