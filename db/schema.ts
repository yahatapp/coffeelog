import { pgSchema, text, uuid, timestamp, integer, real, date, boolean } from "drizzle-orm/pg-core";
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
  cafeUrl: text("cafe_url"),
  origin: text("origin"),
  region: text("region"),
  variety: text("variety"),
  farm: text("farm"),
  process: text("process"),
  roast: text("roast"),
  isBlend: boolean("is_blend"),
  servingStyle: text("serving_style"), // hot / iced
  rating: real("rating"), // 1〜5
  price: integer("price"), // 円
  note: text("note"),
  visitDate: date("visit_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cafeLogsRelations = relations(cafeLogs, ({ one, many }) => ({
  user: one(profiles, {
    fields: [cafeLogs.userId],
    references: [profiles.lineUserId],
  }),
  images: many(cafeLogImages),
}));

// R2に保存した写真のメタデータ（画像本体はDBに保存しない）
export const cafeLogImages = cafelogSchema.table("cafe_log_images", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  cafeLogId: uuid("cafe_log_id")
    .notNull()
    .references(() => cafeLogs.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull().unique(),
  position: integer("position").notNull(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cafeLogImagesRelations = relations(cafeLogImages, ({ one }) => ({
  cafeLog: one(cafeLogs, {
    fields: [cafeLogImages.cafeLogId],
    references: [cafeLogs.id],
  }),
}));
