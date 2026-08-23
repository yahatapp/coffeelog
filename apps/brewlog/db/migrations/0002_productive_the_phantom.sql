CREATE TABLE "drippers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grinders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"fine_max" integer DEFAULT 6 NOT NULL,
	"medium_fine_max" integer DEFAULT 9 NOT NULL,
	"medium_max" integer DEFAULT 15 NOT NULL,
	"medium_coarse_max" integer DEFAULT 22 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brew_logs" ALTER COLUMN "grind_size" SET DATA TYPE integer USING grind_size::integer;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD COLUMN "brew_date" date;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD COLUMN "dripper_id" uuid;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD COLUMN "grinder_id" uuid;--> statement-breakpoint
ALTER TABLE "drippers" ADD CONSTRAINT "drippers_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grinders" ADD CONSTRAINT "grinders_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD CONSTRAINT "brew_logs_dripper_id_drippers_id_fk" FOREIGN KEY ("dripper_id") REFERENCES "public"."drippers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD CONSTRAINT "brew_logs_grinder_id_grinders_id_fk" FOREIGN KEY ("grinder_id") REFERENCES "public"."grinders"("id") ON DELETE no action ON UPDATE no action;