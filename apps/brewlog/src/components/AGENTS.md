# Component Instructions

These instructions supplement the repository-root `AGENTS.md` for files under `src/components/`.

- Create accessible, reusable primitives instead of page-specific one-off styling.
- Prefer Base UI primitives when an appropriate primitive exists; use shadcn/ui composition patterns and Tailwind CSS for styling.
- Keep variants, sizes, states, and focus behavior centralized in the shared component rather than repeated at call sites.
- Preserve semantic HTML, keyboard operation, visible focus, disabled states, and adequate touch targets.
- Keep component APIs type-safe and narrow. Do not add `any`, styling escape hatches, or unnecessary dependencies.
