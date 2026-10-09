import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { stores } from "./stores";
import { cafeLogs } from "./cafelog";
import { beans, brewLogs, profiles } from "./brewlog";
import type { StoreInput } from "./store-contracts";

// Select/insert work identically on a database and its transaction. Callers keep
// store resolution and record creation in the same transaction.
export type StoreExecutor<T extends PgQueryResultHKT> = Pick<
  PgDatabase<T>,
  "select" | "insert" | "update"
>;

export const listStores = <T extends PgQueryResultHKT>(db: StoreExecutor<T>) =>
  db.select().from(stores).orderBy(asc(stores.name), asc(stores.prefecture));

export const findStore = async <T extends PgQueryResultHKT>(db: StoreExecutor<T>, id: string) => {
  const [store] = await db.select().from(stores).where(eq(stores.id, id));
  return store;
};

export const resolveStore = async <T extends PgQueryResultHKT>(
  db: StoreExecutor<T>,
  input: StoreInput,
) => {
  const name = input.name.trim();
  const links = input.links === undefined ? undefined : [...new Set(input.links)];
  const candidates = await db.select().from(stores).where(eq(stores.nameKey, name.toLowerCase()));
  const candidate = candidates.length === 1 ? candidates[0] : undefined;
  // A uniquely named shop can be reused when either app has not supplied its
  // prefecture yet. Enrich missing metadata without losing existing record IDs.
  if (candidate && (!input.prefecture || !candidate.prefecture)) {
    const [updated] = await db
      .update(stores)
      .set({
        name,
        ...(input.prefecture ? { prefecture: input.prefecture } : {}),
        ...(links === undefined ? {} : { links }),
      })
      .where(
        and(
          eq(stores.id, candidate.id),
          input.prefecture && !candidate.prefecture ? isNull(stores.prefecture) : undefined,
        ),
      )
      .returning();
    if (updated) return updated;
  }
  const [store] = await db
    .insert(stores)
    .values({ name, prefecture: input.prefecture ?? null, links: links ?? [] })
    .onConflictDoUpdate({
      target: [stores.nameKey, stores.prefectureKey],
      set: { name, ...(links !== undefined ? { links } : {}) },
    })
    .returning();
  return store;
};

export const loadStoreHistory = async <T extends PgQueryResultHKT>(
  db: StoreExecutor<T>,
  storeId: string,
  lineUserId: string,
) => {
  const [cafeRecords, brewRecords] = await Promise.all([
    db
      .select({
        id: cafeLogs.id,
        visitDate: cafeLogs.visitDate,
        origin: cafeLogs.origin,
        region: cafeLogs.region,
        variety: cafeLogs.variety,
        farm: cafeLogs.farm,
        producer: cafeLogs.producer,
        process: cafeLogs.process,
        roast: cafeLogs.roast,
        isBlend: cafeLogs.isBlend,
        servingStyle: cafeLogs.servingStyle,
        flavorNote: cafeLogs.flavorNote,
        rating: cafeLogs.rating,
        price: cafeLogs.price,
        note: cafeLogs.note,
      })
      .from(cafeLogs)
      .where(and(eq(cafeLogs.storeId, storeId), eq(cafeLogs.userId, lineUserId)))
      .orderBy(sql`${desc(cafeLogs.visitDate)} nulls last`, desc(cafeLogs.createdAt)),
    db
      .select({
        id: brewLogs.id,
        beanId: beans.id,
        beanName: beans.name,
        beanVersion: beans.version,
        origin: beans.origin,
        region: beans.region,
        variety: beans.variety,
        farm: beans.farm,
        producer: beans.producer,
        process: beans.processMethod,
        roastLevel: beans.roastLevel,
        brewDate: brewLogs.brewDate,
        method: brewLogs.method,
        tempType: brewLogs.tempType,
        grindSize: brewLogs.grindSize,
        waterTemp: brewLogs.waterTemp,
        beanAmount: brewLogs.beanAmount,
        waterAmount: brewLogs.waterAmount,
        rating: brewLogs.rating,
        note: brewLogs.note,
      })
      .from(brewLogs)
      .innerJoin(
        beans,
        and(eq(brewLogs.beanId, beans.id), eq(brewLogs.householdId, beans.householdId)),
      )
      .innerJoin(
        profiles,
        and(eq(profiles.householdId, brewLogs.householdId), eq(profiles.lineUserId, lineUserId)),
      )
      .where(eq(beans.storeId, storeId))
      .orderBy(sql`${desc(brewLogs.brewDate)} nulls last`, desc(brewLogs.createdAt)),
  ]);
  // Keep records for archived/soft-deleted beans: brewing history is retained.
  return { cafeRecords, brewRecords };
};
