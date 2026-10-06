CREATE SCHEMA "coffeelog";
--> statement-breakpoint
CREATE TABLE "coffeelog"."stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"prefecture" text,
	"name_key" text GENERATED ALWAYS AS (lower(btrim("name"))) STORED NOT NULL,
	"prefecture_key" text GENERATED ALWAYS AS (coalesce("prefecture", '')) STORED NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stores_name_not_blank" CHECK (length(btrim("coffeelog"."stores"."name")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "stores_name_prefecture_unique" ON "coffeelog"."stores" USING btree ("name_key","prefecture_key");