CREATE TYPE "public"."onboarding_status" AS ENUM('pending', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."profile_template" AS ENUM('ONE_MAN_ARMY', 'PARALLEL_PARTNERS', 'FRONT_BACK_SPLIT', 'IN_OUT_SPLIT', 'STANDARD_CORP');--> statement-breakpoint
CREATE TABLE "tenant_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"submitted_by" uuid,
	"questionnaire_raw" jsonb DEFAULT '{}'::jsonb,
	"recommended_template" "profile_template",
	"applied_template" "profile_template",
	"team_size" varchar(20),
	"collaboration_mode" varchar(50),
	"sales_structure" varchar(50),
	"has_dedicated_finance" boolean DEFAULT false,
	"has_dedicated_dispatch" boolean DEFAULT false,
	"has_dedicated_procurement" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tenant_profiles_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "onboarding_status" varchar(20) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "tenant_profiles" ADD CONSTRAINT "tenant_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_profiles" ADD CONSTRAINT "tenant_profiles_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;