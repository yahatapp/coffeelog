CREATE TABLE "brew_pours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brew_log_id" uuid NOT NULL,
	"pour_number" integer NOT NULL,
	"water_amount" real NOT NULL,
	"duration" integer NOT NULL,
	"pour_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brew_logs" ADD COLUMN "drawdown_time" integer;--> statement-breakpoint
ALTER TABLE "brew_pours" ADD CONSTRAINT "brew_pours_brew_log_id_brew_logs_id_fk" FOREIGN KEY ("brew_log_id") REFERENCES "public"."brew_logs"("id") ON DELETE cascade ON UPDATE no action;