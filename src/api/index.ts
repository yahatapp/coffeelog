import { Hono } from "hono";
import { getDb } from "./db";
import { authMiddleware } from "./middleware/auth";
import { zValidator } from "@hono/zod-validator";
import { profiles, cafeLogs } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";

const initSchema = z.object({
  displayName: z.string(),
  avatarUrl: z.string().optional().nullable(),
});

const cafeUrlSchema = z.url().refine((url) => ["http:", "https:"].includes(new URL(url).protocol), {
  message: "URL must use http or https",
});

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
  rating: z.number().min(1).max(5).optional().nullable(),
  price: z.number().int().nonnegative().optional().nullable(),
  note: z.string().optional().nullable(),
  visitDate: z.string().optional().nullable(),
});

type Bindings = {
  DATABASE_URL: string;
  LINE_CHANNEL_ID: string;
  ALLOWED_LINE_USER_IDS: string;
};

type Variables = {
  lineUserId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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

    const [deletedLog] = await db
      .delete(cafeLogs)
      .where(eq(cafeLogs.id, c.req.param("id")))
      .returning();

    return c.json(deletedLog);
  });

export default app;
export type AppType = typeof api;
