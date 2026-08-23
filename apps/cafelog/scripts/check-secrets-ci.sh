#!/usr/bin/env bash

set -euo pipefail

if [[ "${1:-}" == "--" ]]; then
  shift
fi

readonly BASE_REF="${1:-}"
readonly HEAD_REF="${2:-HEAD}"

if [[ -z "${BASE_REF}" ]]; then
  echo "Usage: $0 <base-ref> [head-ref]" >&2
  exit 2
fi

git cat-file -e "${BASE_REF}^{commit}"
git cat-file -e "${HEAD_REF}^{commit}"

betterleaks git . \
  --no-banner \
  --redact \
  --verbose \
  --platform github \
  --git-workers "${BETTERLEAKS_GIT_WORKERS:-4}" \
  --max-archive-depth 1 \
  --log-opts "${BASE_REF}..${HEAD_REF}"
