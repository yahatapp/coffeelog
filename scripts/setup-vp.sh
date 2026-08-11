#!/usr/bin/env bash

set -euo pipefail

export CI=1
export VP_NODE_MANAGER="no"
export VP_HOME="${VP_HOME:-${HOME}/.vite-plus}"
readonly VP_VERSION="0.2.7"

curl --proto '=https' --tlsv1.2 -fsSL https://vite.plus | bash
"${VP_HOME}/bin/vp" upgrade "${VP_VERSION}" --force --silent

installed_vp_output="$("${VP_HOME}/bin/vp" --version)"
installed_vp_version="${installed_vp_output%%$'\n'*}"
if [[ "${installed_vp_version}" != "vp v${VP_VERSION}" ]]; then
  echo "Expected Vite+ v${VP_VERSION}, but found: ${installed_vp_version}" >&2
  exit 1
fi

echo "Vite+ ${VP_VERSION} is ready."
