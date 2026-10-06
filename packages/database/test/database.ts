import { PGlite } from "@electric-sql/pglite";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { fileURLToPath } from "node:url";

export async function createTestDatabase() {
  const client = new PGlite();
  for (const relative of [
    "../db/migrations",
    "../../../apps/cafelog/db/migrations",
    "../../../apps/brewlog/db/migrations",
  ]) {
    const migrations = readMigrationFiles({
      migrationsFolder: fileURLToPath(new URL(relative, import.meta.url)),
    });
    for (const migration of migrations) await client.exec(migration.sql.join("\n"));
  }
  return client;
}
