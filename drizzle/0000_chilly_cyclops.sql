CREATE TYPE "public"."after_sales_status" AS ENUM('PENDING', 'INVESTIGATING', 'PROCESSING', 'PENDING_VISIT', 'PENDING_CALLBACK', 'PENDING_VERIFY', 'CLOSED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."channel_level" AS ENUM('S', 'A', 'B', 'C');--> statement-breakpoint
CREATE TYPE "public"."channel_settlement_type" AS ENUM('PREPAY', 'MONTHLY');--> statement-breakpoint
CREATE TYPE "public"."channel_type" AS ENUM('DECORATION_CO', 'DESIGNER', 'CROSS_INDUSTRY');--> statement-breakpoint
CREATE TYPE "public"."commission_type" AS ENUM('FIXED', 'TIERED');--> statement-breakpoint
CREATE TYPE "public"."cooperation_mode" AS ENUM('BASE_PRICE', 'COMMISSION');--> statement-breakpoint
CREATE TYPE "public"."customer_level" AS ENUM('A', 'B', 'C', 'D');--> statement-breakpoint
CREATE TYPE "public"."customer_lifecycle_stage" AS ENUM('LEAD', 'OPPORTUNITY', 'SIGNED', 'DELIVERED', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."customer_pipeline_status" AS ENUM('UNASSIGNED', 'PENDING_FOLLOWUP', 'PENDING_MEASUREMENT', 'PENDING_QUOTE', 'QUOTE_SENT', 'IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALLATION', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('INDIVIDUAL', 'COMPANY', 'DESIGNER', 'PARTNER');--> statement-breakpoint
CREATE TYPE "public"."decoration_progress" AS ENUM('WATER_ELECTRIC', 'MUD_WOOD', 'INSTALLATION', 'PAINTING', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."fee_check_status" AS ENUM('NONE', 'PENDING', 'PAID', 'WAIVED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."header_process_type" AS ENUM('HOOK', 'PUNCH', 'FIXED_PLEAT');--> statement-breakpoint
CREATE TYPE "public"."install_type" AS ENUM('TOP', 'SIDE');--> statement-breakpoint
CREATE TYPE "public"."intention_level" AS ENUM('HIGH', 'MEDIUM', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."lead_activity_type" AS ENUM('PHONE_CALL', 'WECHAT_CHAT', 'STORE_VISIT', 'HOME_VISIT', 'QUOTE_SENT', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('PENDING_ASSIGNMENT', 'PENDING_FOLLOWUP', 'FOLLOWING_UP', 'INVALID', 'WON', 'VOID');--> statement-breakpoint
CREATE TYPE "public"."liability_reason_category" AS ENUM('PRODUCTION_QUALITY', 'CONSTRUCTION_ERROR', 'DATA_ERROR', 'SALES_ERROR', 'LOGISTICS_ISSUE', 'CUSTOMER_REASON');--> statement-breakpoint
CREATE TYPE "public"."liability_status" AS ENUM('DRAFT', 'PENDING_CONFIRM', 'CONFIRMED', 'DISPUTED', 'ARBITRATED');--> statement-breakpoint
CREATE TYPE "public"."liable_party_type" AS ENUM('COMPANY', 'FACTORY', 'INSTALLER', 'MEASURER', 'LOGISTICS', 'CUSTOMER');--> statement-breakpoint
CREATE TYPE "public"."measure_sheet_status" AS ENUM('DRAFT', 'CONFIRMED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."measure_task_status" AS ENUM('PENDING', 'DISPATCHING', 'PENDING_VISIT', 'PENDING_CONFIRM', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."measure_type" AS ENUM('QUOTE_BASED', 'BLIND', 'SALES_SELF');--> statement-breakpoint
CREATE TYPE "public"."order_settlement_type" AS ENUM('PREPAID', 'CREDIT', 'CASH');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('DRAFT', 'PENDING_MEASURE', 'MEASURED', 'QUOTED', 'SIGNED', 'PAID', 'PENDING_PRODUCTION', 'IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALL', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'WECHAT', 'ALIPAY', 'BANK');--> statement-breakpoint
CREATE TYPE "public"."payment_schedule_status" AS ENUM('PENDING', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."po_type" AS ENUM('FINISHED', 'FABRIC', 'STOCK');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('CURTAIN', 'WALLPAPER', 'WALLCLOTH', 'MATTRESS', 'OTHER', 'CURTAIN_FABRIC', 'CURTAIN_SHEER', 'CURTAIN_TRACK', 'MOTOR', 'CURTAIN_ACCESSORY');--> statement-breakpoint
CREATE TYPE "public"."quote_plan_type" AS ENUM('ECONOMIC', 'COMFORT', 'LUXURY');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('DRAFT', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."room_type" AS ENUM('LIVING_ROOM', 'BEDROOM', 'DINING_ROOM', 'STUDY', 'BALCONY', 'BATHROOM', 'KITCHEN', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."settlement_type" AS ENUM('CASH', 'TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'SALES', 'MANAGER', 'WORKER', 'FINANCE', 'SUPPLY');--> statement-breakpoint
CREATE TYPE "public"."wall_material" AS ENUM('CONCRETE', 'WOOD', 'GYPSUM');--> statement-breakpoint
CREATE TYPE "public"."window_type" AS ENUM('STRAIGHT', 'L_SHAPE', 'U_SHAPE', 'ARC');--> statement-breakpoint
CREATE TYPE "public"."work_order_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sys_dictionaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"label" varchar(100),
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"logo_url" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tenants_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100),
	"phone" varchar(20),
	"password_hash" text,
	"role" varchar(50) DEFAULT 'USER',
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"wechat_openid" varchar(100),
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"dashboard_config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_wechat_openid_unique" UNIQUE("wechat_openid")
);
--> statement-breakpoint
CREATE TABLE "market_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" varchar(100) NOT NULL,
	"level" numeric DEFAULT '1',
	"is_active" boolean DEFAULT true,
	"sort_order" numeric DEFAULT '0',
	"auto_assign_sales_id" uuid,
	"distribution_rule_id" uuid,
	"allow_duplicate_leads" boolean DEFAULT false,
	"url_params_config" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_attribute_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category" "product_category" NOT NULL,
	"template_schema" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"category" "product_category" NOT NULL,
	"description" text,
	"unit_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"default_width" numeric(10, 2),
	"default_fold_ratio" numeric(4, 2),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sku" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"category" "product_category" NOT NULL,
	"unit_price" numeric(12, 2) DEFAULT '0',
	"unit" varchar(20) DEFAULT '件',
	"purchase_price" numeric(12, 2) DEFAULT '0',
	"logistics_cost" numeric(12, 2) DEFAULT '0',
	"processing_cost" numeric(12, 2) DEFAULT '0',
	"loss_rate" numeric(5, 4) DEFAULT '0.0500',
	"retail_price" numeric(12, 2) DEFAULT '0',
	"channel_price_mode" varchar(20) DEFAULT 'FIXED',
	"channel_price" numeric(12, 2) DEFAULT '0',
	"channel_discount_rate" numeric(5, 4) DEFAULT '1.0000',
	"floor_price" numeric(12, 2) DEFAULT '0',
	"is_tob_enabled" boolean DEFAULT true,
	"is_toc_enabled" boolean DEFAULT true,
	"default_supplier_id" uuid,
	"is_stockable" boolean DEFAULT false,
	"description" text,
	"specs" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_no" varchar(50) NOT NULL,
	"name" varchar(50) NOT NULL,
	"type" varchar(20) DEFAULT 'INDIVIDUAL',
	"phone" varchar(20) NOT NULL,
	"phone_secondary" varchar(20),
	"wechat" varchar(50),
	"gender" varchar(10),
	"birthday" timestamp,
	"level" "customer_level" DEFAULT 'D',
	"lifecycle_stage" "customer_lifecycle_stage" DEFAULT 'LEAD' NOT NULL,
	"pipeline_status" "customer_pipeline_status" DEFAULT 'UNASSIGNED' NOT NULL,
	"referrer_customer_id" uuid,
	"source_lead_id" uuid,
	"loyalty_points" integer DEFAULT 0,
	"referral_code" varchar(20),
	"total_orders" integer DEFAULT 0,
	"total_amount" numeric(12, 2) DEFAULT '0',
	"avg_order_amount" numeric(12, 2) DEFAULT '0',
	"first_order_at" timestamp with time zone,
	"last_order_at" timestamp with time zone,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"tags" text[] DEFAULT '{}',
	"is_merged" boolean DEFAULT false,
	"merged_from" uuid[],
	"assigned_sales_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "customers_customer_no_unique" UNIQUE("customer_no"),
	CONSTRAINT "customers_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"quote_id" uuid,
	"purchase_intention" "intention_level",
	"customer_level" varchar(20),
	"activity_type" "lead_activity_type" NOT NULL,
	"content" text NOT NULL,
	"location" varchar(200),
	"next_followup_date" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"old_status" varchar(50),
	"new_status" varchar(50) NOT NULL,
	"changed_by" uuid,
	"changed_at" timestamp with time zone DEFAULT now(),
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_no" varchar(50) NOT NULL,
	"customer_name" varchar(50) NOT NULL,
	"customer_phone" varchar(20) NOT NULL,
	"customer_wechat" varchar(50),
	"address" text,
	"community" varchar(100),
	"house_type" varchar(50),
	"status" "lead_status" DEFAULT 'PENDING_ASSIGNMENT',
	"intention_level" "intention_level",
	"channel_id" uuid,
	"channel_contact_id" uuid,
	"source_channel_id" uuid,
	"source_sub_id" uuid,
	"distribution_rule_id" uuid,
	"source_detail" varchar(100),
	"url_params" jsonb,
	"referrer_name" varchar(100),
	"referrer_customer_id" uuid,
	"estimated_amount" numeric(12, 2),
	"tags" text[],
	"notes" text,
	"lost_reason" text,
	"assigned_sales_id" uuid,
	"assigned_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone,
	"next_followup_at" timestamp with time zone,
	"next_followup_recommendation" timestamp with time zone,
	"decoration_progress" "decoration_progress",
	"quoted_at" timestamp with time zone,
	"visited_store_at" timestamp with time zone,
	"won_at" timestamp with time zone,
	"customer_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "leads_lead_no_unique" UNIQUE("lead_no")
);
--> statement-breakpoint
CREATE TABLE "channel_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"lead_id" uuid,
	"order_id" uuid,
	"amount" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING',
	"formula" jsonb,
	"remark" text,
	"settled_at" timestamp with time zone,
	"settled_by" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "channel_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"position" varchar(50),
	"phone" varchar(20) NOT NULL,
	"is_main" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"channel_type" "channel_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"level" "channel_level" DEFAULT 'C' NOT NULL,
	"contact_name" varchar(100) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"commission_rate" numeric(5, 2) NOT NULL,
	"commission_type" "commission_type",
	"tiered_rates" jsonb,
	"cooperation_mode" "cooperation_mode" NOT NULL,
	"price_discount_rate" numeric(5, 4),
	"settlement_type" "channel_settlement_type" NOT NULL,
	"bank_info" jsonb,
	"contract_files" jsonb,
	"total_leads" integer DEFAULT 0,
	"total_deal_amount" numeric(15, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'ACTIVE',
	"assigned_manager_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"quote_id" uuid NOT NULL,
	"parent_id" uuid,
	"room_id" uuid,
	"category" varchar(50) NOT NULL,
	"product_id" uuid,
	"product_name" varchar(200) NOT NULL,
	"product_sku" varchar(100),
	"room_name" varchar(100),
	"unit" varchar(20),
	"unit_price" numeric(10, 2) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"width" numeric(10, 2),
	"height" numeric(10, 2),
	"fold_ratio" numeric(4, 2),
	"process_fee" numeric(10, 2),
	"subtotal" numeric(12, 2) NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"calculation_params" jsonb,
	"remark" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"override_price" numeric(10, 2),
	"role" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"quote_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"measure_room_id" uuid,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"quote_no" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"lead_id" uuid,
	"measure_variant_id" uuid,
	"parent_quote_id" uuid,
	"is_active" boolean DEFAULT true,
	"title" varchar(200),
	"total_amount" numeric(12, 2) DEFAULT '0',
	"discount_rate" numeric(5, 4),
	"discount_amount" numeric(12, 2) DEFAULT '0',
	"final_amount" numeric(12, 2) DEFAULT '0',
	"status" varchar(50) DEFAULT 'DRAFT',
	"version" integer DEFAULT 1 NOT NULL,
	"valid_until" timestamp with time zone,
	"notes" text,
	"locked_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "quotes_quote_no_unique" UNIQUE("quote_no")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"quote_item_id" uuid NOT NULL,
	"room_name" varchar(100) NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"category" "product_category" NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"width" numeric(10, 2),
	"height" numeric(10, 2),
	"unit_price" numeric(10, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"po_id" uuid,
	"supplier_id" uuid,
	"status" varchar(50) DEFAULT 'PENDING',
	"remark" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_no" varchar(50) NOT NULL,
	"quote_id" uuid NOT NULL,
	"quote_version_id" uuid NOT NULL,
	"lead_id" uuid,
	"customer_id" uuid NOT NULL,
	"customer_name" varchar(100),
	"customer_phone" varchar(20),
	"delivery_address" text,
	"total_amount" numeric(12, 2) DEFAULT '0',
	"paid_amount" numeric(12, 2) DEFAULT '0',
	"balance_amount" numeric(12, 2) DEFAULT '0',
	"settlement_type" "order_settlement_type" NOT NULL,
	"confirmation_img" text,
	"payment_proof_img" text,
	"payment_amount" numeric(12, 2),
	"payment_method" "payment_method",
	"payment_time" timestamp with time zone,
	"prepaid_payment_id" uuid,
	"status" "order_status" DEFAULT 'DRAFT',
	"is_locked" boolean DEFAULT false,
	"locked_at" timestamp with time zone,
	"sales_id" uuid,
	"remark" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "orders_order_no_unique" UNIQUE("order_no")
);
--> statement-breakpoint
CREATE TABLE "payment_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"statement_id" uuid,
	"name" varchar(100) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"expected_date" date,
	"actual_date" date,
	"status" "payment_schedule_status" DEFAULT 'PENDING',
	"proof_img" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "channel_specific_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"special_price" numeric(12, 2) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_bundle_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"bundle_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" varchar(20),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"bundle_sku" varchar(50) NOT NULL,
	"bundle_name" varchar(200) NOT NULL,
	"category" varchar(50),
	"retail_price" numeric(12, 2) DEFAULT '0',
	"channel_price" numeric(12, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "product_bundles_bundle_sku_unique" UNIQUE("bundle_sku")
);
--> statement-breakpoint
CREATE TABLE "product_suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"is_default" boolean DEFAULT false,
	"purchase_price" numeric(12, 2),
	"logistics_cost" numeric(12, 2),
	"processing_cost" numeric(12, 2),
	"lead_time_days" integer DEFAULT 7,
	"min_order_quantity" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "production_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"task_no" varchar(50) NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid,
	"workshop" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING',
	"assigned_worker_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "production_tasks_task_no_unique" UNIQUE("task_no")
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"po_id" uuid NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0',
	"quote_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"po_no" varchar(50) NOT NULL,
	"order_id" uuid,
	"supplier_id" uuid,
	"supplier_name" varchar(100) NOT NULL,
	"type" "po_type" DEFAULT 'FINISHED',
	"split_rule_id" uuid,
	"status" varchar(50) DEFAULT 'DRAFT',
	"total_amount" numeric(12, 2) DEFAULT '0',
	"expected_date" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "purchase_orders_po_no_unique" UNIQUE("po_no")
);
--> statement-breakpoint
CREATE TABLE "split_route_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"priority" integer DEFAULT 0,
	"name" varchar(100) NOT NULL,
	"conditions" text NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_supplier_id" uuid,
	"is_active" integer DEFAULT 1,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_no" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"contact_person" varchar(100),
	"phone" varchar(50),
	"payment_period" varchar(50) DEFAULT 'CASH',
	"is_active" boolean DEFAULT true,
	"address" text,
	"remark" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "work_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wo_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"wo_no" varchar(50) NOT NULL,
	"order_id" uuid NOT NULL,
	"po_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"status" "work_order_status" DEFAULT 'PENDING',
	"start_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"remark" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "work_orders_wo_no_unique" UNIQUE("wo_no")
);
--> statement-breakpoint
CREATE TABLE "install_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"task_no" varchar(50) NOT NULL,
	"order_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING',
	"scheduled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"installer_id" uuid,
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "install_tasks_task_no_unique" UNIQUE("task_no")
);
--> statement-breakpoint
CREATE TABLE "measure_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sheet_id" uuid NOT NULL,
	"room_name" varchar(100) NOT NULL,
	"window_type" "window_type" NOT NULL,
	"width" numeric(12, 2) NOT NULL,
	"height" numeric(12, 2) NOT NULL,
	"install_type" "install_type",
	"bracket_dist" numeric(12, 2),
	"wall_material" "wall_material",
	"has_box" boolean DEFAULT false,
	"box_depth" numeric(12, 2),
	"is_electric" boolean DEFAULT false,
	"remark" text,
	"segment_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "measure_sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"status" "measure_sheet_status" DEFAULT 'DRAFT',
	"round" integer NOT NULL,
	"variant" varchar(50) NOT NULL,
	"site_photos" jsonb,
	"sketch_map" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "measure_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"measure_no" varchar(50) NOT NULL,
	"lead_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" "measure_task_status" DEFAULT 'PENDING',
	"scheduled_at" timestamp with time zone,
	"check_in_at" timestamp with time zone,
	"check_in_location" jsonb,
	"type" "measure_type" DEFAULT 'BLIND',
	"assigned_worker_id" uuid,
	"round" integer DEFAULT 1 NOT NULL,
	"remark" text,
	"reject_count" integer DEFAULT 0 NOT NULL,
	"reject_reason" text,
	"is_fee_exempt" boolean DEFAULT false,
	"fee_check_status" "fee_check_status" DEFAULT 'NONE',
	"fee_approval_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	CONSTRAINT "measure_tasks_measure_no_unique" UNIQUE("measure_no")
);
--> statement-breakpoint
CREATE TABLE "account_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"transaction_no" varchar(50) NOT NULL,
	"account_id" uuid NOT NULL,
	"transaction_type" varchar(20) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"balance_before" numeric(12, 2) NOT NULL,
	"balance_after" numeric(12, 2) NOT NULL,
	"related_type" varchar(50) NOT NULL,
	"related_id" uuid NOT NULL,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "account_transactions_transaction_no_unique" UNIQUE("transaction_no")
);
--> statement-breakpoint
CREATE TABLE "ap_labor_fee_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"statement_id" uuid NOT NULL,
	"install_task_id" uuid NOT NULL,
	"install_task_no" varchar(50) NOT NULL,
	"fee_type" varchar(20) NOT NULL,
	"description" varchar(200) NOT NULL,
	"calculation" varchar(200) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ap_labor_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"statement_no" varchar(50) NOT NULL,
	"worker_id" uuid NOT NULL,
	"worker_name" varchar(100) NOT NULL,
	"settlement_period" varchar(20) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"pending_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) NOT NULL,
	"completed_at" timestamp with time zone,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ap_labor_statements_statement_no_unique" UNIQUE("statement_no")
);
--> statement-breakpoint
CREATE TABLE "ap_supplier_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"statement_no" varchar(50) NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"supplier_name" varchar(100) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"pending_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) NOT NULL,
	"invoice_no" varchar(100),
	"invoiced_at" timestamp with time zone,
	"invoice_amount" numeric(12, 2),
	"tax_rate" numeric(5, 4),
	"tax_amount" numeric(12, 2),
	"is_tax_inclusive" boolean DEFAULT false,
	"completed_at" timestamp with time zone,
	"purchaser_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ap_supplier_statements_statement_no_unique" UNIQUE("statement_no")
);
--> statement-breakpoint
CREATE TABLE "ar_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"statement_no" varchar(50) NOT NULL,
	"order_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"customer_name" varchar(100) NOT NULL,
	"settlement_type" varchar(20) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"received_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"pending_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) NOT NULL,
	"invoice_no" varchar(100),
	"invoiced_at" timestamp with time zone,
	"tax_rate" numeric(5, 4),
	"tax_amount" numeric(12, 2),
	"is_tax_inclusive" boolean DEFAULT false,
	"completed_at" timestamp with time zone,
	"sales_id" uuid NOT NULL,
	"channel_id" uuid,
	"commission_rate" numeric(5, 4),
	"commission_amount" numeric(12, 2),
	"commission_status" varchar(20),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ar_statements_statement_no_unique" UNIQUE("statement_no")
);
--> statement-breakpoint
CREATE TABLE "commission_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"commission_no" varchar(50) NOT NULL,
	"ar_statement_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"channel_name" varchar(100) NOT NULL,
	"cooperation_mode" varchar(20) NOT NULL,
	"order_amount" numeric(12, 2) NOT NULL,
	"commission_rate" numeric(5, 4) NOT NULL,
	"commission_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) NOT NULL,
	"calculated_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "commission_records_commission_no_unique" UNIQUE("commission_no")
);
--> statement-breakpoint
CREATE TABLE "finance_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"account_no" varchar(50) NOT NULL,
	"account_name" varchar(100) NOT NULL,
	"account_type" varchar(20) NOT NULL,
	"account_number" varchar(100),
	"bank_name" varchar(100),
	"branch_name" varchar(100),
	"holder_name" varchar(100) NOT NULL,
	"balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finance_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"config_key" varchar(100) NOT NULL,
	"config_value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_bill_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payment_bill_id" uuid NOT NULL,
	"statement_type" varchar(50) NOT NULL,
	"statement_id" uuid NOT NULL,
	"statement_no" varchar(50) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payment_no" varchar(50) NOT NULL,
	"type" varchar(20) DEFAULT 'SUPPLIER',
	"payee_type" varchar(20) NOT NULL,
	"payee_id" uuid NOT NULL,
	"payee_name" varchar(100) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) NOT NULL,
	"payment_method" varchar(20) NOT NULL,
	"account_id" uuid,
	"proof_url" text NOT NULL,
	"paid_at" timestamp with time zone,
	"recorded_by" uuid NOT NULL,
	"remark" text,
	"is_verified" boolean DEFAULT false,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "payment_bills_payment_no_unique" UNIQUE("payment_no")
);
--> statement-breakpoint
CREATE TABLE "payment_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payment_order_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"statement_id" uuid,
	"schedule_id" uuid,
	"order_no" varchar(50) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payment_no" varchar(50) NOT NULL,
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
	CONSTRAINT "payment_orders_payment_no_unique" UNIQUE("payment_no")
);
--> statement-breakpoint
CREATE TABLE "reconciliation_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reconciliation_id" uuid NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_id" uuid NOT NULL,
	"document_no" varchar(50) NOT NULL,
	"document_amount" numeric(12, 2) NOT NULL,
	"reconciliation_amount" numeric(12, 2) NOT NULL,
	"difference" numeric(12, 2) NOT NULL,
	"status" varchar(20) NOT NULL,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reconciliation_no" varchar(50) NOT NULL,
	"reconciliation_type" varchar(20) NOT NULL,
	"target_type" varchar(20) NOT NULL,
	"target_id" uuid NOT NULL,
	"target_name" varchar(100) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"matched_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"unmatched_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" varchar(20) NOT NULL,
	"reconciled_at" timestamp with time zone,
	"confirmed_by" uuid,
	"confirmed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reconciliations_reconciliation_no_unique" UNIQUE("reconciliation_no")
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING',
	"requester_id" uuid NOT NULL,
	"approver_id" uuid,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "after_sales_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_no" varchar(50) NOT NULL,
	"order_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"install_task_id" uuid,
	"type" varchar(50) NOT NULL,
	"status" "after_sales_status" DEFAULT 'PENDING' NOT NULL,
	"priority" varchar(20) DEFAULT 'MEDIUM',
	"description" text,
	"photos" text[],
	"resolution" text,
	"estimated_cost" numeric(12, 2),
	"total_actual_cost" numeric(12, 2) DEFAULT '0.00',
	"actual_deduction" numeric(12, 2) DEFAULT '0.00',
	"internal_loss" numeric(12, 2) DEFAULT '0.00',
	"is_warranty" boolean DEFAULT true,
	"satisfaction" integer,
	"channel_satisfaction" integer,
	"assigned_to" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"closed_at" timestamp with time zone,
	"sla_response_deadline" timestamp with time zone,
	"sla_visit_deadline" timestamp with time zone,
	"sla_closure_deadline" timestamp with time zone,
	CONSTRAINT "after_sales_tickets_ticket_no_unique" UNIQUE("ticket_no")
);
--> statement-breakpoint
CREATE TABLE "liability_notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"notice_no" varchar(50) NOT NULL,
	"after_sales_id" uuid NOT NULL,
	"liable_party_type" "liable_party_type" NOT NULL,
	"liable_party_id" uuid,
	"liable_party_credit" jsonb,
	"reason" text NOT NULL,
	"liability_reason_category" "liability_reason_category",
	"amount" numeric(12, 2) NOT NULL,
	"cost_items" jsonb,
	"source_purchase_order_id" uuid,
	"source_install_task_id" uuid,
	"status" "liability_status" DEFAULT 'DRAFT' NOT NULL,
	"evidence_photos" text[],
	"confirmed_at" timestamp with time zone,
	"confirmed_by" uuid,
	"dispute_reason" text,
	"dispute_evidence" text[],
	"arbitration_result" text,
	"arbitrated_by" uuid,
	"arbitrated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "liability_notices_notice_no_unique" UNIQUE("notice_no")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"table_name" text NOT NULL,
	"record_id" text NOT NULL,
	"action" text NOT NULL,
	"user_id" uuid,
	"changed_fields" jsonb,
	"old_values" jsonb,
	"new_values" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sys_dictionaries" ADD CONSTRAINT "sys_dictionaries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_channels" ADD CONSTRAINT "market_channels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_channels" ADD CONSTRAINT "market_channels_auto_assign_sales_id_users_id_fk" FOREIGN KEY ("auto_assign_sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_templates" ADD CONSTRAINT "product_attribute_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_default_supplier_id_suppliers_id_fk" FOREIGN KEY ("default_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_assigned_sales_id_users_id_fk" FOREIGN KEY ("assigned_sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_channel_contact_id_channel_contacts_id_fk" FOREIGN KEY ("channel_contact_id") REFERENCES "public"."channel_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_source_channel_id_market_channels_id_fk" FOREIGN KEY ("source_channel_id") REFERENCES "public"."market_channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_source_sub_id_market_channels_id_fk" FOREIGN KEY ("source_sub_id") REFERENCES "public"."market_channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_referrer_customer_id_customers_id_fk" FOREIGN KEY ("referrer_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_sales_id_users_id_fk" FOREIGN KEY ("assigned_sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_commissions" ADD CONSTRAINT "channel_commissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_commissions" ADD CONSTRAINT "channel_commissions_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_commissions" ADD CONSTRAINT "channel_commissions_settled_by_users_id_fk" FOREIGN KEY ("settled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_commissions" ADD CONSTRAINT "channel_commissions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_contacts" ADD CONSTRAINT "channel_contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_contacts" ADD CONSTRAINT "channel_contacts_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_contacts" ADD CONSTRAINT "channel_contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_assigned_manager_id_users_id_fk" FOREIGN KEY ("assigned_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_room_id_quote_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."quote_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_plan_items" ADD CONSTRAINT "quote_plan_items_plan_id_quote_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."quote_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_plans" ADD CONSTRAINT "quote_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_rooms" ADD CONSTRAINT "quote_rooms_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_rooms" ADD CONSTRAINT "quote_rooms_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quote_item_id_quote_items_id_fk" FOREIGN KEY ("quote_item_id") REFERENCES "public"."quote_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_sales_id_users_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_specific_prices" ADD CONSTRAINT "channel_specific_prices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_bundle_items" ADD CONSTRAINT "product_bundle_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_bundle_items" ADD CONSTRAINT "product_bundle_items_bundle_id_product_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."product_bundles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_bundles" ADD CONSTRAINT "product_bundles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_assigned_worker_id_users_id_fk" FOREIGN KEY ("assigned_worker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_route_rules" ADD CONSTRAINT "split_route_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_route_rules" ADD CONSTRAINT "split_route_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_items" ADD CONSTRAINT "work_order_items_wo_id_work_orders_id_fk" FOREIGN KEY ("wo_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_items" ADD CONSTRAINT "work_order_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_installer_id_users_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_items" ADD CONSTRAINT "measure_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_items" ADD CONSTRAINT "measure_items_sheet_id_measure_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."measure_sheets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_sheets" ADD CONSTRAINT "measure_sheets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_sheets" ADD CONSTRAINT "measure_sheets_task_id_measure_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."measure_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD CONSTRAINT "measure_tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD CONSTRAINT "measure_tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD CONSTRAINT "measure_tasks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD CONSTRAINT "measure_tasks_assigned_worker_id_users_id_fk" FOREIGN KEY ("assigned_worker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transactions" ADD CONSTRAINT "account_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transactions" ADD CONSTRAINT "account_transactions_account_id_finance_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."finance_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_labor_fee_details" ADD CONSTRAINT "ap_labor_fee_details_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_labor_fee_details" ADD CONSTRAINT "ap_labor_fee_details_statement_id_ap_labor_statements_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."ap_labor_statements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_labor_fee_details" ADD CONSTRAINT "ap_labor_fee_details_install_task_id_install_tasks_id_fk" FOREIGN KEY ("install_task_id") REFERENCES "public"."install_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_labor_statements" ADD CONSTRAINT "ap_labor_statements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_labor_statements" ADD CONSTRAINT "ap_labor_statements_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_labor_statements" ADD CONSTRAINT "ap_labor_statements_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_supplier_statements" ADD CONSTRAINT "ap_supplier_statements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_supplier_statements" ADD CONSTRAINT "ap_supplier_statements_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_supplier_statements" ADD CONSTRAINT "ap_supplier_statements_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_supplier_statements" ADD CONSTRAINT "ap_supplier_statements_purchaser_id_users_id_fk" FOREIGN KEY ("purchaser_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_statements" ADD CONSTRAINT "ar_statements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_statements" ADD CONSTRAINT "ar_statements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_statements" ADD CONSTRAINT "ar_statements_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_statements" ADD CONSTRAINT "ar_statements_sales_id_users_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_statements" ADD CONSTRAINT "ar_statements_channel_id_market_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."market_channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_ar_statement_id_ar_statements_id_fk" FOREIGN KEY ("ar_statement_id") REFERENCES "public"."ar_statements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_channel_id_market_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."market_channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_accounts" ADD CONSTRAINT "finance_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_configs" ADD CONSTRAINT "finance_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_bill_items" ADD CONSTRAINT "payment_bill_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_bill_items" ADD CONSTRAINT "payment_bill_items_payment_bill_id_payment_bills_id_fk" FOREIGN KEY ("payment_bill_id") REFERENCES "public"."payment_bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_bills" ADD CONSTRAINT "payment_bills_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_bills" ADD CONSTRAINT "payment_bills_account_id_finance_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."finance_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_bills" ADD CONSTRAINT "payment_bills_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_bills" ADD CONSTRAINT "payment_bills_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_order_items" ADD CONSTRAINT "payment_order_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_order_items" ADD CONSTRAINT "payment_order_items_payment_order_id_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "public"."payment_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_order_items" ADD CONSTRAINT "payment_order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_order_items" ADD CONSTRAINT "payment_order_items_statement_id_ar_statements_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."ar_statements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_order_items" ADD CONSTRAINT "payment_order_items_schedule_id_payment_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."payment_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_account_id_finance_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."finance_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_details" ADD CONSTRAINT "reconciliation_details_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_details" ADD CONSTRAINT "reconciliation_details_reconciliation_id_reconciliations_id_fk" FOREIGN KEY ("reconciliation_id") REFERENCES "public"."reconciliations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_tickets" ADD CONSTRAINT "after_sales_tickets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_tickets" ADD CONSTRAINT "after_sales_tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_tickets" ADD CONSTRAINT "after_sales_tickets_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_tickets" ADD CONSTRAINT "after_sales_tickets_install_task_id_install_tasks_id_fk" FOREIGN KEY ("install_task_id") REFERENCES "public"."install_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_tickets" ADD CONSTRAINT "after_sales_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_tickets" ADD CONSTRAINT "after_sales_tickets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liability_notices" ADD CONSTRAINT "liability_notices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liability_notices" ADD CONSTRAINT "liability_notices_after_sales_id_after_sales_tickets_id_fk" FOREIGN KEY ("after_sales_id") REFERENCES "public"."after_sales_tickets"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "liability_notices" ADD CONSTRAINT "liability_notices_source_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("source_purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liability_notices" ADD CONSTRAINT "liability_notices_source_install_task_id_install_tasks_id_fk" FOREIGN KEY ("source_install_task_id") REFERENCES "public"."install_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liability_notices" ADD CONSTRAINT "liability_notices_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liability_notices" ADD CONSTRAINT "liability_notices_arbitrated_by_users_id_fk" FOREIGN KEY ("arbitrated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_market_channels_tenant" ON "market_channels" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_market_channels_parent" ON "market_channels" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_product_attr_templates_tenant" ON "product_attribute_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_product_attr_templates_category" ON "product_attribute_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_products_tenant" ON "products" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_products_sku" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_products_supplier" ON "products" USING btree ("default_supplier_id");--> statement-breakpoint
CREATE INDEX "idx_customers_tenant" ON "customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_customers_phone" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_customers_referrer" ON "customers" USING btree ("referrer_customer_id");--> statement-breakpoint
CREATE INDEX "idx_lead_activities_lead" ON "lead_activities" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_lead_history_lead" ON "lead_status_history" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_leads_tenant" ON "leads" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_leads_phone" ON "leads" USING btree ("customer_phone");--> statement-breakpoint
CREATE INDEX "idx_leads_status" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_leads_sales" ON "leads" USING btree ("assigned_sales_id");--> statement-breakpoint
CREATE INDEX "idx_commissions_tenant" ON "channel_commissions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_commissions_channel" ON "channel_commissions" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_commissions_status" ON "channel_commissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_channel_contacts_channel" ON "channel_contacts" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_channel_contacts_phone" ON "channel_contacts" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_channels_tenant" ON "channels" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_channels_code" ON "channels" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_channels_phone" ON "channels" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_quotes_tenant" ON "quotes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_quotes_customer" ON "quotes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_tenant" ON "orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_orders_customer" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_orders_quote" ON "orders" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "idx_orders_order_no" ON "orders" USING btree ("order_no");--> statement-breakpoint
CREATE INDEX "idx_payment_schedules_order" ON "payment_schedules" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_csp_tenant" ON "channel_specific_prices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_csp_product" ON "channel_specific_prices" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_csp_channel" ON "channel_specific_prices" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_bundle_items_bundle" ON "product_bundle_items" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "idx_bundles_tenant" ON "product_bundles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bundles_sku" ON "product_bundles" USING btree ("bundle_sku");--> statement-breakpoint
CREATE INDEX "idx_product_suppliers_tenant" ON "product_suppliers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_product_suppliers_product" ON "product_suppliers" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_suppliers_supplier" ON "product_suppliers" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_production_tasks_tenant" ON "production_tasks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_production_tasks_order" ON "production_tasks" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_po_tenant" ON "purchase_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_po_order" ON "purchase_orders" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_suppliers_tenant" ON "suppliers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_work_order_items_wo" ON "work_order_items" USING btree ("wo_id");--> statement-breakpoint
CREATE INDEX "idx_work_orders_tenant" ON "work_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_work_orders_order" ON "work_orders" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_work_orders_po" ON "work_orders" USING btree ("po_id");--> statement-breakpoint
CREATE INDEX "idx_install_tenant" ON "install_tasks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_install_order" ON "install_tasks" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_measure_tasks_tenant" ON "measure_tasks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_measure_tasks_lead" ON "measure_tasks" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_measure_tasks_status" ON "measure_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_account_transactions_tenant" ON "account_transactions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_account_transactions_account" ON "account_transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_account_transactions_related" ON "account_transactions" USING btree ("related_id");--> statement-breakpoint
CREATE INDEX "idx_ap_labor_fee_details_statement" ON "ap_labor_fee_details" USING btree ("statement_id");--> statement-breakpoint
CREATE INDEX "idx_ap_labor_fee_details_task" ON "ap_labor_fee_details" USING btree ("install_task_id");--> statement-breakpoint
CREATE INDEX "idx_ap_labor_statements_tenant" ON "ap_labor_statements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ap_labor_statements_worker" ON "ap_labor_statements" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "idx_ap_supplier_statements_tenant" ON "ap_supplier_statements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ap_supplier_statements_po" ON "ap_supplier_statements" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_ap_supplier_statements_supplier" ON "ap_supplier_statements" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_ar_statements_tenant" ON "ar_statements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ar_statements_order" ON "ar_statements" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_ar_statements_customer" ON "ar_statements" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_ar_statements_status" ON "ar_statements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_commission_records_tenant" ON "commission_records" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_commission_records_channel" ON "commission_records" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_commission_records_ar" ON "commission_records" USING btree ("ar_statement_id");--> statement-breakpoint
CREATE INDEX "idx_finance_accounts_tenant" ON "finance_accounts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_finance_configs_tenant" ON "finance_configs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_finance_configs_key" ON "finance_configs" USING btree ("config_key");--> statement-breakpoint
CREATE INDEX "idx_payment_bill_items_bill" ON "payment_bill_items" USING btree ("payment_bill_id");--> statement-breakpoint
CREATE INDEX "idx_payment_bill_items_statement" ON "payment_bill_items" USING btree ("statement_id");--> statement-breakpoint
CREATE INDEX "idx_payment_bills_tenant" ON "payment_bills" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_payment_bills_payee" ON "payment_bills" USING btree ("payee_id");--> statement-breakpoint
CREATE INDEX "idx_payment_order_items_payment" ON "payment_order_items" USING btree ("payment_order_id");--> statement-breakpoint
CREATE INDEX "idx_payment_order_items_order" ON "payment_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_payment_orders_tenant" ON "payment_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_payment_orders_customer" ON "payment_orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_payment_orders_status" ON "payment_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reconciliation_details_recon" ON "reconciliation_details" USING btree ("reconciliation_id");--> statement-breakpoint
CREATE INDEX "idx_reconciliation_details_doc" ON "reconciliation_details" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_reconciliations_tenant" ON "reconciliations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_reconciliations_target" ON "reconciliations" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "idx_reconciliations_status" ON "reconciliations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_approvals_tenant" ON "approvals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_approvals_entity" ON "approvals" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_as_tenant" ON "after_sales_tickets" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_as_order" ON "after_sales_tickets" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_as_customer" ON "after_sales_tickets" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_as_ticket_no" ON "after_sales_tickets" USING btree ("ticket_no");--> statement-breakpoint
CREATE INDEX "idx_ln_tenant" ON "liability_notices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ln_after_sales" ON "liability_notices" USING btree ("after_sales_id");--> statement-breakpoint
CREATE INDEX "idx_ln_notice_no" ON "liability_notices" USING btree ("notice_no");