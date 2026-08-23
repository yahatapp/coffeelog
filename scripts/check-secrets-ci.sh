#!/usr/bin/env bash

set -euo pipefail

if [[ "${1:-}" == "--" ]]; then
  shift
fi

readonly BASE_REF="${1:-}"
readonly HEAD_REF="${2:-HEAD}"

git cat-file -e "${HEAD_REF}^{commit}"

log_opts="${HEAD_REF}"
if [[ -n "${BASE_REF}" ]] && git cat-file -e "${BASE_REF}^{commit}" 2>/dev/null; then
  log_opts="${BASE_REF}..${HEAD_REF}"
fi

betterleaks git . \
  --no-banner \
  --redact \
  --verbose \
  --platform github \
  --git-workers "${BETTERLEAKS_GIT_WORKERS:-4}" \
  --max-archive-depth 1 \
  --log-opts "${log_opts}"
