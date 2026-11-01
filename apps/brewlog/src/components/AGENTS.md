# Component Instructions

These instructions supplement the repository-root `AGENTS.md` for files under `src/components/`.

- Create accessible, reusable primitives instead of page-specific one-off styling.
- Follow the [shared UI guide](../../../../docs/design-system/README.md). Use CSS Modules and public CSS tokens; use Base UI when an appropriate complex primitive exists.
- Keep variants, sizes, states, and focus behavior centralized in the shared component rather than repeated at call sites.
- Preserve semantic HTML, keyboard operation, visible focus, disabled states, and adequate touch targets.
- Keep component APIs type-safe and narrow. Do not add `any`, styling escape hatches, or unnecessary dependencies.
