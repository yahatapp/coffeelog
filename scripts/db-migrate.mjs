import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appConfigs = {
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
const appConfig = appConfigs[appName];

if (!appConfig) {
  console.error(`Usage: node scripts/db-migrate.mjs <${Object.keys(appConfigs).join("|")}>`);
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to run database migrations.");
  process.exit(1);
}

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = path.join(repositoryRoot, "apps", appName);
const requireFromApp = createRequire(path.join(appRoot, "package.json"));
const postgres = requireFromApp("postgres");
const { drizzle } = requireFromApp("drizzle-orm/postgres-js");
const { migrate } = requireFromApp("drizzle-orm/postgres-js/migrator");

const client = postgres(databaseUrl, {
  connect_timeout: 15,
  max: 1,
  // Supabase's transaction pooler does not support named prepared statements.
  prepare: false,
});

function formatError(error) {
  const seen = new Set();
  const messages = [];
  let current = error;

  while (current && !seen.has(current)) {
    seen.add(current);

    if (current instanceof Error) {
      const code = "code" in current && typeof current.code === "string" ? ` [${current.code}]` : "";
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
  console.log(`Applying ${appName} database migrations...`);
  await migrate(drizzle(client), {
    migrationsFolder: path.join(appRoot, "db", "migrations"),
    ...appConfig,
  });
  console.log(`${appName} database migrations applied successfully.`);
} catch (error) {
  console.error(`${appName} database migration failed.`);
  console.error(formatError(error));
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}
