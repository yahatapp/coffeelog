import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appConfigs = {
  shared: {
    migrationsSchema: "drizzle",
    migrationsTable: "__coffeelog_migrations",
  },
  brewlog: {
    migrationsSchema: "drizzle",
    migrationsTable: "__drizzle_migrations",
  },
  cafelog: {
    migrationsSchema: "drizzle",
    migrationsTable: "__cafelog_migrations",
  },
};

const appName = process.argv[2];
if (!["brewlog", "cafelog", "all"].includes(appName)) {
  console.error("Usage: node scripts/db-migrate.mjs <brewlog|cafelog|all>");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to run database migrations.");
  process.exit(1);
}

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = path.join(repositoryRoot, "apps", "brewlog");
const requireFromApp = createRequire(path.join(appRoot, "package.json"));
const postgres = requireFromApp("postgres");
const { readMigrationFiles } = requireFromApp("drizzle-orm/migrator");

const client = postgres(databaseUrl, {
  connect_timeout: 15,
  max: 1,
  // Supabase's transaction pooler does not support named prepared statements.
  prepare: false,
  onnotice: () => {},
});

function formatError(error) {
  const seen = new Set();
  const messages = [];
  let current = error;

  while (current && !seen.has(current)) {
    seen.add(current);

    if (current instanceof Error) {
      const code =
        "code" in current && typeof current.code === "string" ? ` [${current.code}]` : "";
      messages.push(`${current.name}${code}: ${current.message}`);
      current = current.cause;
      continue;
    }

    messages.push(String(current));
    break;
  }

  return messages
    .join("\nCaused by: ")
    .replaceAll(databaseUrl, "[REDACTED_DATABASE_URL]")
    .replace(/postgres(?:ql)?:\/\/[^\s]+/giu, "[REDACTED_DATABASE_URL]");
}

try {
  // Both Workers read the shared store history, so migrate both schemas before
  // either deployment. Keep the lock and all migrations in one transaction so
  // Supabase's transaction pooler also pins the same PostgreSQL connection.
  await client.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(880088)`;
    for (const name of ["shared", "cafelog", "brewlog"]) {
      const root =
        name === "shared"
          ? path.join(repositoryRoot, "packages", "database")
          : path.join(repositoryRoot, "apps", name);
      console.log(`Applying ${name} database migrations...`);
      const { migrationsSchema, migrationsTable } = appConfigs[name];
      // Identifiers are fixed in appConfigs, never supplied by the caller.
      const journal = `"${migrationsSchema}"."${migrationsTable}"`;
      await tx.unsafe(`CREATE SCHEMA IF NOT EXISTS "${migrationsSchema}"`);
      await tx.unsafe(
        `CREATE TABLE IF NOT EXISTS ${journal} (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)`,
      );
      const [latest] = await tx.unsafe(
        `SELECT created_at FROM ${journal} ORDER BY created_at DESC LIMIT 1`,
      );
      const migrations = readMigrationFiles({
        migrationsFolder: path.join(root, "db", "migrations"),
      });
      // Use Drizzle's generated journal, SQL parser and migration hashes, with
      // the same timestamp ordering as its PostgreSQL migrator.
      for (const migration of migrations) {
        if (latest && Number(latest.created_at) >= migration.folderMillis) continue;
        for (const statement of migration.sql) await tx.unsafe(statement);
        await tx.unsafe(`INSERT INTO ${journal} (hash, created_at) VALUES ($1, $2)`, [
          migration.hash,
          migration.folderMillis,
        ]);
      }
    }
  });
  console.log("Shared, Cafelog and Brewlog database migrations applied successfully.");
} catch (error) {
  console.error(`${appName} database migration failed.`);
  console.error(formatError(error));
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}
