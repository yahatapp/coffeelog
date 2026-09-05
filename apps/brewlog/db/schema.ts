import { pgSchema, text, uuid, timestamp, integer, boolean, date, real } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const brewlogSchema = pgSchema("brewlog");

export const coffeeTypes = ["regular", "specialty"] as const;
export type CoffeeType = (typeof coffeeTypes)[number];

export const households = brewlogSchema.table("households", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const householdsRelations = relations(households, ({ many }) => ({
  profiles: many(profiles),
  beans: many(beans),
  brewLogs: many(brewLogs),
  drippers: many(drippers),
  grinders: many(grinders),
}));

export const profiles = brewlogSchema.table("profiles", {
  lineUserId: text("line_user_id").primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  household: one(households, {
    fields: [profiles.householdId],
    references: [households.id],
  }),
  brewLogs: many(brewLogs),
}));

export const beans = brewlogSchema.table("beans", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  parentBeanId: uuid("parent_bean_id").references((): AnyPgColumn => beans.id),
  version: text("version"),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id),
  name: text("name").notNull(),
  coffeeType: text("coffee_type").$type<CoffeeType>().default("regular").notNull(),
  origin: text("origin"),
  purchaseStore: text("purchase_store"),
  roastLevel: integer("roast_level"), // 1:浅煎り 〜 5:深煎り 等
  roastDate: date("roast_date"),
  purchaseDate: date("purchase_date"),
  imageUrl: text("image_url"),
  processMethod: text("process_method"),
  note: text("note"),
  isArchived: boolean("is_archived").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const beansRelations = relations(beans, ({ one, many }) => ({
  household: one(households, {
    fields: [beans.householdId],
    references: [households.id],
  }),
  parentBean: one(beans, {
    fields: [beans.parentBeanId],
    references: [beans.id],
    relationName: "beanVersions",
  }),
  versions: many(beans, { relationName: "beanVersions" }),
  brewLogs: many(brewLogs),
}));

export const brewLogs = brewlogSchema.table("brew_logs", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  beanId: uuid("bean_id")
    .notNull()
    .references(() => beans.id),
  userId: text("user_id")
    .notNull()
    .references(() => profiles.lineUserId),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id),
  method: text("method"),
  grindSize: integer("grind_size"), // Changed from text to integer for click count
  waterTemp: integer("water_temp"),
  beanAmount: real("bean_amount"),
  waterAmount: real("water_amount"),
  rating: real("rating"),
  note: text("note"),
  brewDate: date("brew_date"), // Actual brewing date, optional
  dripperId: uuid("dripper_id").references(() => drippers.id), // Reference to dripper master
  grinderId: uuid("grinder_id").references(() => grinders.id), // Reference to grinder master
  tempType: text("temp_type").default("hot").notNull(),
  iceAmount: real("ice_amount"),
  yieldAmount: real("yield_amount"),
  drawdownTime: integer("drawdown_time"),
  bloomingTime: integer("blooming_time"),
  hasBypass: boolean("has_bypass").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brewLogsRelations = relations(brewLogs, ({ one, many }) => ({
  bean: one(beans, {
    fields: [brewLogs.beanId],
    references: [beans.id],
  }),
  user: one(profiles, {
    fields: [brewLogs.userId],
    references: [profiles.lineUserId],
  }),
  household: one(households, {
    fields: [brewLogs.householdId],
    references: [households.id],
  }),
  dripper: one(drippers, {
    fields: [brewLogs.dripperId],
    references: [drippers.id],
  }),
  grinder: one(grinders, {
    fields: [brewLogs.grinderId],
    references: [grinders.id],
  }),
  pours: many(brewPours),
}));

export const drippers = brewlogSchema.table("drippers", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id),
  name: text("name").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const drippersRelations = relations(drippers, ({ one, many }) => ({
  household: one(households, {
    fields: [drippers.householdId],
    references: [households.id],
  }),
  brewLogs: many(brewLogs),
}));

export const grinders = brewlogSchema.table("grinders", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id),
  name: text("name").notNull(),
  fineMax: integer("fine_max").default(6).notNull(),
  mediumFineMax: integer("medium_fine_max").default(9).notNull(),
  mediumMax: integer("medium_max").default(15).notNull(),
  mediumCoarseMax: integer("medium_coarse_max").default(22).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const grindersRelations = relations(grinders, ({ one, many }) => ({
  household: one(households, {
    fields: [grinders.householdId],
    references: [households.id],
  }),
  brewLogs: many(brewLogs),
}));

export const brewPours = brewlogSchema.table("brew_pours", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  brewLogId: uuid("brew_log_id")
    .notNull()
    .references(() => brewLogs.id, { onDelete: "cascade" }),
  pourNumber: integer("pour_number").notNull(),
  waterAmount: real("water_amount").notNull(),
  duration: integer("duration").notNull(),
  pourType: text("pour_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brewPoursRelations = relations(brewPours, ({ one }) => ({
  brewLog: one(brewLogs, {
    fields: [brewPours.brewLogId],
    references: [brewLogs.id],
  }),
}));
