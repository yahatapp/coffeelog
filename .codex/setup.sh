#!/usr/bin/env bash

set -euo pipefail

readonly NIX_INSTALLER_VERSION="v3.21.0"
readonly NIX_INSTALLER_SHA256="c3cf066a28941e89fa1e38ed36f2acfc7479f9b088ddcf35160362a5ee89bd43"
readonly NIX_INSTALLER_URL="https://install.determinate.systems/nix/tag/${NIX_INSTALLER_VERSION}/nix-installer.sh"
REPO_ROOT="$(git rev-parse --show-toplevel)"
readonly REPO_ROOT
readonly NIX_ENV_FILE="${HOME}/.cache/cafelog-nix-env.sh"
cd "${REPO_ROOT}"

# Nix can already be installed while missing from PATH in a fresh Codex shell.
if ! command -v nix >/dev/null 2>&1 && [[ -r /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh ]]; then
  # shellcheck disable=SC1091
  source /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
fi

if ! command -v nix >/dev/null 2>&1; then
  if [[ "$(uname -s)" != "Linux" || "$(id -u)" -ne 0 ]]; then
    echo "Automatic Nix installation is supported only in the root Linux environment used by Codex Cloud." >&2
    echo "Install Nix for this host, then run this setup script again." >&2
    exit 1
  fi

  NIX_INSTALLER="$(mktemp)"
  readonly NIX_INSTALLER
  trap 'rm -f "${NIX_INSTALLER}"' EXIT

  echo "Nix was not found; installing it with installer ${NIX_INSTALLER_VERSION} for Codex Cloud."
  curl -fsSL "${NIX_INSTALLER_URL}" -o "${NIX_INSTALLER}"
  printf '%s  %s\n' "${NIX_INSTALLER_SHA256}" "${NIX_INSTALLER}" | sha256sum -c -
  bash "${NIX_INSTALLER}" install linux \
    --no-confirm \
    --prefer-upstream-nix \
    --diagnostic-endpoint "" \
    --init none \
    --extra-conf "experimental-features = nix-command flakes" \
    --extra-conf "sandbox = false"

  # shellcheck disable=SC1091
  source /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
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
# print-dev-env preserves shellHook as a variable, but sourcing its output does
# not execute the hook. Persist the path needed by the separately installed vp
# binary explicitly so later Codex shells can run the package scripts.
printf '%s\n' 'export PATH="${VP_HOME:-$HOME/.vite-plus}/bin:$PATH"' >> "${NIX_ENV_FILE}"
chmod 0600 "${NIX_ENV_FILE}"

touch "${HOME}/.bashrc"
readonly SOURCE_LINE="source \"${NIX_ENV_FILE}\""
grep -qxF "${SOURCE_LINE}" "${HOME}/.bashrc" || printf '%s\n' "${SOURCE_LINE}" >> "${HOME}/.bashrc"

echo "Codex Cloud setup complete."
nix develop --command node --version
nix develop --command pnpm --version
nix develop --command gitleaks version
nix develop --command vp --version
