import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";

it("migrates legacy flavor notes into ordered arrays without empty items", async () => {
  const client = new PGlite();
  try {
    await client.exec(`
      CREATE SCHEMA cafelog;
      CREATE TABLE cafelog.cafe_logs (id integer PRIMARY KEY, flavor_note text);
      INSERT INTO cafelog.cafe_logs VALUES
        (1, E' ベリー、ジャスミン, チョコレート\\n紅茶・柑橘，， '),
        (2, NULL), (3, ''), (4, ' 単独のフレーバー ');
    `);
    const migration = await readFile(
      new URL("../../../apps/cafelog/db/migrations/0014_tired_ultimo.sql", import.meta.url),
      "utf8",
    );
    await client.exec(migration);
    const result = await client.query<{ id: number; flavor_notes: string[] }>(
      "SELECT * FROM cafelog.cafe_logs ORDER BY id",
    );
    expect(result.rows).toEqual([
      { id: 1, flavor_notes: ["ベリー", "ジャスミン", "チョコレート", "紅茶", "柑橘"] },
      { id: 2, flavor_notes: [] },
      { id: 3, flavor_notes: [] },
      { id: 4, flavor_notes: ["単独のフレーバー"] },
    ]);
    await client.exec("INSERT INTO cafelog.cafe_logs (id) VALUES (5)");
    expect(
      (await client.query("SELECT flavor_notes FROM cafelog.cafe_logs WHERE id = 5")).rows,
    ).toEqual([{ flavor_notes: [] }]);
  } finally {
    await client.close();
  }
}, 30000);
