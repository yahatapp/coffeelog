import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Context, Next } from "hono";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db/schema";
import { stores } from "@yahatapp/database/stores";
import { createTestDatabase } from "../../../../packages/database/test/database";
import type { Env } from "./types";
import app from "./index";

type TestClient = Awaited<ReturnType<typeof createTestDatabase>>;
const createDb = (client: TestClient) => drizzle(client, { schema: { ...schema, stores } });
let client: TestClient;
let database: ReturnType<typeof createDb>;
vi.mock("./db", () => ({ getDb: () => database }));
vi.mock("./middleware/auth", () => ({
  authMiddleware: async (c: Context<Env>, next: Next) => {
    c.set("lineUserId", c.req.header("X-Test-User") ?? "self");
    await next();
  },
}));

const request = (path: string, method = "GET", json?: unknown, user = "self") =>
  app.request(
    path,
    {
      method,
      headers: { "Content-Type": "application/json", "X-Test-User": user },
      ...(json === undefined ? {} : { body: JSON.stringify(json) }),
    },
    { DATABASE_URL: "postgres://test.invalid/db" },
  );
const logSchema = z.object({
  id: z.uuid(),
  storeId: z.uuid(),
  cafeName: z.string(),
  links: z.array(z.object({ url: z.string() })),
});

beforeAll(async () => {
  client = await createTestDatabase();
  database = createDb(client);
  await database.insert(schema.profiles).values([
    { lineUserId: "self", displayName: "Self" },
    { lineUserId: "other", displayName: "Other" },
  ]);
}, 30000);
afterAll(async () => {
  await client.close();
});

describe("Cafelogの店舗登録API", () => {
  it("既存のリクエストで店舗に関連付け、店舗情報を別テーブルから返す", async () => {
    const response = await request("/api/logs", "POST", {
      cafeName: "Cafe Store",
      prefecture: "東京都",
      cafeLinks: ["https://example.com/cafe"],
      note: "Coffee note",
    });
    expect(response.status).toBe(200);
    const created = logSchema.parse(await response.json());
    const [stored] = await database
      .select()
      .from(schema.cafeLogs)
      .where(eq(schema.cafeLogs.id, created.id));
    expect(stored.cafeName).toBeNull();
    expect(stored.prefecture).toBeNull();
    expect(stored.note).toBe("Coffee note");
    const detail = logSchema.parse(await (await request(`/api/logs/${created.id}`)).json());
    expect(detail.cafeName).toBe("Cafe Store");
    expect(detail.links[0].url).toBe("https://example.com/cafe");
    const reused = logSchema.parse(
      await (
        await request("/api/logs", "POST", {
          cafeName: "Cafe Store",
          prefecture: "東京都",
          cafeLinks: [],
        })
      ).json(),
    );
    expect(reused.storeId).toBe(created.storeId);
    expect(reused.links).toEqual(created.links);
    const updated = logSchema.parse(
      await (await request(`/api/logs/${created.id}`, "PATCH", { note: "Updated" })).json(),
    );
    expect(updated.storeId).toBe(created.storeId);
    expect(updated.links).toEqual(created.links);
    const list = logSchema.array().parse(await (await request("/api/logs")).json());
    expect(list).toHaveLength(2);
    expect((await request(`/api/logs/${created.id}`, "GET", undefined, "other")).status).toBe(404);
    const history = z
      .object({
        cafeRecords: z.array(z.object({ id: z.uuid() })),
        brewRecords: z.array(z.unknown()),
      })
      .parse(await (await request(`/api/stores/${created.storeId}`)).json());
    expect(history.cafeRecords).toHaveLength(2);
    expect(history.brewRecords).toEqual([]);
  });

  it("記録の店舗を変更すると他の記録や元の店舗を変更しない", async () => {
    const created = logSchema.parse(
      await (await request("/api/logs", "POST", { cafeName: "Original Shop" })).json(),
    );
    const updated = logSchema.parse(
      await (
        await request(`/api/logs/${created.id}`, "PATCH", { cafeName: "New Shop", cafeLinks: [] })
      ).json(),
    );
    expect(updated.storeId).not.toBe(created.storeId);
    const [original] = await database.select().from(stores).where(eq(stores.id, created.storeId));
    expect(original.name).toBe("Original Shop");
  });

  it("空の店舗名、危険なリンク、無効な店舗IDを拒否する", async () => {
    expect((await request("/api/logs", "POST", { cafeName: " " })).status).toBe(400);
    expect(
      (
        await request("/api/logs", "POST", {
          cafeName: "Store",
          cafeLinks: ["javascript:alert(1)"],
        })
      ).status,
    ).toBe(400);
    expect((await request("/api/stores/invalid")).status).toBe(400);
    expect((await request("/api/stores/00000000-0000-4000-8000-000000000099")).status).toBe(404);
  });
});
