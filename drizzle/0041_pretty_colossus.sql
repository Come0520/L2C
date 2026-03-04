CREATE TABLE "batch_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"batch_no" varchar(50) NOT NULL,
	"product_code" varchar(50),
	"product_name" varchar(200),
	"supplier_id" uuid,
	"supplier_name" varchar(200),
	"supplier_batch_no" varchar(50),
	"vat_no" varchar(50),
	"dye_lot" varchar(50),
	"purchase_order_id" uuid,
	"purchase_order_no" varchar(50),
	"inspection_result" varchar(20),
	"inspection_notes" text,
	"inspection_photos" text[],
	"total_quantity" numeric(12, 2),
	"used_quantity" numeric(12, 2),
	"remaining_quantity" numeric(12, 2),
	"unit" varchar(20) DEFAULT '米',
	"attributes" jsonb,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "evidence_chains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_no" varchar(50),
	"evidence_type" varchar(50) NOT NULL,
	"title" varchar(200),
	"description" text,
	"file_url" text,
	"file_hash" varchar(64),
	"thumbnail_url" text,
	"latitude" varchar(20),
	"longitude" varchar(20),
	"address" text,
	"metadata" jsonb,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_batch_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"order_no" varchar(50),
	"order_item_id" uuid,
	"batch_id" uuid NOT NULL,
	"batch_no" varchar(50),
	"quantity" numeric(12, 2),
	"unit" varchar(20),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "risk_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"risk_type" varchar(50) NOT NULL,
	"risk_level" varchar(20) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"entity_no" varchar(50),
	"title" varchar(200) NOT NULL,
	"description" text,
	"suggested_action" text,
	"affected_orders" jsonb,
	"affected_count" integer,
	"potential_loss" numeric(12, 2),
	"status" varchar(20) DEFAULT 'OPEN',
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"resolution" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_customer_no_unique";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_wechat_openid_unique";--> statement-breakpoint
ALTER TABLE "leads" DROP CONSTRAINT "leads_lead_no_unique";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_order_no_unique";--> statement-breakpoint
ALTER TABLE "approval_nodes" ALTER COLUMN "approver_role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."approver_role";--> statement-breakpoint
CREATE TYPE "public"."approver_role" AS ENUM('MANAGER', 'ADMIN', 'FINANCE', 'PURCHASING', 'DISPATCHER');--> statement-breakpoint
ALTER TABLE "approval_nodes" ALTER COLUMN "approver_role" SET DATA TYPE "public"."approver_role" USING "approver_role"::"public"."approver_role";--> statement-breakpoint
ALTER TABLE "billing_payment_records" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."billing_payment_status";--> statement-breakpoint
CREATE TYPE "public"."billing_payment_status" AS ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');--> statement-breakpoint
ALTER TABLE "billing_payment_records" ALTER COLUMN "status" SET DATA TYPE "public"."billing_payment_status" USING "status"::"public"."billing_payment_status";--> statement-breakpoint
ALTER TABLE "billing_payment_records" ALTER COLUMN "payment_provider_channel" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "payment_provider_channel" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."payment_provider";--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('WECHAT', 'ALIPAY', 'MANUAL');--> statement-breakpoint
ALTER TABLE "billing_payment_records" ALTER COLUMN "payment_provider_channel" SET DATA TYPE "public"."payment_provider" USING "payment_provider_channel"::"public"."payment_provider";--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "payment_provider_channel" SET DATA TYPE "public"."payment_provider" USING "payment_provider_channel"::"public"."payment_provider";--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."subscription_status";--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'TRIALING');--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DATA TYPE "public"."subscription_status" USING "status"::"public"."subscription_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'SALES'::text;--> statement-breakpoint
ALTER TABLE "tenant_members" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tenant_members" ALTER COLUMN "role" SET DEFAULT 'SALES'::text;--> statement-breakpoint
-- =====================================================
-- 数据迁移：将旧角色值批量映射到 7 个核心角色
-- BOSS / OWNER / SUPER_ADMIN / TENANT_ADMIN → ADMIN
-- STORE_MANAGER / AREA_MANAGER              → MANAGER
-- INSTALLER                                 → WORKER
-- FINANCE_BOOKKEEPER/REVIEWER/SUPERVISOR    → FINANCE
-- PURCHASER                                 → SUPPLY
-- =====================================================
UPDATE "users" SET "role" = 'ADMIN'   WHERE "role" IN ('BOSS','OWNER','SUPER_ADMIN','TENANT_ADMIN');--> statement-breakpoint
UPDATE "users" SET "role" = 'MANAGER' WHERE "role" IN ('STORE_MANAGER','AREA_MANAGER');--> statement-breakpoint
UPDATE "users" SET "role" = 'WORKER'  WHERE "role" IN ('INSTALLER');--> statement-breakpoint
UPDATE "users" SET "role" = 'FINANCE' WHERE "role" IN ('FINANCE_BOOKKEEPER','FINANCE_REVIEWER','FINANCE_SUPERVISOR');--> statement-breakpoint
UPDATE "users" SET "role" = 'SUPPLY'  WHERE "role" IN ('PURCHASER');--> statement-breakpoint
UPDATE "tenant_members" SET "role" = 'ADMIN'   WHERE "role" IN ('BOSS','OWNER','SUPER_ADMIN','TENANT_ADMIN');--> statement-breakpoint
UPDATE "tenant_members" SET "role" = 'MANAGER' WHERE "role" IN ('STORE_MANAGER','AREA_MANAGER');--> statement-breakpoint
UPDATE "tenant_members" SET "role" = 'WORKER'  WHERE "role" IN ('INSTALLER');--> statement-breakpoint
UPDATE "tenant_members" SET "role" = 'FINANCE' WHERE "role" IN ('FINANCE_BOOKKEEPER','FINANCE_REVIEWER','FINANCE_SUPERVISOR');--> statement-breakpoint
UPDATE "tenant_members" SET "role" = 'SUPPLY'  WHERE "role" IN ('PURCHASER');--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'MANAGER', 'SALES', 'FINANCE', 'WORKER', 'CUSTOMER', 'SUPPLY');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'SALES'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "tenant_members" ALTER COLUMN "role" SET DEFAULT 'SALES'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "tenant_members" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
DROP INDEX "idx_leads_external_unique";--> statement-breakpoint
DROP INDEX "idx_leads_phone_active_unique";--> statement-breakpoint
ALTER TABLE "lead_activities" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "tags" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "debt_ledgers" ALTER COLUMN "debt_status" SET DEFAULT 'ACTIVE'::"public"."debt_status";--> statement-breakpoint
ALTER TABLE "debt_ledgers" ALTER COLUMN "debt_status" SET DATA TYPE "public"."debt_status" USING "debt_status"::"public"."debt_status";--> statement-breakpoint
ALTER TABLE "tenant_members" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "created_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD COLUMN "created_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "batch_traces" ADD CONSTRAINT "batch_traces_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_traces" ADD CONSTRAINT "batch_traces_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_traces" ADD CONSTRAINT "batch_traces_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_traces" ADD CONSTRAINT "batch_traces_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_traces" ADD CONSTRAINT "batch_traces_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_chains" ADD CONSTRAINT "evidence_chains_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_chains" ADD CONSTRAINT "evidence_chains_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_chains" ADD CONSTRAINT "evidence_chains_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_batch_links" ADD CONSTRAINT "order_batch_links_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_batch_links" ADD CONSTRAINT "order_batch_links_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_batch_links" ADD CONSTRAINT "order_batch_links_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_batch_links" ADD CONSTRAINT "order_batch_links_batch_id_batch_traces_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch_traces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_batch_tenant" ON "batch_traces" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_batch_no" ON "batch_traces" USING btree ("batch_no");--> statement-breakpoint
CREATE INDEX "idx_batch_vat" ON "batch_traces" USING btree ("vat_no");--> statement-breakpoint
CREATE INDEX "idx_batch_supplier" ON "batch_traces" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_entity" ON "evidence_chains" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_tenant" ON "evidence_chains" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_type" ON "evidence_chains" USING btree ("evidence_type");--> statement-breakpoint
CREATE INDEX "idx_link_order" ON "order_batch_links" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_link_batch" ON "order_batch_links" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_risk_tenant" ON "risk_alerts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_risk_type" ON "risk_alerts" USING btree ("risk_type");--> statement-breakpoint
CREATE INDEX "idx_risk_status" ON "risk_alerts" USING btree ("status");--> statement-breakpoint
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_leads_external_unique" ON "leads" USING btree ("tenant_id","external_id") WHERE "leads"."external_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_leads_phone_active_unique" ON "leads" USING btree ("tenant_id","customer_phone") WHERE "leads"."status" NOT IN ('WON', 'INVALID');--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "uq_customers_tenant_no" UNIQUE("tenant_id","customer_no");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "uq_customers_tenant_wechat" UNIQUE("tenant_id","wechat_openid");--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "uq_leads_tenant_no" UNIQUE("tenant_id","lead_no");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "uq_orders_tenant_no" UNIQUE("tenant_id","order_no");