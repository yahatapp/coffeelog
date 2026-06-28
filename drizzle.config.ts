import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  schemaFilter: ["cafelog"],
  migrations: {
    table: "__cafelog_migrations",
    schema: "drizzle",
  },
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
