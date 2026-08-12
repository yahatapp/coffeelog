#!/usr/bin/env bash

set -euo pipefail

readonly REPO_ROOT="$(git rev-parse --show-toplevel)"
readonly NIX_ENV_FILE="${HOME}/.cache/cafelog-nix-env.sh"
cd "${REPO_ROOT}"

if ! command -v nix >/dev/null 2>&1; then
  echo "Nix is required to set up the Codex Cloud environment." >&2
  exit 1
fi

# Run setup through the same pinned flake used by local development and CI.
nix develop --command ./scripts/setup-vp.sh
nix develop --command pnpm install --frozen-lockfile
nix develop --command pnpm run hooks:install
nix develop --command pnpm run guard:gitleaks-canary

# Codex runs setup and later agent commands in separate shells. Persist the
# evaluated dev-shell environment so those commands use the same toolchain.
mkdir -p "$(dirname "${NIX_ENV_FILE}")"
nix print-dev-env > "${NIX_ENV_FILE}"
chmod 0600 "${NIX_ENV_FILE}"

touch "${HOME}/.bashrc"
readonly SOURCE_LINE="source \"${NIX_ENV_FILE}\""
grep -qxF "${SOURCE_LINE}" "${HOME}/.bashrc" || printf '%s\n' "${SOURCE_LINE}" >> "${HOME}/.bashrc"

echo "Codex Cloud setup complete."
nix develop --command node --version
nix develop --command pnpm --version
nix develop --command gitleaks version
nix develop --command vp --version
