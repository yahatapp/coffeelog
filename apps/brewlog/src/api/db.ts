import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/schema";

export const getDb = (databaseUrl: string) => {
  const client = postgres(databaseUrl, { prepare: false });
  return drizzle(client, { schema });
};
