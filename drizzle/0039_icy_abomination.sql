CREATE TYPE "public"."billing_payment_status" AS ENUM('pending', 'succeeded', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('wechat', 'alipay', 'manual');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'cancelled', 'expired', 'trialing');--> statement-breakpoint
CREATE TYPE "public"."tenant_plan_type" AS ENUM('base', 'pro', 'enterprise');--> statement-breakpoint
ALTER TYPE "public"."verification_code_type" ADD VALUE 'MAGIC_LOGIN';--> statement-breakpoint
CREATE TABLE "billing_payment_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscription_id" uuid,
	"payment_provider_channel" "payment_provider" NOT NULL,
	"external_payment_id" varchar(255),
	"amount_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'CNY',
	"status" "billing_payment_status" NOT NULL,
	"description" text,
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"raw_webhook_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plan_type" "tenant_plan_type" NOT NULL,
	"status" "subscription_status" NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"payment_provider_channel" "payment_provider",
	"external_subscription_id" varchar(255),
	"amount_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'CNY',
	"auto_renew" boolean DEFAULT true,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usage_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"snapshot_date" timestamp with time zone NOT NULL,
	"user_count" integer DEFAULT 0,
	"customer_count" integer DEFAULT 0,
	"quote_count_month" integer DEFAULT 0,
	"order_count_month" integer DEFAULT 0,
	"showroom_product_count" integer DEFAULT 0,
	"storage_used_bytes" bigint DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "slogan" varchar(200);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "detail_address" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "contact_wechat" varchar(100);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "landing_cover_url" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "plan_type" "tenant_plan_type" DEFAULT 'base' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "plan_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "is_grandfathered" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "billing_payment_records" ADD CONSTRAINT "billing_payment_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_payment_records" ADD CONSTRAINT "billing_payment_records_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_metrics" ADD CONSTRAINT "usage_metrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_billing_payments_tenant" ON "billing_payment_records" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_billing_payments_subscription" ON "billing_payment_records" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_billing_payments_status" ON "billing_payment_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_tenant" ON "subscriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_status" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_usage_metrics_tenant_date" ON "usage_metrics" USING btree ("tenant_id","snapshot_date");