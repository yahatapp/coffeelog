import { pgSchema, text, uuid, timestamp, jsonb, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { Prefecture } from "./store-contracts";

export const coffeelogSchema = pgSchema("coffeelog");

// Public shop metadata shared by the two allowlisted apps. Coffee records retain
// their original user/household ownership in their respective schemas.
export const stores = coffeelogSchema.table(
  "stores",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    prefecture: text("prefecture").$type<Prefecture>(),
    nameKey: text("name_key")
      .generatedAlwaysAs(sql`lower(btrim("name"))`)
      .notNull(),
    prefectureKey: text("prefecture_key")
      .generatedAlwaysAs(sql`coalesce("prefecture", '')`)
      .notNull(),
    links: jsonb("links").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("stores_name_prefecture_unique").on(table.nameKey, table.prefectureKey),
    check("stores_name_not_blank", sql`length(btrim(${table.name})) > 0`),
  ],
);
