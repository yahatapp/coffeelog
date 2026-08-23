ALTER TABLE "beans" ADD COLUMN "parent_bean_id" uuid;--> statement-breakpoint
ALTER TABLE "beans" ADD COLUMN "version" text;--> statement-breakpoint
ALTER TABLE "beans" ADD CONSTRAINT "beans_parent_bean_id_beans_id_fk" FOREIGN KEY ("parent_bean_id") REFERENCES "public"."beans"("id") ON DELETE no action ON UPDATE no action;