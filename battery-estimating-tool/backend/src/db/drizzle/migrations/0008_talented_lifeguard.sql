CREATE TYPE "public"."model_type" AS ENUM('Machine Learning', 'Kalman Filter', 'Extended Kalman Filter', 'Other Kalman Filter', 'FNN', 'LSTM', 'GRU', 'NARX', 'Transformer', 'Other Neural Network', 'Coulomb Counter', 'Hybrid Model', 'Not Specified');--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "model_type" "model_type" DEFAULT 'Not Specified' NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "already_evaluated" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "weighted_error" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "all_cells" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "blind_cells" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "non_blinded_cells" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "charging" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "payload_80kg" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "payload_448kg_with_hvac" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "payload_448kg_no_hvac" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "payload_1000kg" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "standard_cycles" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "custom_cycles" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "n20c" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "n10c" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "0c" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "10c" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "25c" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "40c" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "isoc_error" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "current_sensor_error" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "all_drive_cycles_avg_rmse" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "all_drive_cycles_avg_mae" double precision;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "all_drive_cycles_avg_maxe" double precision;