# Deploy notes

This repository is local-only for now. No remote is configured.

## Deploy key

A local deploy key was generated outside git:

```text
.deploy/rdemb_site_deploy_key
.deploy/rdemb_site_deploy_key.pub
```

Only the `.pub` content should be added to GitHub.

In the future GitHub repository:

1. Open `Settings -> Deploy keys`.
2. Add the public key from `.deploy/rdemb_site_deploy_key.pub`.
3. Enable `Allow write access` if this machine should push with that key.

## Remote

After the GitHub repository exists:

```bash
git remote add origin git@github.com:rdemb/rdemb.github.io.git
GIT_SSH_COMMAND='ssh -i .deploy/rdemb_site_deploy_key -o IdentitiesOnly=yes' git push -u origin main
```

Do not commit `.deploy/`.

## Admin panel

The admin panel is in `admin/` and uses Decap CMS. Before deploy, update:

```yaml
backend:
  repo: rdemb/rdemb.github.io
```

in `admin/config.yml`.

The panel is configured for:

- Polish posts
- English posts
- German posts
- main pages
- navigation entries
- media uploads under `assets/img/uploads`

For GitHub Pages hosting, Decap CMS also needs GitHub authentication to be configured for the final repo. The content model is already present, but auth cannot be completed until the repository exists.
