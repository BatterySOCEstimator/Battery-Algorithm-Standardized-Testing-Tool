ALTER TABLE "models" ADD COLUMN "storage_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_storage_id_unique" UNIQUE("storage_id");