import { Hono } from "hono";
import type { Context } from "hono";
import { getDb } from "./db";
import { authMiddleware } from "./middleware/auth";
import { zValidator } from "@hono/zod-validator";
import {
  beans as beansTable,
  households,
  profiles,
  brewLogs,
  drippers,
  grinders,
  brewPours,
} from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import type { Env } from "./types";
import {
  beanCreateSchema as createBeanSchema,
  beanUpdateSchema as updateBeanSchema,
  dripperCreateSchema as createDripperSchema,
  dripperUpdateSchema as updateDripperSchema,
  grinderCreateSchema as createGrinderSchema,
  grinderUpdateSchema as updateGrinderSchema,
  logCreateSchema as createLogSchema,
  logUpdateSchema as updateLogSchema,
} from "../contracts";

const initSchema = z.object({
  displayName: z.string(),
  avatarUrl: z.string().optional().nullable(),
});

const app = new Hono<Env>();

// Apply authentication middleware to all routes
app.use("/*", authMiddleware);

// Generate a basePath router for /api

// Helper to get householdId
async function getHouseholdId(c: Context<Env>) {
  const lineUserId = c.get("lineUserId");
  const db = getDb(c.env.DATABASE_URL);
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.lineUserId, lineUserId),
  });
  if (!profile) {
    throw new HTTPException(401, { message: "Profile not initialized" });
  }
  return profile.householdId;
}

// All route definitions in a single chained router directly on the basePath router to avoid .route() type-propagation bugs
const api = app
  .post("/api/auth/init", zValidator("json", initSchema), async (c) => {
    const lineUserId = c.get("lineUserId");
    const { displayName, avatarUrl } = c.req.valid("json");
    const db = getDb(c.env.DATABASE_URL);

    // Get or Create profile & household in a single flow
    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.lineUserId, lineUserId),
      with: { household: true },
    });

    if (existing) {
      return c.json({ profile: existing, household: existing.household });
    }

    const result = await db.transaction(async (tx) => {
      const [newHousehold] = await tx
        .insert(households)
        .values({ name: `${displayName}'s Household` })
        .returning();

      const [newProfile] = await tx
        .insert(profiles)
        .values({
          lineUserId,
          householdId: newHousehold.id,
          displayName,
          avatarUrl,
        })
        .returning();

      return { profile: newProfile, household: newHousehold };
    });

    return c.json(result);
  })
  .get("/api/beans", async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);
    return c.json(
      await db.query.beans.findMany({
        where: eq(beansTable.householdId, householdId),
        orderBy: [desc(beansTable.createdAt)],
      }),
    );
  })
  .get("/api/beans/:id", async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);
    const bean = await db.query.beans.findFirst({
      where: and(eq(beansTable.id, c.req.param("id")), eq(beansTable.householdId, householdId)),
    });
    if (!bean) throw new HTTPException(404, { message: "Bean not found" });
    return c.json(bean);
  })
  .post("/api/beans", zValidator("json", createBeanSchema), async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);
    const [newBean] = await db
      .insert(beansTable)
      .values({ ...c.req.valid("json"), householdId })
      .returning();
    return c.json(newBean);
  })
  .patch("/api/beans/:id", zValidator("json", updateBeanSchema), async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);
    const [updatedBean] = await db
      .update(beansTable)
      .set(c.req.valid("json"))
      .where(and(eq(beansTable.id, c.req.param("id")), eq(beansTable.householdId, householdId)))
      .returning();

    if (!updatedBean) throw new HTTPException(404, { message: "Bean not found" });
    return c.json(updatedBean);
  })
  .get("/api/logs", async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);
    const logs = await db.query.brewLogs.findMany({
      where: eq(brewLogs.householdId, householdId),
      with: { bean: true, user: true, dripper: true, grinder: true, pours: true },
      orderBy: [desc(brewLogs.createdAt)],
    });

    for (const log of logs) {
      if (log.pours) {
        log.pours.sort((a, b) => a.pourNumber - b.pourNumber);
      }
    }

    return c.json(logs);
  })
  .get("/api/logs/:id", async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);
    const log = await db.query.brewLogs.findFirst({
      where: and(eq(brewLogs.id, c.req.param("id")), eq(brewLogs.householdId, householdId)),
      with: { bean: true, user: true, dripper: true, grinder: true, pours: true },
    });
    if (!log) throw new HTTPException(404, { message: "Log not found" });

    if (log.pours) {
      log.pours.sort((a, b) => a.pourNumber - b.pourNumber);
    }

    return c.json(log);
  })
  .post("/api/logs", zValidator("json", createLogSchema), async (c) => {
    const lineUserId = c.get("lineUserId");
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);

    const { pours, ...logData } = c.req.valid("json");

    const result = await db.transaction(async (tx) => {
      const [newLog] = await tx
        .insert(brewLogs)
        .values({ ...logData, userId: lineUserId, householdId })
        .returning();

      if (pours && pours.length > 0) {
        await tx.insert(brewPours).values(
          pours.map((pour) => ({
            ...pour,
            brewLogId: newLog.id,
          })),
        );
      }

      const completeLog = await tx.query.brewLogs.findFirst({
        where: eq(brewLogs.id, newLog.id),
        with: { bean: true, user: true, dripper: true, grinder: true, pours: true },
      });

      if (completeLog && completeLog.pours) {
        completeLog.pours.sort((a, b) => a.pourNumber - b.pourNumber);
      }

      return completeLog;
    });

    if (!result) throw new HTTPException(500, { message: "Failed to create log" });
    return c.json(result);
  })
  .patch("/api/logs/:id", zValidator("json", updateLogSchema), async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);

    const { pours, ...logData } = c.req.valid("json");

    const result = await db.transaction(async (tx) => {
      const [updatedLog] = await tx
        .update(brewLogs)
        .set(logData)
        .where(and(eq(brewLogs.id, c.req.param("id")), eq(brewLogs.householdId, householdId)))
        .returning();

      if (!updatedLog) return null;

      if (pours !== undefined) {
        await tx.delete(brewPours).where(eq(brewPours.brewLogId, updatedLog.id));

        if (pours.length > 0) {
          await tx.insert(brewPours).values(
            pours.map((pour) => ({
              ...pour,
              brewLogId: updatedLog.id,
            })),
          );
        }
      }

      const completeLog = await tx.query.brewLogs.findFirst({
        where: eq(brewLogs.id, updatedLog.id),
        with: { bean: true, user: true, dripper: true, grinder: true, pours: true },
      });

      if (completeLog && completeLog.pours) {
        completeLog.pours.sort((a, b) => a.pourNumber - b.pourNumber);
      }

      return completeLog;
    });

    if (!result) throw new HTTPException(404, { message: "Log not found" });
    return c.json(result);
  })
  .get("/api/drippers", async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);
    return c.json(
      await db.query.drippers.findMany({
        where: eq(drippers.householdId, householdId),
        orderBy: [desc(drippers.createdAt)],
      }),
    );
  })
  .post("/api/drippers", zValidator("json", createDripperSchema), async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);
    const data = c.req.valid("json");

    const newDripper = await db.transaction(async (tx) => {
      if (data.isDefault) {
        await tx
          .update(drippers)
          .set({ isDefault: false })
          .where(eq(drippers.householdId, householdId));
      }
      const [inserted] = await tx
        .insert(drippers)
        .values({ ...data, householdId })
        .returning();
      return inserted;
    });
    return c.json(newDripper);
  })
  .patch("/api/drippers/:id", zValidator("json", updateDripperSchema), async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);
    const data = c.req.valid("json");

    const updated = await db.transaction(async (tx) => {
      if (data.isDefault) {
        await tx
          .update(drippers)
          .set({ isDefault: false })
          .where(eq(drippers.householdId, householdId));
      }
      const [res] = await tx
        .update(drippers)
        .set(data)
        .where(and(eq(drippers.id, c.req.param("id")), eq(drippers.householdId, householdId)))
        .returning();
      return res;
    });

    if (!updated) throw new HTTPException(404, { message: "Dripper not found" });
    return c.json(updated);
  })
  .delete("/api/drippers/:id", async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);
    const [deletedDripper] = await db
      .delete(drippers)
      .where(and(eq(drippers.id, c.req.param("id")), eq(drippers.householdId, householdId)))
      .returning();
    if (!deletedDripper) throw new HTTPException(404, { message: "Dripper not found" });
    return c.json(deletedDripper);
  })
  .get("/api/grinders", async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);
    return c.json(
      await db.query.grinders.findMany({
        where: eq(grinders.householdId, householdId),
        orderBy: [desc(grinders.createdAt)],
      }),
    );
  })
  .post("/api/grinders", zValidator("json", createGrinderSchema), async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);
    const data = c.req.valid("json");

    const newGrinder = await db.transaction(async (tx) => {
      if (data.isDefault) {
        await tx
          .update(grinders)
          .set({ isDefault: false })
          .where(eq(grinders.householdId, householdId));
      }
      const [inserted] = await tx
        .insert(grinders)
        .values({ ...data, householdId })
        .returning();
      return inserted;
    });
    return c.json(newGrinder);
  })
  .patch("/api/grinders/:id", zValidator("json", updateGrinderSchema), async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);
    const data = c.req.valid("json");

    const updated = await db.transaction(async (tx) => {
      if (data.isDefault) {
        await tx
          .update(grinders)
          .set({ isDefault: false })
          .where(eq(grinders.householdId, householdId));
      }
      const [res] = await tx
        .update(grinders)
        .set(data)
        .where(and(eq(grinders.id, c.req.param("id")), eq(grinders.householdId, householdId)))
        .returning();
      return res;
    });

    if (!updated) throw new HTTPException(404, { message: "Grinder not found" });
    return c.json(updated);
  })
  .delete("/api/grinders/:id", async (c) => {
    const householdId = await getHouseholdId(c);
    const db = getDb(c.env.DATABASE_URL);
    const [deletedGrinder] = await db
      .delete(grinders)
      .where(and(eq(grinders.id, c.req.param("id")), eq(grinders.householdId, householdId)))
      .returning();
    if (!deletedGrinder) throw new HTTPException(404, { message: "Grinder not found" });
    return c.json(deletedGrinder);
  });

export default app;
export type AppType = typeof api;
