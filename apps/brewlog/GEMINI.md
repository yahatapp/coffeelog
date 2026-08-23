# GEMINI.md

Persistent context and project guidelines for Gemini Code in Brewlog.

## Project Overview

- **Name:** Brewlog
- **Description:** A lightweight, high-performance coffee brewing log app for personal/couple use, running as a LINE LIFF App.
- **Architecture:** LINE LIFF (React + Vite) <-> Cloudflare Workers (Hono API) <-> Supabase (PostgreSQL).
- **Environment:** Managed via Nix (`flake.nix`) and `direnv`. Ensure you run `direnv allow` and track changes in Git.
- **Reference Docs:**
  - Hono Standard: https://hono.dev/llms.txt
  - Tech Stack Decisions: @docs/tech-stack.md
  - Custom Authentication: @docs/auth-flow.md
  - Database Schema: @docs/database-design.md

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
- **Hono RPC:** Always use shared Hono `AppType` to achieve end-to-end type safety between frontend client and backend Hono routes.

### 2. Styling & UI Framework

- **shadcn/ui + Base UI:** Always prioritize modern Base UI primitives combined with Tailwind CSS. Avoid standard Radix-based shadcn components if Base UI alternatives exist.
- **Aesthetics & Premium Design:** Follow premium web design guidelines. Use vibrant HSL colors, smooth transitions, glassmorphic touches, and custom typography. Avoid basic/default styling.

### 3. Formatting & Linting

- **Strict Formatting:** Run `vp check --fix` automatically after every code change. Ensure there are no type errors, lint warnings, or formatting issues before finishing your task.
- **Oxc Rules:** Strictly follow Oxc-based rules integrated in `Vite+` (`vp`).
- **Automatic Exit Hooks:** A `Stop` lifecycle hook is configured in [.agents/hooks.json](file:///Users/kenya/Documents/application/brewlog/.agents/hooks.json) to automatically run `pnpm run check:fix` upon agent session termination (the `Stop` hook). Nevertheless, proactively run `vp check --fix` manually to ensure correctness during development.

---

## Critical Rules & "Do Nots" (Common Pitfalls)

- 🚫 **DO NOT** commit `.env`, `.dev.vars`, or any secrets/keys to Git.
- 🚫 **DO NOT** use `npm` or `yarn` for package management; only use `pnpm`.
- 🚫 **DO NOT** bypass `vp check` — ensure the toolchain passes completely before finalizing any feature. Explicitly run `vp check --fix` after editing files.
- 🚫 **DO NOT** use standard Supabase Auth client-side signup/login. Authentication must strictly leverage LINE LIFF ID Token verification + backend Allowlist matching (see `docs/auth-flow.md`).
- 🚫 **DO NOT** make database schema changes without updating Drizzle files under `db/` and generating/running migrations via `pnpm run db:generate` and `pnpm run db:migrate` (see `docs/database-design.md`).
- 🚫 **DO NOT** write verbose or bloated components. Keep them modular, reusable, and structured logically.
