import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Context, Next } from "hono";
import { drizzle } from "drizzle-orm/pglite";
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
const beanSchema = z.object({
  id: z.uuid(),
  storeId: z.uuid().nullable(),
  purchaseStore: z.string().nullable(),
  coffeeType: z.string(),
});

beforeAll(async () => {
  client = await createTestDatabase();
  database = createDb(client);
  const [household] = await database.insert(schema.households).values({ name: "Self" }).returning();
  const [other] = await database.insert(schema.households).values({ name: "Other" }).returning();
  await database.insert(schema.profiles).values([
    { lineUserId: "self", displayName: "Self", householdId: household.id },
    { lineUserId: "other", displayName: "Other", householdId: other.id },
  ]);
}, 30000);
afterAll(async () => {
  await client.close();
});

describe("Brewlogの店舗登録API", () => {
  it("スペシャルティは店舗なしでも登録でき、レギュラーの購入店を保つ", async () => {
    const specialty = beanSchema.parse(
      await (
        await request("/api/beans", "POST", { name: "Specialty", coffeeType: "specialty" })
      ).json(),
    );
    expect(specialty.storeId).toBeNull();
    const regular = beanSchema.parse(
      await (
        await request("/api/beans", "POST", { name: "Regular", purchaseStore: "Supermarket" })
      ).json(),
    );
    expect(regular.purchaseStore).toBe("Supermarket");
    expect(regular.storeId).toBeNull();
    expect(
      (await request("/api/beans", "POST", { name: "Regular", store: { name: "Shop" } })).status,
    ).toBe(400);
  });

  it("豆と店舗を同時に登録し、店舗選択と編集・解除を反映する", async () => {
    const created = beanSchema.parse(
      await (
        await request("/api/beans", "POST", {
          name: "Bean",
          coffeeType: "specialty",
          store: { name: "Brew Store", prefecture: "東京都", links: ["https://example.com/brew"] },
        })
      ).json(),
    );
    expect(created.storeId).toBeTruthy();
    expect(created.purchaseStore).toBe("Brew Store");
    const reused = beanSchema.parse(
      await (
        await request("/api/beans", "POST", {
          name: "Second bean",
          coffeeType: "specialty",
          storeId: created.storeId,
        })
      ).json(),
    );
    expect(reused.storeId).toBe(created.storeId);
    expect(
      beanSchema.parse(await (await request(`/api/beans/${created.id}`)).json()).purchaseStore,
    ).toBe("Brew Store");
    expect(
      beanSchema
        .array()
        .parse(await (await request("/api/beans")).json())
        .some((bean) => bean.storeId === created.storeId),
    ).toBe(true);
    const unlinked = beanSchema.parse(
      await (await request(`/api/beans/${created.id}`, "PATCH", { storeId: null })).json(),
    );
    expect(unlinked.storeId).toBeNull();
    const regular = beanSchema.parse(
      await (
        await request(`/api/beans/${reused.id}`, "PATCH", {
          coffeeType: "regular",
          purchaseStore: "Supermarket",
        })
      ).json(),
    );
    expect(regular.storeId).toBeNull();
    expect(regular.purchaseStore).toBe("Supermarket");
    expect((await request(`/api/beans/${created.id}`, "GET", undefined, "other")).status).toBe(404);
  });

  it("不明な店舗や同時の選択と新規登録を拒否する", async () => {
    const missingId = "00000000-0000-4000-8000-000000000099";
    expect(
      (
        await request("/api/beans", "POST", {
          name: "Bean",
          coffeeType: "specialty",
          storeId: missingId,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await request("/api/beans", "POST", {
          name: "Bean",
          coffeeType: "specialty",
          storeId: missingId,
          store: { name: "Shop" },
        })
      ).status,
    ).toBe(400);
    expect((await request(`/api/stores/${missingId}`)).status).toBe(404);
    expect((await request("/api/stores/invalid")).status).toBe(400);
  });
});
