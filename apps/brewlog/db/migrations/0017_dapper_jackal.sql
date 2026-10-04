ALTER TABLE "brewlog"."beans" ADD COLUMN "store_id" uuid;--> statement-breakpoint

-- Reuse a Cafelog shop when its name identifies exactly one store. Ambiguous
-- branch names get an unlocated store instead of guessing a prefecture.
INSERT INTO "coffeelog"."stores" ("name")
SELECT DISTINCT btrim(bean.purchase_store)
FROM "brewlog"."beans" AS bean
WHERE bean.coffee_type = 'specialty' AND NULLIF(btrim(bean.purchase_store), '') IS NOT NULL
  AND (SELECT count(*) FROM "coffeelog"."stores" AS store
       WHERE store.name_key = lower(btrim(bean.purchase_store))) <> 1
ON CONFLICT (name_key, prefecture_key) DO NOTHING;
--> statement-breakpoint
UPDATE "brewlog"."beans" AS bean
SET store_id = (
  SELECT store.id FROM "coffeelog"."stores" AS store
  WHERE store.name_key = lower(btrim(bean.purchase_store))
  ORDER BY (store.prefecture IS NULL) DESC, store.id
  LIMIT 1
)
WHERE bean.coffee_type = 'specialty' AND NULLIF(btrim(bean.purchase_store), '') IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "brewlog"."beans" ADD CONSTRAINT "beans_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "coffeelog"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "beans_store_household_index" ON "brewlog"."beans" USING btree ("store_id","household_id");