ALTER TABLE "cafelog"."cafe_logs" ADD COLUMN "flavor_notes" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
-- Preserve the order of existing notes and discard empty separators.
UPDATE "cafelog"."cafe_logs"
SET "flavor_notes" = ARRAY(
  SELECT btrim(note)
  FROM regexp_split_to_table(coalesce("flavor_note", ''), E'[、,，・\\r\\n]+')
    WITH ORDINALITY AS parts(note, position)
  WHERE btrim(note) <> ''
  ORDER BY position
);--> statement-breakpoint
ALTER TABLE "cafelog"."cafe_logs" DROP COLUMN "flavor_note";
