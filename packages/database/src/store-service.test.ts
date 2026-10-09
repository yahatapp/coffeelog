import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { findStore, loadStoreHistory, resolveStore } from "./store-service";
import { storeInputSchema } from "./store-contracts";
import { cafeLogs } from "./cafelog";
import { beans, brewLogs } from "./brewlog";
import { stores } from "./stores";

const client = new PGlite();
const db = drizzle(client);
const household = "00000000-0000-4000-8000-000000000001";
const otherHousehold = "00000000-0000-4000-8000-000000000002";
const legacyCafeId = "00000000-0000-4000-8000-000000000010";
const legacyBeanId = "00000000-0000-4000-8000-000000000020";
const migrations = (relative: string) =>
  readMigrationFiles({ migrationsFolder: fileURLToPath(new URL(relative, import.meta.url)) });
const cafeMigrations = migrations("../../../apps/cafelog/db/migrations");
const brewMigrations = migrations("../../../apps/brewlog/db/migrations");
const sharedMigrations = migrations("../db/migrations");
const brewStoreMigrationIndex = brewMigrations.findIndex(({ sql }) =>
  sql.some((statement) =>
    statement.includes('ALTER TABLE "brewlog"."beans" ADD COLUMN "store_id"'),
  ),
);
const legacyBrewId = "00000000-0000-4000-8000-000000000030";

beforeAll(async () => {
  expect(brewStoreMigrationIndex).toBeGreaterThan(0);
  for (const migration of [
    ...cafeMigrations.slice(0, -1),
    ...brewMigrations.slice(0, brewStoreMigrationIndex),
  ]) {
    await client.exec(migration.sql.join("\n"));
  }
  await client.exec(`
    INSERT INTO brewlog.households (id, name) VALUES ('${household}', 'Household'), ('${otherHousehold}', 'Other');
    INSERT INTO brewlog.profiles (line_user_id, household_id, display_name) VALUES
      ('self', '${household}', 'Self'), ('partner', '${household}', 'Partner'), ('other', '${otherHousehold}', 'Other');
    INSERT INTO cafelog.profiles (line_user_id, display_name) VALUES ('self', 'Self'), ('other', 'Other');
    INSERT INTO cafelog.cafe_logs (id, user_id, cafe_name, prefecture, note) VALUES
      ('${legacyCafeId}', 'self', ' Harbor Coffee ', '東京都', 'Preserved cafe note');
    INSERT INTO cafelog.cafe_logs (user_id, cafe_name, prefecture) VALUES
      ('self', 'harbor coffee', '東京都'), ('self', 'Branch Coffee', '東京都'),
      ('self', 'Branch Coffee', '大阪府'), ('self', ' ', NULL);
    INSERT INTO cafelog.cafe_log_links (cafe_log_id, url, type, position) VALUES
      ('${legacyCafeId}', 'https://example.com', 'website', 0);
    INSERT INTO brewlog.beans (id, household_id, name, coffee_type, purchase_store, is_archived) VALUES
      ('${legacyBeanId}', '${household}', 'Ethiopia', 'specialty', 'Harbor Coffee', true);
    INSERT INTO brewlog.beans (household_id, name, coffee_type, purchase_store) VALUES
      ('${household}', 'Branch bean', 'specialty', 'Branch Coffee'),
      ('${household}', 'Regular bean', 'regular', 'Supermarket');
    INSERT INTO brewlog.brew_logs (id, bean_id, user_id, household_id, note) VALUES
      ('${legacyBrewId}', '${legacyBeanId}', 'self', '${household}', 'Preserved tasting note');
  `);
  for (const migration of [
    ...sharedMigrations,
    ...cafeMigrations.slice(-1),
    ...brewMigrations.slice(brewStoreMigrationIndex),
  ]) {
    await client.exec(migration.sql.join("\n"));
  }
}, 30000);
afterAll(async () => {
  await client.close();
});

describe("既存記録を保つ店舗移行", () => {
  it("抽出コメントの追加後も既存のノートと店舗関連を保つ", async () => {
    const [log] = await db.select().from(brewLogs).where(eq(brewLogs.id, legacyBrewId));
    expect(log.note).toBe("Preserved tasting note");
    expect(log.brewComment).toBeNull();
    const [bean] = await db.select().from(beans).where(eq(beans.id, log.beanId));
    expect(bean.storeId).toBeTruthy();
  });
  it("店舗名とリンクを移し、元の情報とメモを保つ", async () => {
    const [log] = await db.select().from(cafeLogs).where(eq(cafeLogs.id, legacyCafeId));
    const store = await findStore(db, log.storeId);
    expect(store?.name.toLowerCase()).toBe("harbor coffee");
    expect(store?.links).toEqual(["https://example.com"]);
    expect(log.cafeName).toBe(" Harbor Coffee ");
    expect(log.note).toBe("Preserved cafe note");
    expect((await db.select().from(cafeLogs)).every((record) => record.storeId)).toBe(true);
  });
  it("スペシャルティの購入店を再利用し、レギュラーの購入店は保つ", async () => {
    const [log] = await db.select().from(cafeLogs).where(eq(cafeLogs.id, legacyCafeId));
    const [bean] = await db.select().from(beans).where(eq(beans.id, legacyBeanId));
    expect(bean.storeId).toBe(log.storeId);
    expect(bean.purchaseStore).toBe("Harbor Coffee");
    expect(bean.isArchived).toBe(true);
    const [regular] = await db.select().from(beans).where(eq(beans.name, "Regular bean"));
    expect(regular.storeId).toBeNull();
    expect(regular.purchaseStore).toBe("Supermarket");
  });
  it("同名の別店舗の都道府県を推測しない", async () => {
    const [bean] = await db.select().from(beans).where(eq(beans.name, "Branch bean"));
    expect(bean.storeId).toBeTruthy();
    expect((await findStore(db, bean.storeId ?? ""))?.prefecture).toBeNull();
  });
});

describe("店舗登録と履歴の共有", () => {
  it("都道府県未登録の店舗を後から補完してもIDとリンクを保つ", async () => {
    const created = await resolveStore(db, {
      name: "Unlocated Store",
      links: ["https://example.com/unlocated"],
    });
    const completed = await resolveStore(db, { name: "Unlocated Store", prefecture: "東京都" });
    expect(completed.id).toBe(created.id);
    expect(completed.prefecture).toBe("東京都");
    expect(completed.links).toEqual(created.links);
    expect((await resolveStore(db, { name: "Unlocated Store" })).id).toBe(created.id);
  });
  it("前後の空白や大文字小文字で重複を作らず、未指定のリンクを保つ", async () => {
    const created = await resolveStore(db, {
      name: " Shared Store ",
      prefecture: "愛知県",
      links: ["https://example.com/shared"],
    });
    const reused = await resolveStore(db, { name: "shared store", prefecture: "愛知県" });
    expect(reused.id).toBe(created.id);
    expect(reused.links).toEqual(created.links);
    expect((await resolveStore(db, { name: "Shared Store", prefecture: "大阪府" })).id).not.toBe(
      created.id,
    );
  });
  it("記録の保存失敗時は新しい店舗もロールバックする", async () => {
    await expect(
      db.transaction(async (tx) => {
        const store = await resolveStore(tx, { name: "Rollback Store" });
        await tx.insert(cafeLogs).values({ userId: "missing-profile", storeId: store.id });
      }),
    ).rejects.toThrow();
    expect(await db.select().from(stores).where(eq(stores.name, "Rollback Store"))).toEqual([]);
  });
  it("本人の来店記録と世帯の抽出記録を返し、他人・別世帯の記録を除外する", async () => {
    const store = await resolveStore(db, { name: "History Store" });
    const [ownCafe] = await db
      .insert(cafeLogs)
      .values({ userId: "self", storeId: store.id })
      .returning();
    await db.insert(cafeLogs).values({ userId: "other", storeId: store.id });
    const [ownBean] = await db
      .insert(beans)
      .values({
        householdId: household,
        name: "Own bean",
        coffeeType: "specialty",
        storeId: store.id,
        isArchived: true,
        deletedAt: new Date(),
      })
      .returning();
    const [otherBean] = await db
      .insert(beans)
      .values({ householdId: otherHousehold, name: "Other bean", storeId: store.id })
      .returning();
    const [ownBrew] = await db
      .insert(brewLogs)
      .values({
        beanId: ownBean.id,
        userId: "partner",
        householdId: household,
        note: "Household history",
      })
      .returning();
    await db
      .insert(brewLogs)
      .values({ beanId: otherBean.id, userId: "other", householdId: otherHousehold });
    const history = await loadStoreHistory(db, store.id, "self");
    expect(history.cafeRecords.map((record) => record.id)).toEqual([ownCafe.id]);
    expect(history.brewRecords.map((record) => record.id)).toEqual([ownBrew.id]);
    expect(history.brewRecords[0].beanId).toBe(ownBean.id);
    expect(history.brewRecords[0].note).toBe("Household history");
    expect((await loadStoreHistory(db, store.id, "cafe-only")).brewRecords).toEqual([]);
  });
  it("日付がない記録を日付付きの記録より後に返す", async () => {
    const store = await resolveStore(db, { name: "History Order Store" });
    const cafeRecords = await db
      .insert(cafeLogs)
      .values([
        { userId: "self", storeId: store.id },
        { userId: "self", storeId: store.id, visitDate: "2025-01-01" },
        { userId: "self", storeId: store.id, visitDate: "2026-01-01" },
      ])
      .returning();
    const [bean] = await db
      .insert(beans)
      .values({ householdId: household, name: "Order bean", storeId: store.id })
      .returning();
    const brewRecords = await db
      .insert(brewLogs)
      .values([
        { beanId: bean.id, userId: "self", householdId: household },
        {
          beanId: bean.id,
          userId: "self",
          householdId: household,
          brewDate: "2025-01-01",
        },
        {
          beanId: bean.id,
          userId: "self",
          householdId: household,
          brewDate: "2026-01-01",
        },
      ])
      .returning();

    const history = await loadStoreHistory(db, store.id, "self");
    expect(history.cafeRecords.map(({ id }) => id)).toEqual([
      cafeRecords[2].id,
      cafeRecords[1].id,
      cafeRecords[0].id,
    ]);
    expect(history.brewRecords.map(({ id }) => id)).toEqual([
      brewRecords[2].id,
      brewRecords[1].id,
      brewRecords[0].id,
    ]);
  });
});

describe("店舗の入力検証", () => {
  it("空の店舗名、危険なリンク、11件以上のリンクを拒否する", () => {
    expect(storeInputSchema.safeParse({ name: " " }).success).toBe(false);
    expect(
      storeInputSchema.safeParse({ name: "Store", links: ["javascript:alert(1)"] }).success,
    ).toBe(false);
    expect(
      storeInputSchema.safeParse({
        name: "Store",
        links: Array.from({ length: 11 }, () => "https://example.com"),
      }).success,
    ).toBe(false);
  });
});
