ALTER TABLE "cafelog"."cafe_logs" ALTER COLUMN "drink_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cafelog"."cafe_logs" ADD COLUMN "origin" text;--> statement-breakpoint
ALTER TABLE "cafelog"."cafe_logs" ADD COLUMN "variety" text;--> statement-breakpoint
ALTER TABLE "cafelog"."cafe_logs" ADD COLUMN "farm" text;--> statement-breakpoint
ALTER TABLE "cafelog"."cafe_logs" ADD COLUMN "process" text;--> statement-breakpoint
ALTER TABLE "cafelog"."cafe_logs" ADD COLUMN "roast" text;