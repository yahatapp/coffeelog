# Hono API Instructions

These instructions supplement the repository-root `AGENTS.md` for the Cloudflare Workers API under `src/api/`.

## Hono and RPC

- Follow the current [Hono documentation](https://hono.dev/llms.txt), especially its RPC, validation, and best-practice guidance.
- Preserve the chained route definition and exported `AppType` so `hc<AppType>` in `src/lib/api.ts` retains end-to-end request and response inference.
- Define handlers directly on their routes. If handlers must be extracted, use typed Hono factory helpers instead of untyped controller-style functions.
- Validate every untrusted request boundary with Zod and `zValidator`; consume validated data through `c.req.valid()`.
- Return JSON responses with meaningful HTTP status codes when adding or changing routes, especially where Hono RPC clients need status-aware response inference.
- Keep Cloudflare bindings and context variables centralized in `src/api/types.ts`; do not duplicate or weaken their types.

## Authentication and Data Isolation

- Do not use standard Supabase Auth signup or login. Authentication must follow the LINE ID-token verification and allowlist flow implemented in `src/api/middleware/auth.ts`.
- Keep authentication middleware applied to every protected API route. Do not trust LINE user IDs or household IDs supplied by the client.
- Resolve the authenticated profile's `householdId` on the server and include it in every household-owned read, update, and delete predicate.
- Verify ownership of referenced entities before creating or changing cross-table relationships.
- Use database transactions for multi-step writes that must succeed or fail atomically.

## Worker Safety

- Never expose `DATABASE_URL`, LINE channel configuration, allowlists, tokens, or other secrets in responses or logs.
- Use Web Standard and Cloudflare Workers-compatible APIs. Do not introduce Node.js-only behavior unless the Worker configuration explicitly supports and requires it.
