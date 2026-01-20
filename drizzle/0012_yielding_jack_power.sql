CREATE TYPE "public"."change_request_status" AS ENUM('PENDING', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."change_request_type" AS ENUM('FIELD_CHANGE', 'CUSTOMER_CHANGE', 'STOCK_OUT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."channel_category" AS ENUM('ONLINE', 'OFFLINE', 'REFERRAL');--> statement-breakpoint
ALTER TYPE "public"."channel_type" ADD VALUE 'DOUYIN';--> statement-breakpoint
ALTER TYPE "public"."channel_type" ADD VALUE 'XIAOHONGSHU';--> statement-breakpoint
ALTER TYPE "public"."channel_type" ADD VALUE 'STORE';--> statement-breakpoint
ALTER TYPE "public"."channel_type" ADD VALUE 'OTHER';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'PENDING_PO' BEFORE 'PENDING_PRODUCTION';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'INSTALLATION_COMPLETED' BEFORE 'COMPLETED';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'PENDING_CONFIRMATION' BEFORE 'COMPLETED';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'INSTALLATION_REJECTED' BEFORE 'COMPLETED';--> statement-breakpoint
CREATE TABLE "order_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"type" "change_request_type" NOT NULL,
	"reason" text NOT NULL,
	"status" "change_request_status" DEFAULT 'PENDING',
	"diff_amount" numeric(12, 2) DEFAULT '0',
	"original_data" jsonb,
	"new_data" jsonb,
	"requested_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "external_id" varchar(100);--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "category" "channel_category" DEFAULT 'OFFLINE' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "logistics" jsonb;--> statement-breakpoint
ALTER TABLE "approval_flows" ADD COLUMN "definition" jsonb DEFAULT '{"nodes":[],"edges":[]}'::jsonb;--> statement-breakpoint
ALTER TABLE "order_changes" ADD CONSTRAINT "order_changes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_changes" ADD CONSTRAINT "order_changes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_changes" ADD CONSTRAINT "order_changes_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_changes" ADD CONSTRAINT "order_changes_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;