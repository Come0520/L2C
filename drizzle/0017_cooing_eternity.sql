CREATE TYPE "public"."tenant_status" AS ENUM('pending_approval', 'active', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."invitation_role" AS ENUM('admin', 'sales', 'installer', 'customer');--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"inviter_id" uuid NOT NULL,
	"code" varchar(10) NOT NULL,
	"role" varchar(50) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"max_uses" varchar(10) DEFAULT '1',
	"used_count" varchar(10) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "invitations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "status" "tenant_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "applicant_name" varchar(100);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "applicant_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "applicant_email" varchar(255);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "region" varchar(100);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "business_description" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "reject_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_platform_admin" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "customer_signature_url" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;