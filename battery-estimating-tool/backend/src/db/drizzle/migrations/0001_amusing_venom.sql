ALTER TABLE "models" ADD COLUMN "model_file_token" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "results_file_token" text;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_model_file_token_unique" UNIQUE("model_file_token");--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_results_file_token_unique" UNIQUE("results_file_token");