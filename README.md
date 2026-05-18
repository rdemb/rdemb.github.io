# rdemb-site

Minimal bilingual blog and research site for Rafał Dembski.

This is a local-only rebuild prepared for a future GitHub Pages repository. It uses a small custom Jekyll theme inspired by simple technical blogs:

- no npm build step
- no analytics or tracking
- simple typography and narrow text column
- Polish and English versions
- posts in `_posts/pl` and `_posts/en`
- Decap CMS admin panel in `admin/`

## Local preview

GitHub Pages will render the Jekyll templates. If Jekyll is not installed locally, the raw files are still editable, but Liquid loops will not be rendered by `python3 -m http.server`.

```bash
bundle exec jekyll serve
```

When Jekyll is unavailable, edit Markdown directly and rely on GitHub Pages to build after push.

## Admin panel

The admin panel lives at `/admin/` and uses Decap CMS. Before public deployment, update:

```yaml
backend:
  repo: rdemb/rdemb.github.io
```

in `admin/config.yml`.

The panel can create/delete posts, edit main pages, and edit navigation data in `_data/navigation.yml`.

See `DEPLOY.md` for deploy-key and GitHub setup notes.

## Scope and claims

The first project is MOCPS — Motion-Grounded Object-Centric Predictive State. The copy is based on local research files from `/opt/algotrading/jepa-petri-dish` and keeps the claims narrow:

- toy diagnostic only
- no benchmark claim
- no SOTA claim
- no physics-understanding claim
- no claim that JEPA works
- no trading, finance, crypto, or market-prediction claim
