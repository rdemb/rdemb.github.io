#!/usr/bin/env bash
set -euo pipefail

bad_paths="$(git ls-files | grep -E '(^admin/|^\.deploy/|^\.env($|\.)|^\.codex/|^\.agents/|^_site/|^node_modules/|^vendor/)' || true)"
if [ -n "$bad_paths" ]; then
  echo "Blocked tracked paths found:"
  echo "$bad_paths"
  exit 1
fi

secret_hits="$(
  git grep -n -E \
    'BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY|PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|client_secret|access_token|api[_-]?key|password' \
    -- \
    ':(exclude)scripts/public_repo_check.sh' \
    ':(exclude)SECURITY.md' \
    ':(exclude)docs/CONTENT_MAINTENANCE.md' \
    || true
)"
if [ -n "$secret_hits" ]; then
  echo "Possible secret-like tracked content found:"
  echo "$secret_hits"
  exit 1
fi

echo "Public repo check passed."
