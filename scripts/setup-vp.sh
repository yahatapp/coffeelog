#!/usr/bin/env bash

set -euo pipefail

export CI=1
export VP_NODE_MANAGER="no"
export VP_HOME="${VP_HOME:-${HOME}/.vite-plus}"
export VP_VERSION="0.2.7"

readonly INSTALLER_URL="https://raw.githubusercontent.com/voidzero-dev/vite-plus/v${VP_VERSION}/packages/cli/install.sh"
readonly INSTALLER_SHA256="58bb052c6a007e662e99667d65686251b16d6b39aa21155487da6d51280b3d54"
readonly TEMP_DIR="$(mktemp -d)"
readonly INSTALLER_PATH="${TEMP_DIR}/install.sh"
trap 'rm -rf "${TEMP_DIR}"' EXIT

curl --proto '=https' --tlsv1.2 -fsSL "${INSTALLER_URL}" -o "${INSTALLER_PATH}"
printf '%s  %s\n' "${INSTALLER_SHA256}" "${INSTALLER_PATH}" | sha256sum --check --status
bash "${INSTALLER_PATH}"

if [[ -n "${GITHUB_PATH:-}" ]]; then
  printf '%s\n' "${VP_HOME}/bin" >> "${GITHUB_PATH}"
fi

installed_vp_output="$("${VP_HOME}/bin/vp" --version)"
installed_vp_version="${installed_vp_output%%$'\n'*}"
if [[ "${installed_vp_version}" != "vp v${VP_VERSION}" ]]; then
  echo "Expected Vite+ v${VP_VERSION}, but found: ${installed_vp_version}" >&2
  exit 1
fi

echo "Vite+ ${VP_VERSION} is ready."
