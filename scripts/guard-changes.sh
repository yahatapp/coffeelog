#!/usr/bin/env bash

set -euo pipefail

pnpm run guard:betterleaks-canary
pnpm run guard:secrets
pnpm run check
pnpm test
