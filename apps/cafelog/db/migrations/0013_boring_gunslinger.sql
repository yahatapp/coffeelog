ALTER TABLE "cafelog"."cafe_logs" ALTER COLUMN "cafe_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cafelog"."cafe_logs" ADD COLUMN "store_id" uuid;--> statement-breakpoint

-- Preserve all original shop columns/links. Promote distinct shops and up to ten
-- unique http(s) links; the complete original metadata remains in legacy tables.
INSERT INTO "coffeelog"."stores" ("name", "prefecture", "links")
SELECT shop.name, shop.prefecture,
  COALESCE((
    SELECT jsonb_agg(url ORDER BY url) FROM (
      SELECT DISTINCT btrim(link.url) AS url
      FROM "cafelog"."cafe_logs" AS log
      JOIN "cafelog"."cafe_log_links" AS link ON link.cafe_log_id = log.id
      WHERE lower(COALESCE(NULLIF(btrim(log.cafe_name), ''), '店舗名未登録')) = lower(shop.name)
        AND COALESCE(log.prefecture, '') = COALESCE(shop.prefecture, '')
        AND btrim(link.url) ~* '^https?://'
      ORDER BY url
      LIMIT 10
    ) AS urls
  ), '[]'::jsonb)
FROM (
  SELECT DISTINCT ON (
    lower(COALESCE(NULLIF(btrim(cafe_name), ''), '店舗名未登録')), COALESCE(prefecture, '')
  ) COALESCE(NULLIF(btrim(cafe_name), ''), '店舗名未登録') AS name, prefecture
  FROM "cafelog"."cafe_logs"
  ORDER BY lower(COALESCE(NULLIF(btrim(cafe_name), ''), '店舗名未登録')), COALESCE(prefecture, ''), created_at DESC, id
) AS shop
ON CONFLICT (name_key, prefecture_key) DO NOTHING;
--> statement-breakpoint
UPDATE "cafelog"."cafe_logs" AS log
SET store_id = store.id
FROM "coffeelog"."stores" AS store
WHERE store.name_key = lower(COALESCE(NULLIF(btrim(log.cafe_name), ''), '店舗名未登録'))
  AND store.prefecture_key = COALESCE(log.prefecture, '');
--> statement-breakpoint
ALTER TABLE "cafelog"."cafe_logs" ALTER COLUMN "store_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "cafelog"."cafe_logs" ADD CONSTRAINT "cafe_logs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "coffeelog"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cafe_logs_store_user_index" ON "cafelog"."cafe_logs" USING btree ("store_id","user_id");