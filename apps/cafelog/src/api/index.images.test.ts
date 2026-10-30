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

const objects = new Map<string, Uint8Array>();
const bucket = {
  put: vi.fn(async (key: string, bytes: Uint8Array) => {
    objects.set(key, bytes);
  }),
  delete: vi.fn(async (key: string) => {
    objects.delete(key);
  }),
};
const bindings = { DATABASE_URL: "postgres://test.invalid/db", CAFELOG_IMAGES: bucket };
const createLog = async () => {
  const response = await app.request(
    "/api/logs",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cafeName: "Photo Cafe" }),
    },
    bindings,
  );
  return z.object({ id: z.uuid() }).parse(await response.json()).id;
};
const upload = (logId: string, imageId?: string, user = "self") => {
  const body = new FormData();
  body.append(
    "image",
    new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "photo.jpg", { type: "image/jpeg" }),
  );
  if (imageId) body.append("imageId", imageId);
  return app.request(
    `/api/logs/${logId}/images`,
    {
      method: "POST",
      headers: { "X-Test-User": user },
      body,
    },
    bindings,
  );
};
const imageMeta = z.object({ id: z.uuid(), position: z.number() });

beforeAll(async () => {
  client = await createTestDatabase();
  database = createDb(client);
  await database.insert(schema.profiles).values([{ lineUserId: "self", displayName: "Self" }]);
}, 30000);
afterAll(async () => {
  await client.close();
});

describe("写真アップロードAPI", () => {
  it("応答消失後の再送でも写真を重複保存しない", async () => {
    const logId = await createLog();
    const imageId = crypto.randomUUID();
    const first = await upload(logId, imageId);
    const saved = imageMeta.parse(await first.json());
    expect(first.status).toBe(201);
    const retry = await upload(logId, imageId);
    expect(retry.status).toBe(200);
    expect(imageMeta.parse(await retry.json())).toEqual(saved);
    const rows = await database
      .select()
      .from(schema.cafeLogImages)
      .where(eq(schema.cafeLogImages.cafeLogId, logId));
    expect(rows).toHaveLength(1);
    expect(objects.has(rows[0].objectKey)).toBe(true);
  });

  it("5枚保存した後でも保存済みIDの再送は成功し、6枚目は拒否する", async () => {
    const logId = await createLog();
    const ids = Array.from({ length: 5 }, () => crypto.randomUUID());
    for (const id of ids) expect((await upload(logId, id)).status).toBe(201);
    expect((await upload(logId, ids[4])).status).toBe(200);
    expect((await upload(logId, crypto.randomUUID())).status).toBe(400);
  });

  it("同じIDの並行送信でも保存済みオブジェクトを削除しない", async () => {
    const logId = await createLog();
    const id = crypto.randomUUID();
    // Both requests pass the initial lookup before either inserts metadata.
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let arrivals = 0;
    const put = async (key: string, bytes: Uint8Array) => {
      objects.set(key, bytes);
      if (++arrivals === 2) release();
      await gate;
    };
    bucket.put.mockImplementationOnce(put).mockImplementationOnce(put);
    const responses = await Promise.all([upload(logId, id), upload(logId, id)]);
    expect(responses.map((response) => response.status).sort((a, b) => a - b)).toEqual([200, 201]);
    const rows = await database
      .select()
      .from(schema.cafeLogImages)
      .where(eq(schema.cafeLogImages.cafeLogId, logId));
    expect(rows).toHaveLength(1);
    expect(objects.has(rows[0].objectKey)).toBe(true);
    expect(bucket.delete).not.toHaveBeenCalledWith(rows[0].objectKey);
  });

  it("別の記録の画像IDを流用しても上書きしない", async () => {
    const original = await createLog();
    const other = await createLog();
    const id = crypto.randomUUID();
    await upload(original, id);
    expect((await upload(other, id)).status).toBe(409);
    const [row] = await database
      .select()
      .from(schema.cafeLogImages)
      .where(eq(schema.cafeLogImages.id, id));
    expect(row.cafeLogId).toBe(original);
    expect(objects.has(row.objectKey)).toBe(true);
  });

  it("画像IDなしの従来の送信を受け付け、不正IDと他人の記録への送信を拒否する", async () => {
    const logId = await createLog();
    expect((await upload(logId)).status).toBe(201);
    expect((await upload(logId, "invalid")).status).toBe(400);
    expect((await upload(logId, crypto.randomUUID(), "other")).status).toBe(404);
  });
});
