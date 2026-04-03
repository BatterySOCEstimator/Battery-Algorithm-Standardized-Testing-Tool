CREATE TYPE "public"."model_type" AS ENUM('Machine Learning', 'Kalman Filter', 'Extended Kalman Filter', 'Other Kalman Filter', 'FNN', 'LSTM', 'GRU', 'NARX', 'Transformer', 'Other Neural Network', 'Coulomb Counter', 'Hybrid Model', 'Not Specified');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"isPrivate" boolean DEFAULT true NOT NULL,
	"owner_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"model_type" "model_type" DEFAULT 'Not Specified' NOT NULL,
	"file_path" text DEFAULT '' NOT NULL,
	"results_path" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"already_evaluated" boolean DEFAULT false,
	"weighted_error" double precision,
	"all_cells" double precision,
	"blind_cells" double precision,
	"non_blinded_cells" double precision,
	"charging" double precision,
	"payload_80kg" double precision,
	"payload_448kg_with_hvac" double precision,
	"payload_448kg_no_hvac" double precision,
	"payload_1000kg" double precision,
	"standard_cycles" double precision,
	"custom_cycles" double precision,
	"n20c" double precision,
	"n10c" double precision,
	"0c" double precision,
	"10c" double precision,
	"25c" double precision,
	"40c" double precision,
	"isoc_error" double precision,
	"current_sensor_error" double precision,
	"all_drive_cycles_avg_rmse" double precision,
	"all_drive_cycles_avg_mae" double precision,
	"all_drive_cycles_avg_maxe" double precision,
	"complexity" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"username" text,
	"display_username" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"academic_affiliation" text NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");