# AGENTS.md

Persistent context and project guidelines for coding agents working on Brewlog.

## Project Overview

- **Name:** Brewlog
- **Description:** A lightweight, high-performance coffee brewing log app for personal/couple use, running as a LINE LIFF App.
- **Architecture:** LINE LIFF (React + Vite) <-> Cloudflare Workers (Hono API) <-> Supabase (PostgreSQL).
- **Environment:** Managed via Nix (`flake.nix`) and `direnv`. Ensure you run `direnv allow` and track changes in Git.
- **Reference Docs:**
  - Hono Standard: https://hono.dev/llms.txt
  - Project Setup: @README.md
  - Custom Authentication: @src/api/middleware/auth.ts
  - Database Schema: @db/schema.ts

---

## Development Commands

### Dependency Management

- **Install dependencies:** `pnpm install`
- **Add package:** `pnpm add <pkg>` (Use `pnpm` exclusively, do not use `npm` or `yarn`)

### Development & Build

- **Start dev server:** `vp dev`
- **Build production app:** `vp build`

### Quality Assurance

- **Lint / Format / Typecheck:** `vp check`
- **Auto-fix issues:** `vp check --fix`
- **Run tests:** `vp test`
- **Full agent guard:** `pnpm run guard:changes`
- **Secret scan:** `pnpm run guard:secrets`
- **Secret scanner canary:** `pnpm run guard:betterleaks-canary`

### Database (Drizzle ORM)

- **Generate migrations:** `pnpm run db:generate`
- **Apply migrations:** `pnpm run db:migrate`

---

## Directory Structure

```
├── db/                       # Database schema and Drizzle migrations
├── docs/                     # Design decisions, auth flows, and database designs
├── src/                      # React Frontend application (Vite)
│   └── api/                  # Backend Hono API (Cloudflare Workers)
│       └── index.ts          # Main Hono entrypoint
├── package.json              # Unified monorepo config
└── flake.nix                 # Nix development shell environment
```

---

## Coding Standards & Conventions

### 1. Type Safety & API Design

- **100% TypeScript:** Never use `any` or bypass type-safety rules.

### 2. UI Design System

- Use [Google Material Design 3](https://m3.material.io/) as the primary visual and interaction style guide.
- Preserve Brewlog's warm coffee-colored tonal palette and calm, lightweight character.
- Follow Material 3 guidance for semantic color roles, typography, shape, elevation, component states, navigation, touch targets, and accessibility.
- Prefer rounded cards, pill-shaped actions, tonal containers, and icon-plus-label bottom navigation where they suit the interaction.
- Treat Material 3 Expressive features as optional. Do not introduce exaggerated motion, typography, or shapes that conflict with Brewlog's calm character.
- Build UI with Tailwind CSS and modern Base UI primitives. Use shadcn/ui patterns where useful, but prefer Base UI alternatives over Radix primitives when both are available.
- Do not add Material UI or another component library solely to imitate Material 3; apply the design principles through the existing stack.
- Use smooth, purposeful transitions and restrained glassmorphic touches. Avoid effects that weaken hierarchy or usability.
- Preserve visible focus states, sufficient color contrast, readable type sizes, and touch-friendly interactive areas.
- Also comply with LINE LIFF and LINE MINI App UX requirements where applicable.

### 3. Formatting & Linting

- **Strict Formatting:** Run `vp check --fix` automatically after every code change. Ensure there are no type errors, lint warnings, or formatting issues before finishing your task.
- **Oxc Rules:** Strictly follow Oxc-based rules integrated in `Vite+` (`vp`).
- **Security Rules:** Keep the explicit security-oriented Oxlint rules in `vite.config.ts` enabled. Do not use inline disables or unsafe type escapes to bypass them.
- **Automatic Exit Hooks:** A `Stop` lifecycle hook is configured in [`.agents/hooks.json`](.agents/hooks.json) to automatically run `pnpm run guard:changes` upon agent session termination (the `Stop` hook). Nevertheless, proactively run `vp check --fix` after edits and `pnpm run guard:changes` before finishing.

---

## Critical Rules & "Do Nots" (Common Pitfalls)

- 🚫 **DO NOT** commit `.env`, `.dev.vars`, or any secrets/keys to Git.
- 🚫 **DO NOT** skip or disable Betterleaks, the Betterleaks canary, or the agent change guard.
- 🚫 **DO NOT** use `npm` or `yarn` for package management; only use `pnpm`.
- 🚫 **DO NOT** bypass `vp check` — ensure the toolchain passes completely before finalizing any feature. Explicitly run `vp check --fix` after editing files.
