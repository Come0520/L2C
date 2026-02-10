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
-- Already applied to DB manually/previously
ALTER TABLE "install_tasks" ADD COLUMN "assigned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "check_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "check_in_location" jsonb;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "actual_labor_fee" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "adjustment_reason" text;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "rating" integer;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "confirmed_by" uuid;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Add approval fields to quotes table for discount control
ALTER TABLE quotes ADD COLUMN approval_required BOOLEAN DEFAULT FALSE;
ALTER TABLE quotes ADD COLUMN approver_id UUID REFERENCES users(id);
ALTER TABLE quotes ADD COLUMN approved_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN reject_reason TEXT;
CREATE TABLE "approval_flows" (
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
CREATE TABLE "approval_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"flow_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"approver_role" varchar(50),
	"approver_user_id" uuid,
	"node_type" varchar(20) DEFAULT 'APPROVAL',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approval_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"approval_id" uuid NOT NULL,
	"node_id" uuid,
	"approver_id" uuid,
	"status" varchar(50) DEFAULT 'PENDING',
	"comment" text,
	"action_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "approvals" DROP CONSTRAINT "approvals_approver_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "flow_id" uuid;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "current_node_id" uuid;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "approval_flows" ADD CONSTRAINT "approval_flows_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD CONSTRAINT "approval_nodes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD CONSTRAINT "approval_nodes_flow_id_approval_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."approval_flows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD CONSTRAINT "approval_nodes_approver_user_id_users_id_fk" FOREIGN KEY ("approver_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_approval_id_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."approvals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_node_id_approval_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."approval_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_approval_flows_tenant_code" ON "approval_flows" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_approval_nodes_flow" ON "approval_nodes" USING btree ("flow_id");--> statement-breakpoint
CREATE INDEX "idx_approval_tasks_approver" ON "approval_tasks" USING btree ("approver_id");--> statement-breakpoint
CREATE INDEX "idx_approval_tasks_approval" ON "approval_tasks" USING btree ("approval_id");--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_flow_id_approval_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."approval_flows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_approvals_requester" ON "approvals" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "idx_approvals_status" ON "approvals" USING btree ("status");--> statement-breakpoint
ALTER TABLE "approvals" DROP COLUMN "approver_id";

ALTER TABLE "quotes" ADD COLUMN "root_quote_id" uuid;

-- Backfill V1 (Roots)
UPDATE "quotes" SET "root_quote_id" = "id" WHERE "parent_quote_id" IS NULL;

-- Backfill Children (Assumes depth 1 for now, or repeat if needed)
UPDATE "quotes" 
SET "root_quote_id" = (
    SELECT "p"."root_quote_id" 
    FROM "quotes" "p" 
    WHERE "p"."id" = "quotes"."parent_quote_id"
)
WHERE "parent_quote_id" IS NOT NULL;

-- Fallback for orphans or deep chains not caught: set to self if still null
UPDATE "quotes" SET "root_quote_id" = "id" WHERE "root_quote_id" IS NULL;

-- Add Constraint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_version" ON "quotes" ("root_quote_id") WHERE "is_active" = true;
CREATE TYPE "public"."install_item_issue_category" AS ENUM('NONE', 'MISSING', 'DAMAGED', 'WRONG_SIZE');--> statement-breakpoint
CREATE TYPE "public"."install_photo_type" AS ENUM('BEFORE', 'AFTER', 'DETAIL');--> statement-breakpoint
CREATE TYPE "public"."install_task_category" AS ENUM('CURTAIN', 'WALLCLOTH', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."install_task_source_type" AS ENUM('ORDER', 'AFTER_SALES', 'REWORK');--> statement-breakpoint
CREATE TYPE "public"."install_task_status" AS ENUM('PENDING_DISPATCH', 'DISPATCHING', 'PENDING_VISIT', 'PENDING_CONFIRM', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PARTIAL', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."po_fabric_status" AS ENUM('DRAFT', 'IN_PRODUCTION', 'DELIVERED', 'STOCKED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."po_finished_status" AS ENUM('DRAFT', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "install_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"install_task_id" uuid NOT NULL,
	"order_item_id" uuid,
	"product_name" varchar(200) NOT NULL,
	"room_name" varchar(100),
	"quantity" numeric(12, 2) NOT NULL,
	"actual_installed_quantity" numeric(12, 2),
	"issue_category" "install_item_issue_category" DEFAULT 'NONE',
	"is_installed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "install_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"install_task_id" uuid NOT NULL,
	"photo_type" "install_photo_type" NOT NULL,
	"photo_url" text NOT NULL,
	"room_name" varchar(100),
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "install_tasks" ALTER COLUMN "status" SET DEFAULT 'PENDING_DISPATCH'::"public"."install_task_status";--> statement-breakpoint
ALTER TABLE "install_tasks" ALTER COLUMN "status" SET DATA TYPE "public"."install_task_status" USING "status"::"public"."install_task_status";--> statement-breakpoint
ALTER TABLE "install_tasks" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_items" ADD COLUMN "cost_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "root_quote_id" uuid;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "approval_required" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "approver_id" uuid;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "reject_reason" text;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "order_item_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "product_sku" varchar(100);--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "category" varchar(50);--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "width" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "height" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "subtotal" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "remark" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "after_sales_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "external_po_no" varchar(100);--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "supplier_quote_img" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "sent_method" varchar(20);--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "produced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "logistics_company" varchar(50);--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "logistics_no" varchar(100);--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "shipped_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "payment_status" varchar(20) DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "remark" text;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "source_type" "install_task_source_type" DEFAULT 'ORDER' NOT NULL;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "after_sales_id" uuid;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "customer_name" varchar(100);--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "customer_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "category" "install_task_category" DEFAULT 'CURTAIN' NOT NULL;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "sales_id" uuid;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "dispatcher_id" uuid;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "installer_name" varchar(100);--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "scheduled_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "scheduled_time_slot" varchar(50);--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "actual_start_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "actual_end_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "logistics_ready_status" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "check_out_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "check_out_location" jsonb;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "customer_signature_url" text;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "signed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "labor_fee" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "fee_breakdown" jsonb;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "checklist_status" jsonb;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "field_discovery" jsonb;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "rating_comment" text;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "remark" text;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "reject_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "reject_reason" text;--> statement-breakpoint
ALTER TABLE "install_items" ADD CONSTRAINT "install_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_items" ADD CONSTRAINT "install_items_install_task_id_install_tasks_id_fk" FOREIGN KEY ("install_task_id") REFERENCES "public"."install_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_photos" ADD CONSTRAINT "install_photos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_photos" ADD CONSTRAINT "install_photos_install_task_id_install_tasks_id_fk" FOREIGN KEY ("install_task_id") REFERENCES "public"."install_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_after_sales_id_after_sales_tickets_id_fk" FOREIGN KEY ("after_sales_id") REFERENCES "public"."after_sales_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_sales_id_users_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_dispatcher_id_users_id_fk" FOREIGN KEY ("dispatcher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_poi_tenant" ON "purchase_order_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_poi_po" ON "purchase_order_items" USING btree ("po_id");--> statement-breakpoint
CREATE INDEX "idx_poi_order_item" ON "purchase_order_items" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "idx_po_after_sales" ON "purchase_orders" USING btree ("after_sales_id");--> statement-breakpoint
CREATE INDEX "idx_install_installer" ON "install_tasks" USING btree ("installer_id");--> statement-breakpoint
CREATE INDEX "idx_install_scheduled_date" ON "install_tasks" USING btree ("scheduled_date");--> statement-breakpoint
ALTER TABLE "install_tasks" DROP COLUMN "scheduled_at";
CREATE TYPE "public"."notification_channel" AS ENUM('IN_APP', 'EMAIL', 'SMS', 'WECHAT', 'WECHAT', 'LARK');--> statement-breakpoint
CREATE TYPE "public"."notification_type_enum" AS ENUM('SYSTEM', 'ORDER_STATUS', 'APPROVAL', 'ALERT', 'MENTION', 'INFO', 'SUCCESS', 'WARNING', 'ERROR');--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_type" varchar(50) NOT NULL,
	"channels" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text,
	"type" varchar(50) DEFAULT 'SYSTEM',
	"channel" varchar(20) DEFAULT 'IN_APP',
	"is_read" boolean DEFAULT false,
	"read_at" timestamp with time zone,
	"link_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notif_prefs_user" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_tenant" ON "notifications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_created" ON "notifications" USING btree ("created_at");
CREATE TABLE "product_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"old_price" numeric(12, 2),
	"new_price" numeric(12, 2),
	"change_type" varchar(50) NOT NULL,
	"reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "measure_task_splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"original_task_id" uuid NOT NULL,
	"new_task_id" uuid NOT NULL,
	"reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loyalty_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"source" varchar(50) NOT NULL,
	"points" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "purchase_order_items" ALTER COLUMN "order_item_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "market_channels" ADD COLUMN "code" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock_unit" varchar(20);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sales_unit" varchar(20);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "conversion_rate" numeric(10, 4);--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "min_profit_margin" numeric(5, 4);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "attributes" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "calculation_params" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "snapshot_data" jsonb;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "version_display" varchar(20);--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_task_splits" ADD CONSTRAINT "measure_task_splits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_task_splits" ADD CONSTRAINT "measure_task_splits_original_task_id_measure_tasks_id_fk" FOREIGN KEY ("original_task_id") REFERENCES "public"."measure_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_task_splits" ADD CONSTRAINT "measure_task_splits_new_task_id_measure_tasks_id_fk" FOREIGN KEY ("new_task_id") REFERENCES "public"."measure_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_task_splits" ADD CONSTRAINT "measure_task_splits_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_product_price_history_product" ON "product_price_history" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_price_history_tenant" ON "product_price_history" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_measure_task_splits_tenant" ON "measure_task_splits" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_measure_task_splits_original" ON "measure_task_splits" USING btree ("original_task_id");--> statement-breakpoint
CREATE INDEX "idx_loyalty_customer" ON "loyalty_transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_loyalty_ref" ON "loyalty_transactions" USING btree ("reference_id");
CREATE TYPE "public"."approval_node_mode" AS ENUM('ANY', 'ALL', 'MAJORITY');--> statement-breakpoint
CREATE TYPE "public"."approval_timeout_action" AS ENUM('REMIND', 'AUTO_PASS', 'AUTO_REJECT');--> statement-breakpoint
CREATE TYPE "public"."approver_role" AS ENUM('STORE_MANAGER', 'ADMIN', 'FINANCE', 'PURCHASING', 'DISPATCHER');--> statement-breakpoint
CREATE TYPE "public"."delegation_type" AS ENUM('GLOBAL', 'FLOW');--> statement-breakpoint
CREATE TABLE "approval_delegations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"delegator_id" uuid NOT NULL,
	"delegatee_id" uuid NOT NULL,
	"type" varchar(20) DEFAULT 'GLOBAL',
	"flow_id" uuid,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"reason" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" uuid
);
--> statement-breakpoint
DROP TYPE "public"."notification_channel";--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('IN_APP', 'EMAIL', 'SMS', 'WECHAT', 'WECHAT_MINI', 'LARK', 'SYSTEM');--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD COLUMN "approver_mode" varchar(20) DEFAULT 'ANY';--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD COLUMN "timeout_hours" integer;--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD COLUMN "timeout_action" varchar(20) DEFAULT 'REMIND';--> statement-breakpoint
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_delegator_id_users_id_fk" FOREIGN KEY ("delegator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_delegatee_id_users_id_fk" FOREIGN KEY ("delegatee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_flow_id_approval_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."approval_flows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_config" ADD CONSTRAINT "quote_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_approval_delegations_delegator" ON "approval_delegations" USING btree ("delegator_id");--> statement-breakpoint
CREATE INDEX "idx_approval_delegations_delegatee" ON "approval_delegations" USING btree ("delegatee_id");--> statement-breakpoint
CREATE INDEX "idx_approval_delegations_active" ON "approval_delegations" USING btree ("is_active");
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
ALTER TYPE "public"."order_status" ADD VALUE 'PAUSED' BEFORE 'PENDING_DELIVERY';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'PENDING_APPROVAL' BEFORE 'PENDING_DELIVERY';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paused_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pause_reason" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pause_cumulative_days" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD COLUMN "min_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD COLUMN "max_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD COLUMN "conditions" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD COLUMN "is_dynamic" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD COLUMN "parent_task_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_quotes_active_version" ON "quotes" USING btree ("root_quote_id") WHERE is_active = true;
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
ALTER TYPE "public"."product_category" ADD VALUE 'SERVICE';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "wechat_openid" varchar(100);--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "bundle_id" uuid;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_wechat_openid_unique" UNIQUE("wechat_openid");
CREATE TYPE "public"."inventory_log_type" AS ENUM('IN', 'OUT', 'ADJUST', 'TRANSFER');--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"min_stock" integer DEFAULT 0,
	"location" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"type" "inventory_log_type" NOT NULL,
	"quantity" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reason" text,
	"reference_type" text,
	"reference_id" uuid,
	"operator_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"manager_id" uuid,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "quote_items" DROP CONSTRAINT "quote_items_quote_id_quotes_id_fk";
--> statement-breakpoint
ALTER TABLE "quote_items" DROP CONSTRAINT "quote_items_room_id_quote_rooms_id_fk";
--> statement-breakpoint
ALTER TABLE "quote_rooms" DROP CONSTRAINT "quote_rooms_quote_id_quotes_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_schedules" DROP CONSTRAINT "payment_schedules_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "install_items" DROP CONSTRAINT "install_items_install_task_id_install_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "install_photos" DROP CONSTRAINT "install_photos_install_task_id_install_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "measure_items" DROP CONSTRAINT "measure_items_sheet_id_measure_sheets_id_fk";
--> statement-breakpoint
ALTER TABLE "measure_sheets" DROP CONSTRAINT "measure_sheets_task_id_measure_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "receipt_bill_items" DROP CONSTRAINT "receipt_bill_items_receipt_bill_id_receipt_bills_id_fk";
--> statement-breakpoint
ALTER TABLE "approval_nodes" DROP CONSTRAINT "approval_nodes_flow_id_approval_flows_id_fk";
--> statement-breakpoint
ALTER TABLE "approval_tasks" DROP CONSTRAINT "approval_tasks_approval_id_approvals_id_fk";
--> statement-breakpoint
ALTER TABLE "market_channels" ALTER COLUMN "level" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "market_channels" ALTER COLUMN "level" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "market_channels" ALTER COLUMN "sort_order" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "ap_labor_fee_details" ALTER COLUMN "install_task_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ap_labor_fee_details" ALTER COLUMN "install_task_no" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notification_settings" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "ap_labor_fee_details" ADD COLUMN "liability_notice_id" uuid;--> statement-breakpoint
ALTER TABLE "ap_labor_fee_details" ADD COLUMN "liability_notice_no" varchar(50);--> statement-breakpoint
ALTER TABLE "ar_statements" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "liability_notices" ADD COLUMN "finance_status" varchar(20) DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "liability_notices" ADD COLUMN "finance_statement_id" uuid;--> statement-breakpoint
ALTER TABLE "liability_notices" ADD COLUMN "finance_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_inventory_tenant" ON "inventory" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_warehouse" ON "inventory" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_product" ON "inventory" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_logs_tenant" ON "inventory_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_logs_warehouse" ON "inventory_logs" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_logs_created" ON "inventory_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_warehouses_tenant" ON "warehouses" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_room_id_quote_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."quote_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_plan_items" ADD CONSTRAINT "quote_plan_items_template_id_product_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."product_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_rooms" ADD CONSTRAINT "quote_rooms_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_items" ADD CONSTRAINT "install_items_install_task_id_install_tasks_id_fk" FOREIGN KEY ("install_task_id") REFERENCES "public"."install_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_photos" ADD CONSTRAINT "install_photos_install_task_id_install_tasks_id_fk" FOREIGN KEY ("install_task_id") REFERENCES "public"."install_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_after_sales_id_after_sales_tickets_id_fk" FOREIGN KEY ("after_sales_id") REFERENCES "public"."after_sales_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_items" ADD CONSTRAINT "measure_items_sheet_id_measure_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."measure_sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_sheets" ADD CONSTRAINT "measure_sheets_task_id_measure_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."measure_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD CONSTRAINT "measure_tasks_parent_id_measure_tasks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."measure_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD CONSTRAINT "measure_tasks_fee_approval_id_approvals_id_fk" FOREIGN KEY ("fee_approval_id") REFERENCES "public"."approvals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_bill_items" ADD CONSTRAINT "receipt_bill_items_receipt_bill_id_receipt_bills_id_fk" FOREIGN KEY ("receipt_bill_id") REFERENCES "public"."receipt_bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD CONSTRAINT "approval_nodes_flow_id_approval_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."approval_flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_parent_task_id_approval_tasks_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "public"."approval_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_approval_id_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."approvals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_current_node_id_approval_nodes_id_fk" FOREIGN KEY ("current_node_id") REFERENCES "public"."approval_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_lead_history_tenant" ON "lead_status_history" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ap_labor_fee_details_liability" ON "ap_labor_fee_details" USING btree ("liability_notice_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_tenant" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_table" ON "audit_logs" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created" ON "audit_logs" USING btree ("created_at");
ALTER TABLE "channel_contacts" DROP CONSTRAINT "channel_contacts_channel_id_channels_id_fk";
--> statement-breakpoint
ALTER TABLE "purchase_order_items" DROP CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "channel_contacts" ADD CONSTRAINT "channel_contacts_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_order_changes_order" ON "order_changes" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_changes_status" ON "order_changes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_sales" ON "orders" USING btree ("sales_id");--> statement-breakpoint
CREATE INDEX "idx_po_supplier" ON "purchase_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_po_status" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_as_status" ON "after_sales_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_as_assigned_to" ON "after_sales_tickets" USING btree ("assigned_to");
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
-- 租户管理与平台管理员迁移脚本
-- 日期: 2026-01-23
-- 功能: 添加租户状态、申请信息、地区、审批信息字段，以及平台管理员标识

-- 1. 创建租户状态枚举类型
DO $$ BEGIN
    CREATE TYPE tenant_status AS ENUM (
        'pending_approval',  -- 待审批
        'active',            -- 已激活
        'rejected',          -- 已拒绝
        'suspended'          -- 已暂停
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. 扩展 tenants 表
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS status tenant_status DEFAULT 'active' NOT NULL,
    ADD COLUMN IF NOT EXISTS applicant_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS applicant_phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS applicant_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS region VARCHAR(100),
    ADD COLUMN IF NOT EXISTS business_description TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reject_reason TEXT;

-- 3. 扩展 users 表，添加平台管理员标识
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;

-- 4. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_users_platform_admin ON users(is_platform_admin) WHERE is_platform_admin = true;

-- 5. 更新现有租户状态为 active（如果尚未设置）
UPDATE tenants SET status = 'active' WHERE status IS NULL;
-- Add DISPATCHER to user_role enum

ALTER TYPE "user_role" ADD VALUE 'DISPATCHER';
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
ALTER TABLE "users" ADD COLUMN "roles" jsonb DEFAULT '[]' NOT NULL;

-- Data Migration: Copy existing single role to roles array
UPDATE "users" SET "roles" = jsonb_build_array("role") WHERE "role" IS NOT NULL;
-- 企业认证功能迁移
-- 添加认证状态枚举和相关字段

-- 创建认证状态枚举
DO $$ BEGIN
    CREATE TYPE "public"."verification_status" AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 添加认证相关字段到 tenants 表
ALTER TABLE "tenants"
ADD COLUMN IF NOT EXISTS "verification_status" "verification_status" DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS "business_license_url" text,
ADD COLUMN IF NOT EXISTS "legal_rep_name" varchar(50),
ADD COLUMN IF NOT EXISTS "registered_capital" varchar(50),
ADD COLUMN IF NOT EXISTS "business_scope" text,
ADD COLUMN IF NOT EXISTS "verified_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "verified_by" uuid,
ADD COLUMN IF NOT EXISTS "verification_reject_reason" text;
