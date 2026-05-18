# Deploy Notes

This repository deploys to GitHub Pages through GitHub Actions.

## Deploy key

A local deploy key exists outside git:

```text
.deploy/rdemb_site_deploy_key
.deploy/rdemb_site_deploy_key.pub
```

Only the `.pub` content belongs in GitHub deploy-key settings. The private key must never be committed or pasted into issues, docs, comments, or chat.

Expected GitHub setting:

1. Open `Settings -> Deploy keys`.
2. Add the public key from `.deploy/rdemb_site_deploy_key.pub`.
3. Enable `Allow write access` only for this trusted machine.

## Push

The remote is expected to be:

```bash
git@github.com:rdemb/rdemb.github.io.git
```

Push with the deploy key:

```bash
GIT_SSH_COMMAND='ssh -i .deploy/rdemb_site_deploy_key -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new' git push origin main
```

## Site Management

There is intentionally no public `/admin/` panel and no browser CMS in this repository. Content is maintained through Markdown/YAML files and normal git review:

- posts live in `_posts/pl`, `_posts/en`, and `_posts/de`
- pages live at the repository root plus `en/` and `de/`
- navigation lives in `_data/navigation.yml`

See `docs/CONTENT_MAINTENANCE.md`.

## Do Not Commit

- `.deploy/`
- `.env` or `.env.*`
- `.codex/`
- `.agents/`
- local notes with private information
- market/trading logs
- screenshots with accounts, balances, keys, emails, or personal data
