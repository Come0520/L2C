ALTER TYPE "public"."lead_activity_type" ADD VALUE 'OTHER';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'PENDING_APPROVAL';--> statement-breakpoint
CREATE TABLE "po_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"po_id" uuid NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"transaction_time" timestamp with time zone NOT NULL,
	"voucher_url" text,
	"remark" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "po_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"po_id" uuid NOT NULL,
	"logistics_company" varchar(100),
	"logistics_no" varchar(100),
	"tracking_url" text,
	"shipped_at" timestamp with time zone,
	"remark" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" DROP CONSTRAINT "unq_notif_prefs_user_type";--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::text;--> statement-breakpoint
DROP TYPE "public"."purchase_order_status";--> statement-breakpoint
CREATE TYPE "public"."purchase_order_status" AS ENUM('DRAFT', 'PENDING_CONFIRMATION', 'PENDING_PAYMENT', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'PARTIALLY_RECEIVED', 'DELIVERED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"public"."purchase_order_status";--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DATA TYPE "public"."purchase_order_status" USING "status"::"public"."purchase_order_status";--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "received_quantity" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "po_payments" ADD CONSTRAINT "po_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_payments" ADD CONSTRAINT "po_payments_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_payments" ADD CONSTRAINT "po_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_shipments" ADD CONSTRAINT "po_shipments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_shipments" ADD CONSTRAINT "po_shipments_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_shipments" ADD CONSTRAINT "po_shipments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_po_payments_tenant" ON "po_payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_po_payments_po" ON "po_payments" USING btree ("po_id");--> statement-breakpoint
CREATE INDEX "idx_po_shipments_tenant" ON "po_shipments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_po_shipments_po" ON "po_shipments" USING btree ("po_id");--> statement-breakpoint
CREATE INDEX "idx_customers_assigned_sales" ON "customers" USING btree ("assigned_sales_id");--> statement-breakpoint
CREATE INDEX "idx_customers_is_merged" ON "customers" USING btree ("is_merged");--> statement-breakpoint
CREATE INDEX "idx_customers_created_at" ON "customers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_leads_external_unique" ON "leads" USING btree ("tenant_id","external_id") WHERE "leads"."external_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_leads_phone_active_unique" ON "leads" USING btree ("tenant_id","customer_phone") WHERE "leads"."status" NOT IN ('WON', 'INVALID');--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "unq_notif_prefs_user_type" UNIQUE("tenant_id","user_id","notification_type");