# Managed environment setup

Configure the environment setup command to run `bash .codex/setup.sh` from the
repository root. Run the same command to repair an existing environment.

- With Nix installed, or on root Linux, setup uses the pinned Nix development shell.
- On non-root Linux without Nix, setup uses `setup-portable.sh`. This requires
  Node.js 24 and installs checksum-verified pnpm 11.11.0 and Betterleaks 1.4.1,
  matching `package.json`, `flake.nix`, and the nixpkgs revision in `flake.lock`.
  Tools, caches, and package-manager state stay in the ignored `.codex/.runtime/`
  directory. Both `.profile` and `.bashrc` load this environment for later shells
  and Git hooks. Setup installs dependencies and hooks, and runs the scanner canary.

The portable path does not install system packages or browsers. If browser testing
is needed, provision the Playwright Chromium system dependencies in the image and
run `pnpm --filter cafelog browser:install` separately.

After setup, verify with `pnpm exec lefthook run pre-commit`. Hooks must succeed
without `LEFTHOOK=0` or other skips.

## Reusing a cloud environment

An existing checkout does not automatically follow updates to GitHub. Before each
implementation task (including follow-up requests in the same chat) and before
pushing, run `bash .codex/sync.sh`. It fetches origin, fast-forwards changes pushed
to the same branch from another environment, then merges the latest main into
the work branch. On main, it only permits fast-forward updates.

The script stops on local changes, detached HEAD, an unfinished Git operation,
or a diverged remote work branch. Commit the intended local work or resolve the
Git state first; it never stashes, resets, or force-pushes. Merge conflicts must
be resolved before continuing. Rerun dependency installation if package inputs
changed, followed by the relevant checks.

For an environment maintenance command, use
`bash .codex/sync.sh && bash .codex/setup.sh` on a clean work branch. Synchronizing
is explicit rather than a shell startup action, so opening a terminal cannot
unexpectedly change a checkout. GitHub may advance again after a fetch or push;
rerun the same command when a PR reports that its base has changed.
