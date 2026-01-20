CREATE TYPE "public"."fabric_inventory_log_type" AS ENUM('PURCHASE_IN', 'PROCESSING_OUT', 'ADJUSTMENT', 'RETURN');--> statement-breakpoint
CREATE TYPE "public"."package_overflow_mode" AS ENUM('FIXED_PRICE', 'IGNORE', 'ORIGINAL', 'DISCOUNT');--> statement-breakpoint
CREATE TYPE "public"."package_type" AS ENUM('QUANTITY', 'COMBO', 'CATEGORY', 'TIME_LIMITED');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('FINISHED', 'CUSTOM');--> statement-breakpoint
ALTER TYPE "public"."measure_task_status" ADD VALUE 'PENDING_APPROVAL' BEFORE 'PENDING';--> statement-breakpoint
ALTER TYPE "public"."product_category" ADD VALUE 'WALLCLOTH_ACCESSORY';--> statement-breakpoint
ALTER TYPE "public"."product_category" ADD VALUE 'WALLPANEL';--> statement-breakpoint
ALTER TYPE "public"."product_category" ADD VALUE 'WINDOWPAD';--> statement-breakpoint
ALTER TYPE "public"."product_category" ADD VALUE 'STANDARD';--> statement-breakpoint
CREATE TABLE "customer_merge_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"primary_customer_id" uuid NOT NULL,
	"merged_customer_ids" uuid[] NOT NULL,
	"operator_id" uuid NOT NULL,
	"field_conflicts" jsonb,
	"affected_tables" text[],
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "phone_view_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"viewer_id" uuid NOT NULL,
	"viewer_role" varchar(50) NOT NULL,
	"ip_address" varchar(50),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "channel_settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"settlement_no" varchar(50) NOT NULL,
	"channel_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"total_commission" numeric(15, 2) NOT NULL,
	"adjustment_amount" numeric(15, 2) DEFAULT '0',
	"final_amount" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'DRAFT',
	"payment_bill_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	CONSTRAINT "channel_settlements_settlement_no_unique" UNIQUE("settlement_no")
);
--> statement-breakpoint
CREATE TABLE "commission_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"original_commission_id" uuid NOT NULL,
	"adjustment_type" varchar(20) NOT NULL,
	"adjustment_amount" numeric(15, 2) NOT NULL,
	"reason" text NOT NULL,
	"order_id" uuid,
	"refund_amount" numeric(15, 2),
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fabric_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"fabric_product_id" uuid NOT NULL,
	"fabric_sku" varchar(100) NOT NULL,
	"fabric_name" varchar(200) NOT NULL,
	"fabric_color" varchar(50),
	"fabric_width" numeric(10, 2),
	"fabric_roll_length" numeric(10, 2),
	"batch_no" varchar(50),
	"purchase_order_id" uuid,
	"supplier_id" uuid,
	"available_quantity" numeric(12, 2) NOT NULL,
	"reserved_quantity" numeric(12, 2) DEFAULT '0',
	"total_quantity" numeric(12, 2) NOT NULL,
	"purchase_date" timestamp with time zone,
	"expiry_date" timestamp with time zone,
	"warehouse_location" varchar(100),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fabric_inventory_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"fabric_inventory_id" uuid NOT NULL,
	"log_type" "fabric_inventory_log_type" NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"before_quantity" numeric(12, 2) NOT NULL,
	"after_quantity" numeric(12, 2) NOT NULL,
	"reference_id" uuid,
	"reference_type" varchar(50),
	"remark" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "package_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"is_required" boolean DEFAULT false,
	"min_quantity" numeric(10, 2),
	"max_quantity" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"package_no" varchar(50) NOT NULL,
	"package_name" varchar(200) NOT NULL,
	"package_type" "package_type" NOT NULL,
	"package_price" numeric(12, 2) NOT NULL,
	"original_price" numeric(12, 2),
	"description" text,
	"rules" jsonb DEFAULT '{}'::jsonb,
	"overflow_mode" "package_overflow_mode" DEFAULT 'DISCOUNT',
	"overflow_price" numeric(12, 2),
	"overflow_discount_rate" numeric(5, 4),
	"is_active" boolean DEFAULT true,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "product_packages_package_no_unique" UNIQUE("package_no")
);
--> statement-breakpoint
CREATE TABLE "receipt_bill_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"receipt_bill_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"statement_id" uuid,
	"schedule_id" uuid,
	"order_no" varchar(50) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "receipt_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"receipt_no" varchar(50) NOT NULL,
	"type" varchar(20) NOT NULL,
	"customer_id" uuid,
	"customer_name" varchar(100) NOT NULL,
	"customer_phone" varchar(20) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"used_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"remaining_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) NOT NULL,
	"payment_method" varchar(20) NOT NULL,
	"account_id" uuid,
	"proof_url" text NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"remark" text,
	"created_by" uuid NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "receipt_bills_receipt_no_unique" UNIQUE("receipt_no")
);
--> statement-breakpoint
ALTER TABLE "approval_delegations" ALTER COLUMN "type" SET DEFAULT 'GLOBAL'::"public"."delegation_type";--> statement-breakpoint
ALTER TABLE "approval_delegations" ALTER COLUMN "type" SET DATA TYPE "public"."delegation_type" USING "type"::"public"."delegation_type";--> statement-breakpoint
ALTER TABLE "approval_nodes" ALTER COLUMN "approver_role" SET DATA TYPE "public"."approver_role" USING "approver_role"::"public"."approver_role";--> statement-breakpoint
ALTER TABLE "approval_nodes" ALTER COLUMN "approver_mode" SET DEFAULT 'ANY'::"public"."approval_node_mode";--> statement-breakpoint
ALTER TABLE "approval_nodes" ALTER COLUMN "approver_mode" SET DATA TYPE "public"."approval_node_mode" USING "approver_mode"::"public"."approval_node_mode";--> statement-breakpoint
ALTER TABLE "approval_nodes" ALTER COLUMN "timeout_action" SET DEFAULT 'REMIND'::"public"."approval_timeout_action";--> statement-breakpoint
ALTER TABLE "approval_nodes" ALTER COLUMN "timeout_action" SET DATA TYPE "public"."approval_timeout_action" USING "timeout_action"::"public"."approval_timeout_action";--> statement-breakpoint
ALTER TABLE "product_price_history" ADD COLUMN "supplier_id" uuid;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD COLUMN "channel_id" uuid;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD COLUMN "price_type" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD COLUMN "effective_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_type" "product_type" DEFAULT 'FINISHED' NOT NULL;--> statement-breakpoint
ALTER TABLE "channel_commissions" ADD COLUMN "commission_type" "cooperation_mode";--> statement-breakpoint
ALTER TABLE "channel_commissions" ADD COLUMN "order_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "channel_commissions" ADD COLUMN "commission_rate" numeric(5, 4);--> statement-breakpoint
ALTER TABLE "channel_commissions" ADD COLUMN "settlement_id" uuid;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD COLUMN "timeout_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "customer_merge_logs" ADD CONSTRAINT "customer_merge_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_merge_logs" ADD CONSTRAINT "customer_merge_logs_primary_customer_id_customers_id_fk" FOREIGN KEY ("primary_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_merge_logs" ADD CONSTRAINT "customer_merge_logs_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_view_logs" ADD CONSTRAINT "phone_view_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_view_logs" ADD CONSTRAINT "phone_view_logs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_view_logs" ADD CONSTRAINT "phone_view_logs_viewer_id_users_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_settlements" ADD CONSTRAINT "channel_settlements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_settlements" ADD CONSTRAINT "channel_settlements_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_settlements" ADD CONSTRAINT "channel_settlements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_settlements" ADD CONSTRAINT "channel_settlements_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_original_commission_id_channel_commissions_id_fk" FOREIGN KEY ("original_commission_id") REFERENCES "public"."channel_commissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_inventory" ADD CONSTRAINT "fabric_inventory_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_inventory_logs" ADD CONSTRAINT "fabric_inventory_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_inventory_logs" ADD CONSTRAINT "fabric_inventory_logs_fabric_inventory_id_fabric_inventory_id_fk" FOREIGN KEY ("fabric_inventory_id") REFERENCES "public"."fabric_inventory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_products" ADD CONSTRAINT "package_products_package_id_product_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."product_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_packages" ADD CONSTRAINT "product_packages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_bill_items" ADD CONSTRAINT "receipt_bill_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_bill_items" ADD CONSTRAINT "receipt_bill_items_receipt_bill_id_receipt_bills_id_fk" FOREIGN KEY ("receipt_bill_id") REFERENCES "public"."receipt_bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_bill_items" ADD CONSTRAINT "receipt_bill_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_bill_items" ADD CONSTRAINT "receipt_bill_items_statement_id_ar_statements_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."ar_statements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_bill_items" ADD CONSTRAINT "receipt_bill_items_schedule_id_payment_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."payment_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_bills" ADD CONSTRAINT "receipt_bills_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_bills" ADD CONSTRAINT "receipt_bills_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_bills" ADD CONSTRAINT "receipt_bills_account_id_finance_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."finance_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_bills" ADD CONSTRAINT "receipt_bills_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_bills" ADD CONSTRAINT "receipt_bills_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_merge_logs_tenant" ON "customer_merge_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_merge_logs_primary" ON "customer_merge_logs" USING btree ("primary_customer_id");--> statement-breakpoint
CREATE INDEX "idx_phone_view_logs_tenant" ON "phone_view_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_phone_view_logs_customer" ON "phone_view_logs" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_phone_view_logs_viewer" ON "phone_view_logs" USING btree ("viewer_id");--> statement-breakpoint
CREATE INDEX "idx_settlements_tenant" ON "channel_settlements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_settlements_channel" ON "channel_settlements" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_settlements_status" ON "channel_settlements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_adjustments_tenant" ON "commission_adjustments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_adjustments_channel" ON "commission_adjustments" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_fabric_inventory_tenant" ON "fabric_inventory" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_fabric_inventory_product" ON "fabric_inventory" USING btree ("fabric_product_id");--> statement-breakpoint
CREATE INDEX "idx_fabric_logs_inventory" ON "fabric_inventory_logs" USING btree ("fabric_inventory_id");--> statement-breakpoint
CREATE INDEX "idx_package_products_package" ON "package_products" USING btree ("package_id");--> statement-breakpoint
CREATE INDEX "idx_package_products_product" ON "package_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_packages_tenant" ON "product_packages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_packages_no" ON "product_packages" USING btree ("package_no");--> statement-breakpoint
CREATE INDEX "idx_receipt_bill_items_receipt" ON "receipt_bill_items" USING btree ("receipt_bill_id");--> statement-breakpoint
CREATE INDEX "idx_receipt_bill_items_order" ON "receipt_bill_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_receipt_bills_tenant" ON "receipt_bills" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_receipt_bills_customer" ON "receipt_bills" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_receipt_bills_status" ON "receipt_bills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_commissions_order" ON "channel_commissions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_approval_tasks_timeout" ON "approval_tasks" USING btree ("timeout_at");