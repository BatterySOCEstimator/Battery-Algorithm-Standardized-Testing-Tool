ALTER TABLE "models" ALTER COLUMN "file_path" SET DEFAULT '';--> statement-breakpoint
UPDATE "models" SET "file_path" = '' WHERE "file_path" IS NULL;--> statement-breakpoint
ALTER TABLE "models" ALTER COLUMN "file_path" SET NOT NULL;