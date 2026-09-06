CREATE TABLE "cafelog"."cafe_log_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_log_id" uuid NOT NULL,
	"url" text NOT NULL,
	"type" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cafe_log_links_type_check" CHECK ("cafelog"."cafe_log_links"."type" IN ('instagram', 'google_maps', 'website'))
);
--> statement-breakpoint
ALTER TABLE "cafelog"."cafe_log_links" ADD CONSTRAINT "cafe_log_links_cafe_log_id_cafe_logs_id_fk" FOREIGN KEY ("cafe_log_id") REFERENCES "cafelog"."cafe_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cafe_log_links_log_position_unique" ON "cafelog"."cafe_log_links" USING btree ("cafe_log_id","position");
--> statement-breakpoint
INSERT INTO "cafelog"."cafe_log_links" ("cafe_log_id", "url", "type", "position")
SELECT
	"id",
	"cafe_url",
	CASE
		WHEN lower("cafe_url") ~ '^https?://(www\.)?instagram\.com([/:?]|$)' THEN 'instagram'
		WHEN lower("cafe_url") ~ '^https?://(maps\.app\.goo\.gl|maps\.google\.(com|co\.jp)|goo\.gl/maps)([/:?]|$)'
			OR lower("cafe_url") ~ '^https?://(www\.)?google\.[^/]+/maps([/?]|$)' THEN 'google_maps'
		ELSE 'website'
	END,
	0
FROM "cafelog"."cafe_logs"
WHERE "cafe_url" IS NOT NULL AND btrim("cafe_url") <> '';
