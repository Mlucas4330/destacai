CREATE TYPE "public"."job_status" AS ENUM('saved', 'applied', 'interview', 'rejected', 'offer');--> statement-breakpoint
CREATE TYPE "public"."processing_status" AS ENUM('idle', 'queued', 'processing', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"description" text NOT NULL,
	"status" "job_status" DEFAULT 'saved' NOT NULL,
	"ats_status" "processing_status" DEFAULT 'idle' NOT NULL,
	"ats_score" integer,
	"ats_explanation" text,
	"cv_generation_status" "processing_status" DEFAULT 'idle' NOT NULL,
	"cv_generation_error" text,
	"cv_r2_key" text,
	"bullmq_job_id" text,
	"generated_cv_ats_status" "processing_status" DEFAULT 'idle' NOT NULL,
	"generated_cv_ats_score" integer,
	"generated_cv_ats_explanation" text,
	"cv_data" jsonb,
	"cv_confirmed_skills" jsonb DEFAULT '[]'::jsonb,
	"jd_extract" jsonb,
	"ats_breakdown" jsonb,
	"generated_cv_ats_breakdown" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"password_hash" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"cv_r2_key" text,
	"cv_file_name" text,
	"first_name" text,
	"last_name" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"verification_code" text,
	"verification_code_expires_at" timestamp,
	"reset_password_code" text,
	"reset_password_code_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;