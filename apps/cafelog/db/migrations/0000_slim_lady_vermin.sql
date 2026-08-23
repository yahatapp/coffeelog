CREATE SCHEMA "cafelog";
--> statement-breakpoint
CREATE TABLE "cafelog"."cafe_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"cafe_name" text NOT NULL,
	"drink_name" text NOT NULL,
	"rating" real,
	"price" integer,
	"note" text,
	"visit_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cafelog"."profiles" (
	"line_user_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cafelog"."cafe_logs" ADD CONSTRAINT "cafe_logs_user_id_profiles_line_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "cafelog"."profiles"("line_user_id") ON DELETE no action ON UPDATE no action;