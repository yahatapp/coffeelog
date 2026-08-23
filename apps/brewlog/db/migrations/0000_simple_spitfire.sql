CREATE TABLE "beans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"origin" text,
	"roast_level" integer,
	"purchase_date" date,
	"image_url" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brew_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bean_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"household_id" uuid NOT NULL,
	"method" text,
	"grind_size" text,
	"water_temp" integer,
	"bean_amount" real,
	"water_amount" real,
	"rating" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"line_user_id" text PRIMARY KEY NOT NULL,
	"household_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "beans" ADD CONSTRAINT "beans_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD CONSTRAINT "brew_logs_bean_id_beans_id_fk" FOREIGN KEY ("bean_id") REFERENCES "public"."beans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD CONSTRAINT "brew_logs_user_id_profiles_line_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("line_user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD CONSTRAINT "brew_logs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;