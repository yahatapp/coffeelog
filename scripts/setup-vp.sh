#!/usr/bin/env bash

set -euo pipefail

export CI=1
export VP_NODE_MANAGER="no"
export VP_HOME="${VP_HOME:-${HOME}/.vite-plus}"
readonly VP_VERSION="0.2.7"

case "$(uname -s)-$(uname -m)" in
  Linux-x86_64)
    readonly VP_TARGET="x86_64-unknown-linux-gnu"
    readonly VP_SHA256="33d7bb26b7f6fbf433fff2cbc7d005084a6ce69e7a0c08118ef28d3a49a30ee8"
    ;;
  Linux-aarch64 | Linux-arm64)
    readonly VP_TARGET="aarch64-unknown-linux-gnu"
    readonly VP_SHA256="ea641a44dc83df6a71a0e05ab285e72cd9b82af131f7b904ac6679ba5f3c5dc6"
    ;;
  Darwin-x86_64)
    readonly VP_TARGET="x86_64-apple-darwin"
    readonly VP_SHA256="9eecf77ac281517fa17d8b90c2889760be989506d42de9308f6f0015ff029974"
    ;;
  Darwin-arm64 | Darwin-aarch64)
    readonly VP_TARGET="aarch64-apple-darwin"
    readonly VP_SHA256="ca3e6a004b2f5901619ed25892aabda4a1ed60549e71d3c14d00b0c7b1da04b8"
    ;;
  *)
    echo "Unsupported platform for Vite+: $(uname -s)-$(uname -m)" >&2
    exit 1
    ;;
esac

readonly ARCHIVE="vp-${VP_TARGET}.tar.gz"
readonly DOWNLOAD_URL="https://github.com/voidzero-dev/vite-plus/releases/download/v${VP_VERSION}/${ARCHIVE}"
readonly TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TEMP_DIR}"' EXIT

curl --proto '=https' --tlsv1.2 -fsSL "${DOWNLOAD_URL}" -o "${TEMP_DIR}/${ARCHIVE}"
printf '%s  %s\n' "${VP_SHA256}" "${TEMP_DIR}/${ARCHIVE}" | sha256sum --check --status
mkdir -p "${VP_HOME}/bin"
tar -xzf "${TEMP_DIR}/${ARCHIVE}" -C "${VP_HOME}/bin" vp
chmod 0755 "${VP_HOME}/bin/vp"

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
