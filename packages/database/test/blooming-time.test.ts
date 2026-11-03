import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";

it("drops the independent bloom time while preserving existing logs and pour durations", async () => {
  const client = new PGlite();
  try {
    await client.exec(`
      CREATE SCHEMA brewlog;
      CREATE TABLE brewlog.brew_logs (id integer PRIMARY KEY, blooming_time integer, note text);
      CREATE TABLE brewlog.brew_pours (
        id integer PRIMARY KEY,
        brew_log_id integer REFERENCES brewlog.brew_logs(id),
        pour_number integer,
        duration integer
      );
      INSERT INTO brewlog.brew_logs VALUES (1, 30, 'with pours'), (2, 45, 'without pours'), (3, NULL, 'no bloom');
      INSERT INTO brewlog.brew_pours VALUES (1, 1, 1, 35), (2, 1, 2, 0), (3, 3, 1, 0);
    `);
    const migration = await readFile(
      new URL("../../../apps/brewlog/db/migrations/0019_many_sunfire.sql", import.meta.url),
      "utf8",
    );
    await client.exec(migration);
    expect((await client.query("SELECT * FROM brewlog.brew_logs ORDER BY id")).rows).toEqual([
      { id: 1, note: "with pours" },
      { id: 2, note: "without pours" },
      { id: 3, note: "no bloom" },
    ]);
    expect((await client.query("SELECT * FROM brewlog.brew_pours ORDER BY id")).rows).toEqual([
      { id: 1, brew_log_id: 1, pour_number: 1, duration: 35 },
      { id: 2, brew_log_id: 1, pour_number: 2, duration: 0 },
      { id: 3, brew_log_id: 3, pour_number: 1, duration: 0 },
    ]);
  } finally {
    await client.close();
  }
}, 30000);
