#!/usr/bin/env bash

# Run explicitly at task boundaries, never on every shell startup.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
BRANCH="$(git symbolic-ref --quiet --short HEAD)" || {
  echo "Check out the intended work branch before synchronizing." >&2
  exit 1
}

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Local changes exist. Commit the intended work before synchronizing; no edits were changed." >&2
  exit 1
fi
for STATE in MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD rebase-merge rebase-apply; do
  if [[ -e "$(git rev-parse --git-path "${STATE}")" ]]; then
    echo "Finish the existing Git operation before synchronizing." >&2
    exit 1
  fi
done

# Cloud checkouts may have no fetch refspec or fetch only the checked-out branch.
# Explicitly update remote branch refs so origin/main cannot remain stale.
git fetch --prune origin '+refs/heads/*:refs/remotes/origin/*'
git rev-parse --verify origin/main >/dev/null

# Include commits pushed from another environment without rewriting history.
if git show-ref --verify --quiet "refs/remotes/origin/${BRANCH}"; then
  git merge --ff-only "origin/${BRANCH}"
fi

if [[ "${BRANCH}" == "main" ]]; then
  git merge --ff-only origin/main
else
  # Preserve existing PR commits and record the base update as a merge.
  git merge --no-edit origin/main
fi

echo "${BRANCH} includes the fetched origin/main ($(git rev-parse --short origin/main))."
