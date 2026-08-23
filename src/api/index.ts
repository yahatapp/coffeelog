import { Hono } from "hono";
import { getDb } from "./db";
import { authMiddleware } from "./middleware/auth";
import { zValidator } from "@hono/zod-validator";
import { profiles, cafeLogs, cafeLogImages } from "../../db/schema";
import { and, asc, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";

const initSchema = z.object({
  displayName: z.string(),
  avatarUrl: z.string().optional().nullable(),
});

const cafeUrlSchema = z.url().refine((url) => ["http:", "https:"].includes(new URL(url).protocol), {
  message: "URL must use http or https",
});

const servingStyleSchema = z.enum(["hot", "iced"]);

const createLogSchema = z.object({
  cafeName: z.string().min(1),
  cafeUrl: cafeUrlSchema.optional().nullable(),
  origin: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  variety: z.string().optional().nullable(),
  farm: z.string().optional().nullable(),
  process: z.string().optional().nullable(),
  roast: z.string().optional().nullable(),
  isBlend: z.boolean().optional().nullable(),
  servingStyle: servingStyleSchema.optional().nullable(),
  rating: z.number().min(1).max(5).optional().nullable(),
  price: z.number().int().nonnegative().optional().nullable(),
  note: z.string().optional().nullable(),
  visitDate: z.string().optional().nullable(),
});

const updateLogSchema = z.object({
  cafeName: z.string().min(1).optional(),
  cafeUrl: cafeUrlSchema.optional().nullable(),
  origin: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  variety: z.string().optional().nullable(),
  farm: z.string().optional().nullable(),
  process: z.string().optional().nullable(),
  roast: z.string().optional().nullable(),
  isBlend: z.boolean().optional().nullable(),
  servingStyle: servingStyleSchema.optional().nullable(),
  rating: z.number().min(1).max(5).optional().nullable(),
  price: z.number().int().nonnegative().optional().nullable(),
  note: z.string().optional().nullable(),
  visitDate: z.string().optional().nullable(),
});

type Bindings = {
  DATABASE_URL: string;
  LINE_CHANNEL_ID: string;
  ALLOWED_LINE_USER_IDS: string;
  CAFELOG_IMAGES: R2Bucket;
};

type Variables = {
  lineUserId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 1024 * 1024;

const assertOwnedLog = async (databaseUrl: string, logId: string, lineUserId: string) => {
  const db = getDb(databaseUrl);
  const log = await db.query.cafeLogs.findFirst({ where: eq(cafeLogs.id, logId) });
  if (!log || log.userId !== lineUserId) {
    throw new HTTPException(404, { message: "Log not found" });
  }
  return { db, log };
};

// Apply authentication middleware to all API routes
app.use("/api/*", authMiddleware);

const api = app
  .post("/api/auth/init", zValidator("json", initSchema), async (c) => {
    const lineUserId = c.get("lineUserId");
    const { displayName, avatarUrl } = c.req.valid("json");
    const db = getDb(c.env.DATABASE_URL);

    // Atomic upsert to prevent unique constraint race conditions
    const [profile] = await db
      .insert(profiles)
      .values({
        lineUserId,
        displayName,
        avatarUrl,
      })
      .onConflictDoUpdate({
        target: profiles.lineUserId,
        set: {
          displayName,
          avatarUrl,
        },
      })
      .returning();

    return c.json({ profile });
  })
  .get("/api/logs", async (c) => {
    const lineUserId = c.get("lineUserId");
    const db = getDb(c.env.DATABASE_URL);
    return c.json(
      await db.query.cafeLogs.findMany({
        where: eq(cafeLogs.userId, lineUserId),
        with: { user: true },
        orderBy: [desc(cafeLogs.createdAt)],
      }),
    );
  })
  .get("/api/logs/:id", async (c) => {
    const lineUserId = c.get("lineUserId");
    const db = getDb(c.env.DATABASE_URL);
    const log = await db.query.cafeLogs.findFirst({
      where: eq(cafeLogs.id, c.req.param("id")),
      with: { user: true },
    });
    if (!log || log.userId !== lineUserId) {
      throw new HTTPException(404, { message: "Log not found" });
    }
    return c.json(log);
  })
  .get("/api/logs/:id/images", async (c) => {
    const { db } = await assertOwnedLog(c.env.DATABASE_URL, c.req.param("id"), c.get("lineUserId"));
    const images = await db.query.cafeLogImages.findMany({
      where: eq(cafeLogImages.cafeLogId, c.req.param("id")),
      orderBy: [asc(cafeLogImages.position)],
    });
    return c.json(images.map(({ objectKey: _objectKey, ...image }) => image));
  })
  .get("/api/logs/:id/images/:imageId", async (c) => {
    const { db } = await assertOwnedLog(c.env.DATABASE_URL, c.req.param("id"), c.get("lineUserId"));
    const image = await db.query.cafeLogImages.findFirst({
      where: and(
        eq(cafeLogImages.id, c.req.param("imageId")),
        eq(cafeLogImages.cafeLogId, c.req.param("id")),
      ),
    });
    if (!image) throw new HTTPException(404, { message: "Image not found" });
    const object = await c.env.CAFELOG_IMAGES.get(image.objectKey);
    if (!object) throw new HTTPException(404, { message: "Image not found" });
    return new Response(object.body, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  })
  .post("/api/logs/:id/images", async (c) => {
    const logId = c.req.param("id");
    const { db } = await assertOwnedLog(c.env.DATABASE_URL, logId, c.get("lineUserId"));
    const existing = await db.query.cafeLogImages.findMany({
      where: eq(cafeLogImages.cafeLogId, logId),
    });
    if (existing.length >= MAX_IMAGES) {
      throw new HTTPException(400, { message: "Up to 5 images can be uploaded" });
    }
    const body = await c.req.parseBody();
    const file = body.image;
    if (!(file instanceof File) || file.type !== "image/jpeg") {
      throw new HTTPException(400, { message: "A JPEG image is required" });
    }
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      throw new HTTPException(400, { message: "Image must be 1 MB or smaller" });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) {
      throw new HTTPException(400, { message: "Invalid JPEG data" });
    }
    const imageId = crypto.randomUUID();
    const objectKey = `logs/${logId}/${imageId}.jpg`;
    await c.env.CAFELOG_IMAGES.put(objectKey, bytes, {
      httpMetadata: { contentType: "image/jpeg" },
    });
    try {
      const [image] = await db
        .insert(cafeLogImages)
        .values({
          id: imageId,
          cafeLogId: logId,
          objectKey,
          position: existing.length,
          contentType: "image/jpeg",
          byteSize: file.size,
        })
        .returning();
      return c.json({ id: image.id, position: image.position }, 201);
    } catch (error) {
      await c.env.CAFELOG_IMAGES.delete(objectKey);
      throw error;
    }
  })
  .post("/api/logs", zValidator("json", createLogSchema), async (c) => {
    const lineUserId = c.get("lineUserId");
    const db = getDb(c.env.DATABASE_URL);

    const [newLog] = await db
      .insert(cafeLogs)
      .values({ ...c.req.valid("json"), userId: lineUserId })
      .returning();

    return c.json(newLog);
  })
  .patch("/api/logs/:id", zValidator("json", updateLogSchema), async (c) => {
    const lineUserId = c.get("lineUserId");
    const db = getDb(c.env.DATABASE_URL);

    // Verify ownership
    const existing = await db.query.cafeLogs.findFirst({
      where: eq(cafeLogs.id, c.req.param("id")),
    });
    if (!existing || existing.userId !== lineUserId) {
      throw new HTTPException(404, { message: "Log not found" });
    }

    const [updatedLog] = await db
      .update(cafeLogs)
      .set(c.req.valid("json"))
      .where(eq(cafeLogs.id, c.req.param("id")))
      .returning();

    return c.json(updatedLog);
  })
  .delete("/api/logs/:id", async (c) => {
    const lineUserId = c.get("lineUserId");
    const db = getDb(c.env.DATABASE_URL);

    const existing = await db.query.cafeLogs.findFirst({
      where: eq(cafeLogs.id, c.req.param("id")),
    });
    if (!existing || existing.userId !== lineUserId) {
      throw new HTTPException(404, { message: "Log not found" });
    }

    const images = await db.query.cafeLogImages.findMany({
      where: eq(cafeLogImages.cafeLogId, c.req.param("id")),
    });

    await Promise.all(images.map((image) => c.env.CAFELOG_IMAGES.delete(image.objectKey)));

    const [deletedLog] = await db
      .delete(cafeLogs)
      .where(eq(cafeLogs.id, c.req.param("id")))
      .returning();

    return c.json(deletedLog);
  });

export default app;
export type AppType = typeof api;
