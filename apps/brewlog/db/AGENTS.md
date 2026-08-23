# Database Instructions

These instructions supplement the repository-root `AGENTS.md` for Drizzle schema and migration files under `db/`.

- Keep `db/schema.ts`, its relations, and generated migrations consistent.
- Do not change the schema without generating a Drizzle migration with `pnpm run db:generate` and applying it with `pnpm run db:migrate`.
- Preserve household ownership and referential integrity for all household-scoped entities.
- Review cascade behavior, nullability, defaults, indexes, and existing data before changing a relation or constraint.
- Do not hand-edit generated migration metadata unless the migration tooling requires a documented repair.
- Do not make a destructive or irreversible migration without an explicit data-preservation plan and user authorization.
