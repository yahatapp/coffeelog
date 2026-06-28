import { pgSchema, text, uuid, timestamp, integer, real, date } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Brewlogと同じSupabase DB内にスキーマを分離
export const cafelogSchema = pgSchema("cafelog");

// ユーザープロフィール
export const profiles = cafelogSchema.table("profiles", {
  lineUserId: text("line_user_id").primaryKey(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  cafeLogs: many(cafeLogs),
}));

// カフェ訪問・コーヒー評価ログ
export const cafeLogs = cafelogSchema.table("cafe_logs", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id")
    .notNull()
    .references(() => profiles.lineUserId),
  cafeName: text("cafe_name").notNull(),
  origin: text("origin"),
  region: text("region"),
  variety: text("variety"),
  farm: text("farm"),
  process: text("process"),
  roast: text("roast"),
  rating: real("rating"), // 1〜5
  price: integer("price"), // 円
  note: text("note"),
  visitDate: date("visit_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cafeLogsRelations = relations(cafeLogs, ({ one }) => ({
  user: one(profiles, {
    fields: [cafeLogs.userId],
    references: [profiles.lineUserId],
  }),
}));
