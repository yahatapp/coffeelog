#!/usr/bin/env bash

# Non-root managed Linux environments cannot install Nix system-wide.
# Keep downloaded tools and writable caches inside the checkout instead.
set -euo pipefail

readonly REPO_ROOT="$(git rev-parse --show-toplevel)"
readonly TOOL_ROOT="${REPO_ROOT}/.codex/.runtime"
readonly PNPM_VERSION="11.11.0" # Keep aligned with package.json and flake.nix.
readonly PNPM_SHA256="85ef2eff216a1ae90804c00c8dfbfa6685353644650d10906a893c05aedcd884"
readonly BETTERLEAKS_VERSION="1.4.1" # Matches the nixpkgs revision in flake.lock.

cd "${REPO_ROOT}"
[[ "$(uname -s)" == "Linux" ]] || { echo "Portable setup requires Linux." >&2; exit 1; }
[[ "$(node -p 'process.versions.node.split(".")[0]')" == "24" ]] || {
  echo "Portable setup requires Node.js 24." >&2
  exit 1
}
[[ "$(node -p 'require("./package.json").packageManager')" == "pnpm@${PNPM_VERSION}" ]] || {
  echo "Update the portable pnpm version and checksum to match package.json." >&2
  exit 1
}

case "$(uname -m)" in
  x86_64)
    ARCH=x64
    BETTERLEAKS_SHA256=2635ff988d9194cd3070155138589081a54a3438d79ca9b83268addd2fd844cc
    ;;
  aarch64)
    ARCH=arm64
    BETTERLEAKS_SHA256=23ed05ce217c21d39e723c6d970a9fd0b9e9b686eae1aebf9d778fb7a77acc92
    ;;
  *) echo "Unsupported Linux architecture: $(uname -m)" >&2; exit 1 ;;
esac

mkdir -p "${TOOL_ROOT}"/{bin,pnpm,cache,config,data}
readonly DOWNLOAD_DIR="$(mktemp -d)"
trap 'rm -rf "${DOWNLOAD_DIR}"' EXIT

if [[ ! -f "${TOOL_ROOT}/pnpm/bin/pnpm.cjs" ]] ||
  [[ "$(node "${TOOL_ROOT}/pnpm/bin/pnpm.cjs" --version)" != "${PNPM_VERSION}" ]]; then
  curl -fsSL --retry 3 "https://registry.npmjs.org/pnpm/-/pnpm-${PNPM_VERSION}.tgz" -o "${DOWNLOAD_DIR}/pnpm.tgz"
  printf '%s  %s\n' "${PNPM_SHA256}" "${DOWNLOAD_DIR}/pnpm.tgz" | sha256sum -c -
  tar -xzf "${DOWNLOAD_DIR}/pnpm.tgz" -C "${TOOL_ROOT}/pnpm" --strip-components=1
fi
chmod +x "${TOOL_ROOT}/pnpm/bin/pnpm.cjs"
ln -sfn ../pnpm/bin/pnpm.cjs "${TOOL_ROOT}/bin/pnpm"

if [[ ! -x "${TOOL_ROOT}/bin/betterleaks" ]] ||
  [[ "$("${TOOL_ROOT}/bin/betterleaks" version)" != "${BETTERLEAKS_VERSION}" ]]; then
  curl -fsSL --retry 3 "https://github.com/betterleaks/betterleaks/releases/download/v${BETTERLEAKS_VERSION}/betterleaks_${BETTERLEAKS_VERSION}_linux_${ARCH}.tar.gz" -o "${DOWNLOAD_DIR}/betterleaks.tgz"
  printf '%s  %s\n' "${BETTERLEAKS_SHA256}" "${DOWNLOAD_DIR}/betterleaks.tgz" | sha256sum -c -
  tar -xzf "${DOWNLOAD_DIR}/betterleaks.tgz" -C "${TOOL_ROOT}/bin" betterleaks
fi

readonly ENV_FILE="${TOOL_ROOT}/env.sh"
{
  printf 'export PATH=%q:%q:$PATH\n' "${TOOL_ROOT}/bin" "${REPO_ROOT}/node_modules/.bin"
  printf 'export XDG_CACHE_HOME=%q\n' "${TOOL_ROOT}/cache"
  printf 'export XDG_CONFIG_HOME=%q\n' "${TOOL_ROOT}/config"
  printf 'export XDG_DATA_HOME=%q\n' "${TOOL_ROOT}/data"
} > "${ENV_FILE}"

# Login shells read .profile; noninteractive bash returns early from .bashrc.
# Add this before that return so subsequent agent shells and hooks inherit it.
printf -v SOURCE_LINE '[ ! -r %q ] || . %q' "${ENV_FILE}" "${ENV_FILE}"
for PROFILE in "${HOME}/.profile" "${HOME}/.bashrc"; do
  [[ -e "${PROFILE}" ]] || touch "${PROFILE}"
  if ! grep -qxF "${SOURCE_LINE}" "${PROFILE}"; then
    PROFILE_TEMP="$(mktemp)"
    printf '%s\n' "${SOURCE_LINE}" > "${PROFILE_TEMP}"
    cat "${PROFILE}" >> "${PROFILE_TEMP}"
    cat "${PROFILE_TEMP}" > "${PROFILE}"
    rm "${PROFILE_TEMP}"
  fi
done
# shellcheck disable=SC1090
source "${ENV_FILE}"
[[ "$(pnpm --version)" == "${PNPM_VERSION}" ]] || {
  echo "Pinned pnpm is not available on PATH." >&2
  exit 1
}

pnpm install --frozen-lockfile
pnpm run hooks:install
pnpm run guard:betterleaks-canary
node --version
pnpm --version
betterleaks version
echo "Portable setup complete. Browser installation is separate on non-root Linux."
