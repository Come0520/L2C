CREATE TYPE "public"."verification_status" AS ENUM('unverified', 'pending', 'verified', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."product_category" ADD VALUE 'BLIND';--> statement-breakpoint
ALTER TYPE "public"."product_category" ADD VALUE 'SOFT_PACK';--> statement-breakpoint
ALTER TYPE "public"."product_category" ADD VALUE 'WALL_ACCESSORY';--> statement-breakpoint
ALTER TYPE "public"."product_category" ADD VALUE 'PANEL_ACCESSORY';--> statement-breakpoint
ALTER TYPE "public"."product_category" ADD VALUE 'HARDWARE';--> statement-breakpoint
CREATE TABLE "role_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role_code" varchar(50) NOT NULL,
	"added_permissions" text DEFAULT '[]' NOT NULL,
	"removed_permissions" text DEFAULT '[]' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "verification_status" "verification_status" DEFAULT 'unverified';--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "business_license_url" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "legal_rep_name" varchar(50);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "registered_capital" varchar(50);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "business_scope" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "verified_by" uuid;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "verification_reject_reason" text;--> statement-breakpoint
ALTER TABLE "role_overrides" ADD CONSTRAINT "role_overrides_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_overrides" ADD CONSTRAINT "role_overrides_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_role_overrides_tenant_role" ON "role_overrides" USING btree ("tenant_id","role_code");