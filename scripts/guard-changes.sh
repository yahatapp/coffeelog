#!/usr/bin/env bash

set -euo pipefail

pnpm run guard:betterleaks-canary
pnpm run check
pnpm test
