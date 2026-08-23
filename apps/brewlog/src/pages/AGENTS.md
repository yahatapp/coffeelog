# Page Instructions

These instructions supplement the repository-root `AGENTS.md` for files under `src/pages/`.

- Keep pages focused on route-level composition and user workflows; extract reusable visual patterns into `src/components/`.
- Use the shared Hono RPC client from `src/lib/api.ts`; do not duplicate endpoint types or introduce untyped request wrappers.
- Give every asynchronous screen appropriate loading, empty, error, and success feedback without causing layout shifts.
- Preserve Brewlog's mobile-first LIFF layout, bottom-navigation behavior, and concise Japanese interface copy.
- Reuse established form controls and interaction patterns across create and edit flows.
- Keep page components concise and split large forms or sections when they have an independent responsibility.
