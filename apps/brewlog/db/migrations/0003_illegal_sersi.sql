ALTER TABLE "brew_logs" ADD COLUMN "temp_type" text DEFAULT 'hot' NOT NULL;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD COLUMN "ice_amount" real;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD COLUMN "yield_amount" real;