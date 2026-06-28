# GEMINI.md

Persistent context and project guidelines for Gemini Code in Cafelog.

## Project Overview

- **Name:** Cafelog
- **Description:** A lightweight, high-performance cafe coffee review log app for personal use, running as a LINE LIFF App.
- **Architecture:** LINE LIFF (React + Vite) <-> Cloudflare Workers (Hono API) <-> Supabase (PostgreSQL, `cafelog` schema).
- **Environment:** Managed via Nix (`flake.nix`) and `direnv`. Ensure you run `direnv allow` and track changes in Git.
- **Relation to Brewlog:** Shares the same Supabase DB (schema-isolated) and LINE Provider, but uses a separate LINE Channel, Cloudflare Worker, and LIFF App.

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
- **Schema isolation:** Cafelog uses the `cafelog` PostgreSQL schema (configured in `drizzle.config.ts` via `schemaFilter`).

---

## Directory Structure

```
├── db/                       # Database schema (cafelog schema) and Drizzle migrations
├── src/                      # React Frontend application (Vite)
│   └── api/                  # Backend Hono API (Cloudflare Workers)
│       ├── index.ts          # Main Hono entrypoint
│       └── middleware/       # Auth middleware (LINE LIFF ID Token verification)
│   ├── hooks/                # React hooks (useLiff, etc.)
│   ├── lib/                  # Shared utilities (api client, etc.)
│   └── pages/                # Page components
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

---

## Critical Rules & "Do Nots" (Common Pitfalls)

- 🚫 **DO NOT** commit `.env`, `.dev.vars`, or any secrets/keys to Git.
- 🚫 **DO NOT** use `npm` or `yarn` for package management; only use `pnpm`.
- 🚫 **DO NOT** bypass `vp check` — ensure the toolchain passes completely before finalizing any feature. Explicitly run `vp check --fix` after editing files.
- 🚫 **DO NOT** use standard Supabase Auth client-side signup/login. Authentication must strictly leverage LINE LIFF ID Token verification + backend Allowlist matching.
- 🚫 **DO NOT** make database schema changes without updating Drizzle files under `db/` and generating/running migrations via `pnpm run db:generate` and `pnpm run db:migrate`.
- 🚫 **DO NOT** write verbose or bloated components. Keep them modular, reusable, and structured logically.
- 🚫 **DO NOT** use the `public` schema for database tables. All Cafelog tables must be in the `cafelog` schema to avoid conflicts with Brewlog.
