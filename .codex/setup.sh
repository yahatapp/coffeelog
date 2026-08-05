#!/usr/bin/env bash

# Codex Cloud environment setup for Cafelog.
# In the Codex environment settings, use this as the setup command:
#   bash .codex/setup.sh

set -Eeuo pipefail

readonly VITE_PLUS_VERSION="${VITE_PLUS_VERSION:-0.2.7}"

# Codex Cloud runs setup scripts non-interactively. Do not let the Vite+
# installer prompt about taking over Node.js version management.
export CI=1
export VP_NODE_MANAGER="no"
export VP_HOME="${VP_HOME:-${HOME}/.vite-plus}"

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

installed_vp_version=""
if [[ -x "$VP_HOME/bin/vp" ]]; then
  installed_vp_version="$("$VP_HOME/bin/vp" --version 2>/dev/null | sed -n '1p')"
fi

if [[ "$installed_vp_version" != "vp v${VITE_PLUS_VERSION}" ]]; then
  echo "Installing Vite+ v${VITE_PLUS_VERSION}..."
  curl --fail --silent --show-error --location https://vite.plus \
    | VP_VERSION="$VITE_PLUS_VERSION" bash
fi

# Add vp to this setup shell and persist it for the separate agent shell.
export PATH="$VP_HOME/bin:$PATH"

touch "$HOME/.bashrc"
grep -qxF "export VP_HOME=\"${VP_HOME}\"" "$HOME/.bashrc" \
  || echo "export VP_HOME=\"${VP_HOME}\"" >> "$HOME/.bashrc"
grep -qxF 'export PATH="${VP_HOME}/bin:${PATH}"' "$HOME/.bashrc" \
  || echo 'export PATH="${VP_HOME}/bin:${PATH}"' >> "$HOME/.bashrc"

echo "Installing dependencies from pnpm-lock.yaml..."
pnpm install --frozen-lockfile

echo "Codex Cloud setup complete."
vp --version
