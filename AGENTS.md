# Repository Instructions

## Keeping cloud workspaces current

- Before starting implementation, including follow-up work in an existing cloud
  environment, and immediately before pushing, run `bash .codex/sync.sh`.
- If there are local changes, fetch `origin` first, preserve the changes, and
  commit the intended work before running the sync script. Never automatically
  stash, reset, discard edits, or force-push to synchronize.
- Resolve any merge conflicts before continuing. After synchronization, install
  dependencies when their inputs changed and rerun the relevant checks.

## Reviews and pull requests

- Write code review comments in Japanese.
- When creating a pull request based on an issue, include `Close #<issue-number>` in the pull request description.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
