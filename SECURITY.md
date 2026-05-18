# Security and Public Repo Hygiene

This repository is public website source. Treat every committed file as public.

## Public Surface

The site is a static GitHub Pages site. It intentionally has:

- no public admin panel
- no browser CMS
- no analytics or tracking scripts
- no runtime secrets
- no server-side code

## Never Commit

- private keys or deploy keys
- `.env` files
- access tokens
- API keys
- trading logs, account screenshots, balances, or broker details
- personal documents
- local agent state such as `.codex/` or `.agents/`
- generated build output such as `_site/`

## Before Pushing

Run:

```bash
git status --short
git ls-files | sort
scripts/public_repo_check.sh
```

Expected result: no private material in tracked files.

## Content Rule

Public writing should stay technical and sober. The site must not claim AGI, SOTA, broad world modeling, market prediction, or proof of physics understanding.
