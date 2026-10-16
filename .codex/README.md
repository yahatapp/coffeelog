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
