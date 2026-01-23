CREATE TYPE "public"."ar_statement_status" AS ENUM('PENDING_RECON', 'RECONCILED', 'INVOICED', 'PARTIAL', 'PAID', 'PENDING_DELIVER', 'COMPLETED', 'BAD_DEBT');--> statement-breakpoint
CREATE TYPE "public"."bill_status" AS ENUM('DRAFT', 'PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."channel_status" AS ENUM('ACTIVE', 'SUSPENDED', 'TERMINATED');--> statement-breakpoint
CREATE TYPE "public"."commission_status" AS ENUM('PENDING', 'CALCULATED', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."commission_trigger_mode" AS ENUM('ORDER_CREATED', 'ORDER_COMPLETED', 'PAYMENT_COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."labor_category" AS ENUM('CURTAIN', 'WALLPAPER', 'WALLCLOTH', 'WALLPANEL', 'MEASURE_LEAD', 'MEASURE_PRECISE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."labor_rate_entity_type" AS ENUM('TENANT', 'WORKER');--> statement-breakpoint
CREATE TYPE "public"."labor_unit_type" AS ENUM('WINDOW', 'SQUARE_METER', 'FIXED');--> statement-breakpoint
CREATE TYPE "public"."order_item_status" AS ENUM('PENDING', 'PROCESSING', 'PO_CONFIRMED', 'PRODUCED', 'SHIPPED', 'DELIVERED', 'INSTALLED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."purchase_order_status" AS ENUM('DRAFT', 'PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."supplier_type" AS ENUM('SUPPLIER', 'PROCESSOR', 'BOTH');--> statement-breakpoint
CREATE TYPE "public"."work_order_item_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."worker_skill_type" AS ENUM('MEASURE_CURTAIN', 'INSTALL_CURTAIN', 'MEASURE_WALLCLOTH', 'INSTALL_WALLCLOTH', 'MEASURE_WALLPANEL', 'INSTALL_WALLPANEL');--> statement-breakpoint
CREATE TYPE "public"."verification_code_type" AS ENUM('LOGIN_MFA', 'PASSWORD_RESET', 'BIND_PHONE');--> statement-breakpoint
ALTER TYPE "public"."install_task_category" ADD VALUE 'WALLPAPER' BEFORE 'WALLCLOTH';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'HALTED' BEFORE 'PENDING_APPROVAL';--> statement-breakpoint
CREATE TABLE "channel_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"room_id" uuid,
	"parent_id" uuid,
	"category" varchar(50) NOT NULL,
	"product_id" uuid,
	"product_name" varchar(200) NOT NULL,
	"default_width" numeric(10, 2),
	"default_height" numeric(10, 2),
	"default_fold_ratio" numeric(4, 2),
	"unit_price" numeric(10, 2),
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_template_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"category" varchar(50),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"source_quote_id" uuid,
	"is_public" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "channel_discount_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"scope" varchar(20) NOT NULL,
	"target_id" varchar(100) NOT NULL,
	"target_name" varchar(200),
	"s_level_discount" numeric(5, 2),
	"a_level_discount" numeric(5, 2),
	"b_level_discount" numeric(5, 2),
	"c_level_discount" numeric(5, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"credit_note_no" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"customer_name" varchar(100) NOT NULL,
	"order_id" uuid,
	"ar_statement_id" uuid,
	"type" varchar(20) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reason" varchar(200) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"applied_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "credit_notes_credit_note_no_unique" UNIQUE("credit_note_no")
);
--> statement-breakpoint
CREATE TABLE "debit_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"debit_note_no" varchar(50) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"supplier_name" varchar(100) NOT NULL,
	"purchase_order_id" uuid,
	"ap_statement_id" uuid,
	"type" varchar(20) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reason" varchar(200) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"applied_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "debit_notes_debit_note_no_unique" UNIQUE("debit_note_no")
);
--> statement-breakpoint
CREATE TABLE "internal_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"transfer_no" varchar(50) NOT NULL,
	"from_account_id" uuid NOT NULL,
	"to_account_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"from_transaction_id" uuid,
	"to_transaction_id" uuid,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"remark" text,
	"created_by" uuid NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "internal_transfers_transfer_no_unique" UNIQUE("transfer_no")
);
--> statement-breakpoint
CREATE TABLE "statement_confirmation_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"confirmation_id" uuid NOT NULL,
	"document_type" varchar(30) NOT NULL,
	"document_id" uuid NOT NULL,
	"document_no" varchar(50) NOT NULL,
	"document_date" date NOT NULL,
	"document_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"dispute_reason" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "statement_confirmations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"confirmation_no" varchar(50) NOT NULL,
	"type" varchar(20) NOT NULL,
	"target_id" uuid NOT NULL,
	"target_name" varchar(100) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"period_label" varchar(50) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"confirmed_amount" numeric(12, 2) DEFAULT '0',
	"disputed_amount" numeric(12, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"sent_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"confirmed_by" varchar(100),
	"remark" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "statement_confirmations_confirmation_no_unique" UNIQUE("confirmation_no")
);
--> statement-breakpoint
CREATE TABLE "notification_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" uuid,
	"template_code" varchar(50),
	"user_id" uuid,
	"target_phone" varchar(20),
	"target_email" varchar(100),
	"channel" varchar(20) NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING',
	"priority" varchar(20) DEFAULT 'NORMAL',
	"retry_count" varchar(10) DEFAULT '0',
	"max_retries" varchar(10) DEFAULT '3',
	"last_error" text,
	"scheduled_at" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"notification_type" varchar(50) NOT NULL,
	"channels" jsonb DEFAULT '["IN_APP"]'::jsonb,
	"title_template" varchar(200) NOT NULL,
	"content_template" text NOT NULL,
	"sms_template" varchar(500),
	"wechat_template_id" varchar(100),
	"param_mapping" jsonb,
	"is_active" boolean DEFAULT true,
	"priority" varchar(20) DEFAULT 'NORMAL',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) DEFAULT 'INFO',
	"target_roles" jsonb,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"is_pinned" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"phone" varchar(20) NOT NULL,
	"code" varchar(10) NOT NULL,
	"type" "verification_code_type" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"ip" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "labor_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" "labor_rate_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"category" "labor_category" NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"base_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"unit_type" "labor_unit_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "worker_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"skill_type" "worker_skill_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"value_type" varchar(20) NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now(),
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "system_settings_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"setting_id" uuid NOT NULL,
	"key" varchar(100) NOT NULL,
	"old_value" text,
	"new_value" text NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::text;--> statement-breakpoint
DROP TYPE "public"."quote_status";--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PENDING_CUSTOMER', 'ACCEPTED', 'REJECTED', 'LOCKED', 'ORDERED', 'EXPIRED');--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"public"."quote_status";--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "status" SET DATA TYPE "public"."quote_status" USING "status"::"public"."quote_status";--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "channels" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"public"."channel_status";--> statement-breakpoint
ALTER TABLE "channels" ALTER COLUMN "status" SET DATA TYPE "public"."channel_status" USING "status"::"public"."channel_status";--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."order_item_status";--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "status" SET DATA TYPE "public"."order_item_status" USING "status"::"public"."order_item_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "supplier_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"public"."purchase_order_status";--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DATA TYPE "public"."purchase_order_status" USING "status"::"public"."purchase_order_status";--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "payment_status" SET DEFAULT 'PENDING'::"public"."payment_status";--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "payment_status" SET DATA TYPE "public"."payment_status" USING "payment_status"::"public"."payment_status";--> statement-breakpoint
ALTER TABLE "split_route_rules" ALTER COLUMN "conditions" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "split_route_rules" ALTER COLUMN "conditions" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "split_route_rules" ALTER COLUMN "is_active" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "split_route_rules" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "work_order_items" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."work_order_item_status";--> statement-breakpoint
ALTER TABLE "work_order_items" ALTER COLUMN "status" SET DATA TYPE "public"."work_order_item_status" USING "status"::"public"."work_order_item_status";--> statement-breakpoint
ALTER TABLE "ar_statements" ALTER COLUMN "status" SET DATA TYPE "public"."ar_statement_status" USING "status"::"public"."ar_statement_status";--> statement-breakpoint
ALTER TABLE "ar_statements" ALTER COLUMN "commission_status" SET DATA TYPE "public"."commission_status" USING "commission_status"::"public"."commission_status";--> statement-breakpoint
ALTER TABLE "market_channels" ADD COLUMN "cooperation_mode" varchar(20) DEFAULT 'REBATE';--> statement-breakpoint
ALTER TABLE "market_channels" ADD COLUMN "commission_rate" numeric(5, 4) DEFAULT '0.1';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "hierarchy_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "credit_limit" numeric(15, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "commission_trigger_mode" "commission_trigger_mode" DEFAULT 'PAYMENT_COMPLETED';--> statement-breakpoint
ALTER TABLE "quote_items" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "quote_rooms" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "channel_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "channel_contact_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "channel_cooperation_mode" "cooperation_mode";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "quote_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "supplier_type" "supplier_type" DEFAULT 'SUPPLIER';--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "processing_prices" jsonb;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "contract_url" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "contract_expiry_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "business_license_url" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "bank_account" varchar(100);--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "bank_name" varchar(100);--> statement-breakpoint
ALTER TABLE "measure_items" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payment_bills" ADD COLUMN "order_id" uuid;--> statement-breakpoint
ALTER TABLE "channel_categories" ADD CONSTRAINT "channel_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_template_items" ADD CONSTRAINT "quote_template_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_template_items" ADD CONSTRAINT "quote_template_items_template_id_quote_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."quote_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_template_items" ADD CONSTRAINT "quote_template_items_room_id_quote_template_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."quote_template_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_template_items" ADD CONSTRAINT "quote_template_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_template_rooms" ADD CONSTRAINT "quote_template_rooms_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_template_rooms" ADD CONSTRAINT "quote_template_rooms_template_id_quote_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."quote_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_templates" ADD CONSTRAINT "quote_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_templates" ADD CONSTRAINT "quote_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_discount_overrides" ADD CONSTRAINT "channel_discount_overrides_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_ar_statement_id_ar_statements_id_fk" FOREIGN KEY ("ar_statement_id") REFERENCES "public"."ar_statements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_ap_statement_id_ap_supplier_statements_id_fk" FOREIGN KEY ("ap_statement_id") REFERENCES "public"."ap_supplier_statements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_transfers" ADD CONSTRAINT "internal_transfers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_transfers" ADD CONSTRAINT "internal_transfers_from_account_id_finance_accounts_id_fk" FOREIGN KEY ("from_account_id") REFERENCES "public"."finance_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_transfers" ADD CONSTRAINT "internal_transfers_to_account_id_finance_accounts_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "public"."finance_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_transfers" ADD CONSTRAINT "internal_transfers_from_transaction_id_account_transactions_id_fk" FOREIGN KEY ("from_transaction_id") REFERENCES "public"."account_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_transfers" ADD CONSTRAINT "internal_transfers_to_transaction_id_account_transactions_id_fk" FOREIGN KEY ("to_transaction_id") REFERENCES "public"."account_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_transfers" ADD CONSTRAINT "internal_transfers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_transfers" ADD CONSTRAINT "internal_transfers_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_confirmation_details" ADD CONSTRAINT "statement_confirmation_details_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_confirmation_details" ADD CONSTRAINT "statement_confirmation_details_confirmation_id_statement_confirmations_id_fk" FOREIGN KEY ("confirmation_id") REFERENCES "public"."statement_confirmations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_confirmations" ADD CONSTRAINT "statement_confirmations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_confirmations" ADD CONSTRAINT "statement_confirmations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_announcements" ADD CONSTRAINT "system_announcements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_announcements" ADD CONSTRAINT "system_announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_rates" ADD CONSTRAINT "labor_rates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_skills" ADD CONSTRAINT "worker_skills_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_skills" ADD CONSTRAINT "worker_skills_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings_history" ADD CONSTRAINT "system_settings_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings_history" ADD CONSTRAINT "system_settings_history_setting_id_system_settings_id_fk" FOREIGN KEY ("setting_id") REFERENCES "public"."system_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings_history" ADD CONSTRAINT "system_settings_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_channel_categories_tenant" ON "channel_categories" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_channel_categories_code" ON "channel_categories" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_quote_template_items_template" ON "quote_template_items" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_quote_template_items_room" ON "quote_template_items" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_quote_template_rooms_template" ON "quote_template_rooms" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_quote_templates_tenant" ON "quote_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_quote_templates_category" ON "quote_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_channel_discount_overrides_tenant" ON "channel_discount_overrides" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_channel_discount_overrides_scope_target" ON "channel_discount_overrides" USING btree ("scope","target_id");--> statement-breakpoint
CREATE INDEX "idx_credit_notes_tenant" ON "credit_notes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_credit_notes_customer" ON "credit_notes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_credit_notes_status" ON "credit_notes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_debit_notes_tenant" ON "debit_notes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_debit_notes_supplier" ON "debit_notes" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_debit_notes_status" ON "debit_notes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_internal_transfers_tenant" ON "internal_transfers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_internal_transfers_from" ON "internal_transfers" USING btree ("from_account_id");--> statement-breakpoint
CREATE INDEX "idx_internal_transfers_to" ON "internal_transfers" USING btree ("to_account_id");--> statement-breakpoint
CREATE INDEX "idx_internal_transfers_status" ON "internal_transfers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_statement_confirmation_details_confirmation" ON "statement_confirmation_details" USING btree ("confirmation_id");--> statement-breakpoint
CREATE INDEX "idx_statement_confirmation_details_doc" ON "statement_confirmation_details" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_statement_confirmations_tenant" ON "statement_confirmations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_statement_confirmations_target" ON "statement_confirmations" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "idx_statement_confirmations_period" ON "statement_confirmations" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_statement_confirmations_status" ON "statement_confirmations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_notif_queue_status" ON "notification_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_notif_queue_scheduled" ON "notification_queue" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_notif_queue_user" ON "notification_queue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notif_template_code" ON "notification_templates" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_notif_template_tenant" ON "notification_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_announce_tenant" ON "system_announcements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_announce_time" ON "system_announcements" USING btree ("start_at","end_at");--> statement-breakpoint
CREATE INDEX "idx_labor_rates_tenant" ON "labor_rates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_labor_rates_entity" ON "labor_rates" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_worker_skills_tenant" ON "worker_skills" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_worker_skills_worker" ON "worker_skills" USING btree ("worker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_system_settings_tenant_key" ON "system_settings" USING btree ("tenant_id","key");--> statement-breakpoint
CREATE INDEX "idx_system_settings_category" ON "system_settings" USING btree ("tenant_id","category");--> statement-breakpoint
CREATE INDEX "idx_system_settings_history_setting" ON "system_settings_history" USING btree ("setting_id");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_category_id_channel_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."channel_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_quote_version_id_quotes_id_fk" FOREIGN KEY ("quote_version_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_channel_contact_id_channel_contacts_id_fk" FOREIGN KEY ("channel_contact_id") REFERENCES "public"."channel_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_route_rules" ADD CONSTRAINT "split_route_rules_target_supplier_id_suppliers_id_fk" FOREIGN KEY ("target_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_bills" ADD CONSTRAINT "payment_bills_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_leads_tenant_date" ON "leads" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_channels_parent" ON "channels" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_quote_items_quote" ON "quote_items" USING btree ("quote_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_quote_plans_code_tenant" ON "quote_plans" USING btree ("code","tenant_id");--> statement-breakpoint
CREATE INDEX "idx_quote_rooms_quote" ON "quote_rooms" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "idx_orders_tenant_status" ON "orders" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_orders_channel" ON "orders" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_suppliers_type" ON "suppliers" USING btree ("supplier_type");--> statement-breakpoint
CREATE INDEX "idx_install_items_task" ON "install_items" USING btree ("install_task_id");--> statement-breakpoint
CREATE INDEX "idx_measure_items_sheet" ON "measure_items" USING btree ("sheet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_finance_accounts_no_tenant" ON "finance_accounts" USING btree ("account_no","tenant_id");--> statement-breakpoint
CREATE INDEX "idx_payment_bills_order" ON "payment_bills" USING btree ("order_id");--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_supplier_no_unique" UNIQUE("supplier_no");