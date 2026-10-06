import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/stores.ts",
  out: "./db/migrations",
  schemaFilter: ["coffeelog"],
});
