CREATE TABLE "cafelog"."cafe_log_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_log_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"position" integer NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cafe_log_images_object_key_unique" UNIQUE("object_key")
);
--> statement-breakpoint
ALTER TABLE "cafelog"."cafe_log_images" ADD CONSTRAINT "cafe_log_images_cafe_log_id_cafe_logs_id_fk" FOREIGN KEY ("cafe_log_id") REFERENCES "cafelog"."cafe_logs"("id") ON DELETE cascade ON UPDATE no action;