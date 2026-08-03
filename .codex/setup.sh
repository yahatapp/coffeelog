#!/usr/bin/env bash

# Codex Cloud environment setup for Cafelog.
# In the Codex environment settings, use this as the setup command:
#   bash .codex/setup.sh

set -Eeuo pipefail

readonly VITE_PLUS_VERSION="${VITE_PLUS_VERSION:-0.2.7}"
readonly NODE_VERSION="${NODE_VERSION:-24}"
readonly VITE_PLUS_HOME="${VP_HOME:-${HOME}/.vite-plus}"

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

installed_vp_version=""
if [[ -x "$VITE_PLUS_HOME/bin/vp" ]]; then
  installed_vp_version="$("$VITE_PLUS_HOME/bin/vp" --version 2>/dev/null | sed -n '1p')"
fi

if [[ "$installed_vp_version" != "vp v${VITE_PLUS_VERSION}" ]]; then
  echo "Installing Vite+ v${VITE_PLUS_VERSION}..."
  curl --fail --silent --show-error --location https://vite.plus \
    | VP_VERSION="$VITE_PLUS_VERSION" VP_HOME="$VITE_PLUS_HOME" bash
fi

# The installer updates shell startup files, but its changes are not visible in
# this Bash process. Add the installed command to PATH for the rest of setup.
export VP_HOME="$VITE_PLUS_HOME"
export PATH="$VP_HOME/bin:$PATH"

configured_node_version="$(vp --version 2>/dev/null | awk '$1 == "Node.js" { print $2; exit }')"
if [[ "$configured_node_version" != "v${NODE_VERSION}" && "$configured_node_version" != "v${NODE_VERSION}."* ]]; then
  echo "Configuring Node.js ${NODE_VERSION}..."
  vp env default "$NODE_VERSION"
fi

echo "Installing dependencies from pnpm-lock.yaml..."
pnpm install --frozen-lockfile

echo "Codex Cloud setup complete."
vp --version
