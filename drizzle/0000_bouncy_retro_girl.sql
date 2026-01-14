CREATE TYPE "public"."ap_source_type" AS ENUM('PURCHASE_ORDER', 'PROCESSING_ORDER', 'INSTALL_TASK', 'MEASURE_TASK', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."ap_status" AS ENUM('PENDING_RECON', 'PENDING_INVOICE', 'PENDING_PAYMENT', 'PARTIAL', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."ap_type" AS ENUM('SUPPLIER', 'PROCESSOR', 'WORKER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."ar_status" AS ENUM('PREPAID', 'PARTIAL', 'PENDING_RECON', 'PENDING_INVOICE', 'PENDING_PAYMENT', 'COMPLETED', 'BAD_DEBT', 'VOID');--> statement-breakpoint
CREATE TYPE "public"."attachment_type" AS ENUM('MATCHING_TIEBACK', 'READY_TIEBACK', 'PILLOW', 'LACE', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."curtain_install_method" AS ENUM('TOP', 'SIDE', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."curtain_install_position" AS ENUM('CURTAIN_BOX', 'INSIDE', 'OUTSIDE', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."curtain_opening_style" AS ENUM('DOUBLE', 'LEFT_SINGLE', 'RIGHT_SINGLE', 'MULTI');--> statement-breakpoint
CREATE TYPE "public"."curtain_sub_category" AS ENUM('FABRIC', 'TRACK', 'FUNCTIONAL', 'ACCESSORY');--> statement-breakpoint
CREATE TYPE "public"."customer_level" AS ENUM('A', 'B', 'C', 'D');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('INDIVIDUAL', 'DESIGNER', 'PARTNER', 'COMPANY');--> statement-breakpoint
CREATE TYPE "public"."fabric_direction" AS ENUM('HEIGHT', 'WIDTH');--> statement-breakpoint
CREATE TYPE "public"."header_process_type" AS ENUM('WRAPPED', 'ATTACHED');--> statement-breakpoint
CREATE TYPE "public"."install_photo_type" AS ENUM('BEFORE', 'AFTER', 'DETAIL');--> statement-breakpoint
CREATE TYPE "public"."install_status" AS ENUM('PENDING_DISPATCH', 'DISPATCHING', 'PENDING_VISIT', 'PENDING_CONFIRM', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."install_type" AS ENUM('TOP', 'SIDE');--> statement-breakpoint
CREATE TYPE "public"."intention_level" AS ENUM('HIGH', 'MEDIUM', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."inventory_log_type" AS ENUM('IN', 'OUT', 'ADJUST', 'RESERVE', 'RELEASE');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('PENDING_DISPATCH', 'PENDING_FOLLOWUP', 'FOLLOWING', 'WON', 'VOID');--> statement-breakpoint
CREATE TYPE "public"."measure_status" AS ENUM('PENDING_APPROVAL', 'REJECTED', 'PENDING', 'DISPATCHING', 'PENDING_VISIT', 'PENDING_CONFIRM', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('IN_APP', 'SMS', 'LARK', 'WECHAT', 'EMAIL');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('SYSTEM', 'ORDER_STATUS', 'APPROVAL', 'MENTION', 'ALERT');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING_APPROVAL', 'PENDING_PO', 'IN_PRODUCTION', 'PENDING_DELIVERY', 'DISPATCHING', 'SHIPPED', 'PENDING_INSTALL', 'COMPLETED', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'WECHAT', 'ALIPAY', 'BANK_TRANSFER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."payment_schedule_status" AS ENUM('PENDING', 'PAID', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."po_payment_status" AS ENUM('PENDING', 'PARTIAL', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."po_quote_status" AS ENUM('PENDING_QUOTE', 'QUOTED', 'PENDING_APPROVAL', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."po_status" AS ENUM('DRAFT', 'ORDERED', 'SHIPPED', 'RECEIVED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."po_type" AS ENUM('EXTERNAL', 'INTERNAL');--> statement-breakpoint
CREATE TYPE "public"."processing_order_status" AS ENUM('PENDING_MATERIAL', 'MATERIAL_SHIPPED', 'MATERIAL_RECEIVED', 'IN_PROCESSING', 'PROCESSING_DONE', 'SHIPPED', 'RECEIVED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('CURTAIN_FABRIC', 'CURTAIN_SHEER', 'CURTAIN_TRACK', 'CURTAIN_ACCESSORY', 'WALLCLOTH', 'WALLPAPER', 'WALLPANEL', 'WINDOWPAD', 'STANDARD', 'MOTOR');--> statement-breakpoint
CREATE TYPE "public"."production_trigger" AS ENUM('DEPOSIT_REQUIRED', 'FULL_PAYMENT', 'NONE');--> statement-breakpoint
CREATE TYPE "public"."quote_bundle_status" AS ENUM('DRAFT', 'ACTIVE', 'LOCKED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."quote_category" AS ENUM('CURTAIN', 'WALLPAPER', 'WALL_PANEL', 'BAY_CUSHION', 'MATTRESS', 'STANDARD', 'OTHER', 'WALLCLOTH');--> statement-breakpoint
CREATE TYPE "public"."quote_plan_type" AS ENUM('ECONOMIC', 'COMFORT', 'LUXURY');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('DRAFT', 'ACTIVE', 'LOCKED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."receipt_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."receipt_type" AS ENUM('DEPOSIT', 'PREPAYMENT', 'FINAL_PAYMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_status" AS ENUM('DRAFT', 'SENT', 'CONFIRMED', 'DISPUTED');--> statement-breakpoint
CREATE TYPE "public"."reminder_module" AS ENUM('LEAD', 'ORDER', 'MEASURE', 'INSTALL', 'AR', 'AP');--> statement-breakpoint
CREATE TYPE "public"."room_type" AS ENUM('LIVING_ROOM', 'MASTER_BEDROOM', 'SECOND_BEDROOM', 'STUDY', 'DINING_ROOM', 'BALCONY', 'KITCHEN', 'BATHROOM', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."settlement_type" AS ENUM('CASH', 'MONTHLY');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('PENDING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED');--> statement-breakpoint
CREATE TYPE "public"."shipment_type" AS ENUM('MATERIAL_TO_PROCESSOR', 'MATERIAL_TO_WAREHOUSE', 'MATERIAL_TO_STORE', 'PRODUCT_TO_CUSTOMER', 'PRODUCT_TO_WAREHOUSE', 'PRODUCT_TO_INSTALLER');--> statement-breakpoint
CREATE TYPE "public"."supplier_type" AS ENUM('MATERIAL', 'PROCESSOR', 'BOTH');--> statement-breakpoint
CREATE TYPE "public"."task_payment_status" AS ENUM('PENDING', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."track_layer" AS ENUM('SINGLE', 'DOUBLE');--> statement-breakpoint
CREATE TYPE "public"."wall_material" AS ENUM('CONCRETE', 'WOOD', 'GYPSUM', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."window_type" AS ENUM('STRAIGHT', 'L_SHAPE', 'U_SHAPE', 'ARC', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."approval_action" AS ENUM('APPROVE', 'REJECT', 'AUTO_APPROVE', 'AUTO_REJECT');--> statement-breakpoint
CREATE TYPE "public"."approval_timeout_action" AS ENUM('REMIND', 'AUTO_APPROVE', 'AUTO_REJECT');--> statement-breakpoint
CREATE TYPE "public"."after_sales_status" AS ENUM('PENDING', 'PROCESSING', 'PENDING_VISIT', 'PENDING_CALLBACK', 'CLOSED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."after_sales_type" AS ENUM('REPAIR', 'CLEAN', 'REPLACE', 'COMPLAINT', 'CONSULT');--> statement-breakpoint
CREATE TYPE "public"."cost_closure_type" AS ENUM('SALES_EXPENSE', 'LIABILITY');--> statement-breakpoint
CREATE TYPE "public"."liability_party_type" AS ENUM('COMPANY', 'SUPPLIER', 'INSTALLER', 'MEASURER', 'CUSTOMER');--> statement-breakpoint
CREATE TYPE "public"."liability_status" AS ENUM('DRAFT', 'PENDING_CONFIRM', 'CONFIRMED', 'DISPUTED', 'ARBITRATED');--> statement-breakpoint
CREATE TYPE "public"."resolution_status" AS ENUM('PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."resolution_type" AS ENUM('EXCHANGE', 'REPAIR', 'GIFT', 'REFUND', 'PARTIAL_RETURN', 'FULL_RETURN', 'OTHER');--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"channels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reminder_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"module" "reminder_module" NOT NULL,
	"rule_name" varchar(100) NOT NULL,
	"trigger_condition" jsonb NOT NULL,
	"channels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recipients" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"permissions" text[] DEFAULT '{}',
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
CREATE TABLE "system_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"module" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"entity_id" uuid,
	"operator_id" uuid NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
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
	"email" varchar(255),
	"phone" varchar(20) NOT NULL,
	"password_hash" text,
	"name" varchar(50) NOT NULL,
	"avatar_url" text,
	"role" varchar(50),
	"is_active" boolean DEFAULT true,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"address_geo" jsonb,
	"worker_rating" numeric(3, 2),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
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
	"default_fold_ratio" numeric(3, 1),
	"tags" text[] DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"category" "product_category" NOT NULL,
	"unit" varchar(20) NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"cost_price" numeric(10, 2),
	"default_supplier_id" uuid,
	"is_stockable" boolean DEFAULT false,
	"stock_quantity" numeric(10, 2) DEFAULT '0',
	"safety_stock" numeric(10, 2),
	"images" jsonb DEFAULT '[]'::jsonb,
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"fabric_direction" "fabric_direction" DEFAULT 'HEIGHT',
	"fabric_size" numeric(10, 2),
	"header_process_type" "header_process_type",
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_no" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"contact_name" varchar(50),
	"contact_phone" varchar(20),
	"contact_email" varchar(100),
	"address" text,
	"settlement_type" varchar(20) DEFAULT 'MONTHLY',
	"bank_account" jsonb,
	"type" "supplier_type" DEFAULT 'MATERIAL',
	"default_processing_fee_per_meter" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "suppliers_supplier_no_unique" UNIQUE("supplier_no")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_no" varchar(50) NOT NULL,
	"name" varchar(50) NOT NULL,
	"type" "customer_type" DEFAULT 'INDIVIDUAL' NOT NULL,
	"phone" varchar(20) NOT NULL,
	"phone_secondary" varchar(20),
	"wechat" varchar(50),
	"gender" varchar(10),
	"birthday" timestamp,
	"source_lead_id" uuid,
	"referrer_customer_id" uuid,
	"default_address" text,
	"addresses" jsonb DEFAULT '[]'::jsonb,
	"tags" text[] DEFAULT '{}',
	"level" "customer_level" DEFAULT 'D',
	"credit_limit" numeric(12, 2) DEFAULT '0',
	"settlement_type" "settlement_type" DEFAULT 'CASH',
	"total_orders" integer DEFAULT 0,
	"total_amount" numeric(12, 2) DEFAULT '0',
	"avg_order_amount" numeric(12, 2) DEFAULT '0',
	"first_order_at" timestamp with time zone,
	"last_order_at" timestamp with time zone,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"is_merged" boolean DEFAULT false,
	"merged_from" uuid[],
	"assigned_sales_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "customers_customer_no_unique" UNIQUE("customer_no")
);
--> statement-breakpoint
CREATE TABLE "lead_followup_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"result" varchar(50),
	"next_followup_at" timestamp with time zone,
	"next_followup_note" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_no" varchar(50) NOT NULL,
	"source_category_id" uuid,
	"source_sub_id" uuid,
	"source_detail" varchar(200),
	"customer_name" varchar(50) NOT NULL,
	"customer_phone" varchar(20) NOT NULL,
	"customer_wechat" varchar(50),
	"community" varchar(100),
	"address" text,
	"house_type" varchar(50),
	"intention_level" "intention_level",
	"estimated_amount" numeric(12, 2),
	"status" "lead_status" DEFAULT 'PENDING_DISPATCH',
	"assigned_sales_id" uuid,
	"assigned_at" timestamp with time zone,
	"tags" text[] DEFAULT '{}',
	"remark" text,
	"referrer_customer_id" uuid,
	"customer_id" uuid,
	"quoted_at" timestamp with time zone,
	"visited_store_at" timestamp with time zone,
	"won_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"last_activity_at" timestamp with time zone DEFAULT now(),
	"lost_reason" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "leads_lead_no_unique" UNIQUE("lead_no")
);
--> statement-breakpoint
CREATE TABLE "market_channel_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"code" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "market_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"code" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"bundle_no" varchar(50) NOT NULL,
	"lead_id" uuid,
	"customer_id" uuid NOT NULL,
	"status" "quote_bundle_status" DEFAULT 'DRAFT',
	"summary_mode" varchar(20) DEFAULT 'BY_CATEGORY',
	"total_amount" numeric(12, 2) DEFAULT '0',
	"discount_amount" numeric(12, 2) DEFAULT '0',
	"final_amount" numeric(12, 2) DEFAULT '0',
	"installation_fee" numeric(10, 2) DEFAULT '0',
	"measurement_fee" numeric(10, 2) DEFAULT '0',
	"freight_fee" numeric(10, 2) DEFAULT '0',
	"valid_until" timestamp with time zone,
	"remark" text,
	"attachment_urls" jsonb DEFAULT '[]'::jsonb,
	"purchase_confirmation_img" text,
	"created_by" uuid NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"locked_at" timestamp with time zone,
	CONSTRAINT "quote_bundles_bundle_no_unique" UNIQUE("bundle_no")
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"room_id" uuid,
	"product_id" uuid,
	"product_name" varchar(200) NOT NULL,
	"sku" varchar(100),
	"category" "product_category",
	"width" numeric(10, 2),
	"height" numeric(10, 2),
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit" varchar(20),
	"fold_ratio" numeric(3, 1),
	"fabric_width" numeric(10, 2),
	"process_fee" numeric(10, 2) DEFAULT '0',
	"material_usage" numeric(10, 2),
	"version_tag" varchar(20),
	"is_active_version" boolean DEFAULT true,
	"room_type" "room_type",
	"room_custom_name" varchar(50),
	"install_method" "curtain_install_method" DEFAULT 'TOP',
	"install_method_custom" varchar(50),
	"install_position" "curtain_install_position" DEFAULT 'CURTAIN_BOX',
	"install_position_custom" varchar(50),
	"ground_clearance" numeric(10, 2),
	"opening_style" "curtain_opening_style" DEFAULT 'DOUBLE',
	"opening_details" jsonb,
	"sub_category" "curtain_sub_category",
	"track_layer" "track_layer",
	"track_length" numeric(10, 2),
	"product_params" jsonb,
	"parent_item_id" uuid,
	"is_accessory" boolean DEFAULT false,
	"attachment_type" "attachment_type",
	"pillow_size" varchar(20),
	"inherit_parent_price" boolean DEFAULT false,
	"row_subtotal" numeric(12, 2),
	"fabric_direction" "fabric_direction",
	"fabric_size" numeric(10, 2),
	"header_process_type" "header_process_type",
	"finished_width" numeric(10, 2),
	"finished_height" numeric(10, 2),
	"cut_width" numeric(10, 2),
	"cut_height" numeric(10, 2),
	"panel_count" integer,
	"unit_price" numeric(10, 2) NOT NULL,
	"market_price" numeric(10, 2),
	"subtotal" numeric(12, 2) NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"remark" text,
	"sort_order" integer DEFAULT 0
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
	"code" "quote_plan_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"quote_no" varchar(50) NOT NULL,
	"bundle_id" uuid,
	"category" "quote_category",
	"version" integer DEFAULT 1 NOT NULL,
	"sub_version" integer DEFAULT 0 NOT NULL,
	"is_latest" boolean DEFAULT true,
	"lead_id" uuid,
	"customer_id" uuid NOT NULL,
	"status" "quote_status" DEFAULT 'DRAFT',
	"total_amount" numeric(12, 2) DEFAULT '0',
	"discount_amount" numeric(12, 2) DEFAULT '0',
	"final_amount" numeric(12, 2) DEFAULT '0',
	"valid_until" timestamp with time zone,
	"installation_fee" numeric(10, 2) DEFAULT '0',
	"measurement_fee" numeric(10, 2) DEFAULT '0',
	"freight_fee" numeric(10, 2) DEFAULT '0',
	"remark" text,
	"attachment_urls" jsonb DEFAULT '[]'::jsonb,
	"created_by" uuid NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"locked_at" timestamp with time zone,
	CONSTRAINT "quotes_quote_no_unique" UNIQUE("quote_no")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"measure_room_id" uuid,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_no" varchar(50) NOT NULL,
	"quote_id" uuid NOT NULL,
	"lead_id" uuid,
	"customer_id" uuid NOT NULL,
	"customer_name" varchar(50) NOT NULL,
	"customer_phone" varchar(20) NOT NULL,
	"delivery_address" text NOT NULL,
	"status" "order_status" DEFAULT 'PENDING_PO',
	"total_amount" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0',
	"confirmation_img" text,
	"sales_id" uuid NOT NULL,
	"source_type" varchar(30) DEFAULT 'NORMAL',
	"source_after_sales_id" uuid,
	"linked_order_id" uuid,
	"quote_bundle_id" uuid,
	"linked_receipt_id" uuid,
	"settlement_type" "settlement_type",
	"production_trigger" "production_trigger" DEFAULT 'DEPOSIT_REQUIRED',
	"deposit_ratio" numeric(5, 2),
	"approval_status" "approval_status",
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
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
CREATE TABLE "inventory_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(100),
	"po_item_id" uuid,
	"quantity" numeric(10, 2) NOT NULL,
	"remaining_quantity" numeric(10, 2) NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"inbound_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"type" "inventory_log_type" NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"remark" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"quote_item_id" uuid,
	"order_id" uuid,
	"quantity" numeric(10, 2) NOT NULL,
	"cost" numeric(12, 2) NOT NULL,
	"remark" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_id" uuid NOT NULL,
	"quote_item_id" uuid,
	"product_id" uuid NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"sku" varchar(100),
	"category" "product_category",
	"unit_cost" numeric(10, 2) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"width" numeric(10, 2),
	"height" numeric(10, 2),
	"remark" text
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"po_no" varchar(50) NOT NULL,
	"order_id" uuid NOT NULL,
	"supplier_id" uuid,
	"supplier_name" varchar(100) NOT NULL,
	"type" "po_type" NOT NULL,
	"status" "po_status" DEFAULT 'DRAFT' NOT NULL,
	"payment_status" "po_payment_status" DEFAULT 'PENDING',
	"total_cost" numeric(12, 2) NOT NULL,
	"quoted_total_cost" numeric(12, 2),
	"quote_status" "po_quote_status" DEFAULT 'PENDING_QUOTE',
	"variance_reason" text,
	"external_po_no" varchar(100),
	"supplier_quote_img" text,
	"logistics_company" varchar(50),
	"logistics_no" varchar(50),
	"sent_at" timestamp with time zone,
	"produced_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"remark" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "purchase_orders_po_no_unique" UNIQUE("po_no")
);
--> statement-breakpoint
CREATE TABLE "logistics_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reference_type" varchar(20) NOT NULL,
	"reference_id" uuid NOT NULL,
	"shipment_type" "shipment_type" NOT NULL,
	"logistics_company" varchar(50),
	"tracking_no" varchar(100),
	"from_address" text,
	"to_address" text,
	"installer_id" uuid,
	"installer_name" varchar(50),
	"shipped_at" timestamp with time zone,
	"estimated_arrival" timestamp with time zone,
	"actual_arrival" timestamp with time zone,
	"status" "shipment_status" DEFAULT 'PENDING' NOT NULL,
	"tracking_data" jsonb,
	"remark" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "processing_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processing_order_id" uuid NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"sku" varchar(100),
	"length" numeric(10, 2),
	"width" numeric(10, 2),
	"height" numeric(10, 2),
	"quantity" numeric(10, 2) NOT NULL,
	"unit_fee" numeric(10, 2),
	"subtotal" numeric(12, 2),
	"remark" text
);
--> statement-breakpoint
CREATE TABLE "processing_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"po_no" varchar(50) NOT NULL,
	"order_id" uuid NOT NULL,
	"material_po_id" uuid,
	"processor_id" uuid NOT NULL,
	"processor_name" varchar(100) NOT NULL,
	"status" "processing_order_status" DEFAULT 'PENDING_MATERIAL' NOT NULL,
	"estimated_length" numeric(10, 2),
	"unit_processing_fee" numeric(10, 2),
	"estimated_fee" numeric(12, 2),
	"actual_length" numeric(10, 2),
	"actual_fee" numeric(12, 2),
	"fee_variance_reason" text,
	"material_received_at" timestamp with time zone,
	"processing_started_at" timestamp with time zone,
	"processing_completed_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"remark" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "processing_orders_po_no_unique" UNIQUE("po_no")
);
--> statement-breakpoint
CREATE TABLE "install_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"install_task_id" uuid NOT NULL,
	"order_item_id" uuid,
	"product_name" varchar(200),
	"room_name" varchar(100),
	"quantity" numeric(10, 2),
	"is_installed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "install_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"install_task_id" uuid NOT NULL,
	"install_item_id" uuid,
	"type" "install_photo_type" NOT NULL,
	"url" text NOT NULL,
	"room_name" varchar(100),
	"description" text,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "install_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"task_no" varchar(50) NOT NULL,
	"order_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"category" "product_category",
	"required_skills" jsonb DEFAULT '[]'::jsonb,
	"batch_no" varchar(50),
	"status" "install_status" DEFAULT 'PENDING_DISPATCH',
	"payment_status" "task_payment_status" DEFAULT 'PENDING',
	"sales_id" uuid,
	"dispatcher_id" uuid,
	"scheduled_at" timestamp with time zone,
	"scheduled_date" varchar(20),
	"assigned_worker_id" uuid,
	"reject_count" integer DEFAULT 0,
	"check_in_location" jsonb,
	"check_in_at" timestamp with time zone,
	"labor_fee" numeric(10, 2),
	"actual_labor_fee" numeric(10, 2),
	"is_late" boolean DEFAULT false,
	"remark" text,
	"rating" integer,
	"rating_comment" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	CONSTRAINT "install_tasks_task_no_unique" UNIQUE("task_no")
);
--> statement-breakpoint
CREATE TABLE "measure_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"measure_no" varchar(50) NOT NULL,
	"lead_id" uuid,
	"customer_id" uuid NOT NULL,
	"quote_id" uuid,
	"sales_id" uuid,
	"assigned_worker_id" uuid,
	"dispatcher_id" uuid,
	"status" "measure_status" DEFAULT 'PENDING',
	"payment_status" "task_payment_status" DEFAULT 'PENDING',
	"required_skills" jsonb DEFAULT '[]'::jsonb,
	"batch_no" varchar(50),
	"category" "product_category",
	"scheduled_at" timestamp with time zone,
	"address" text,
	"round" integer DEFAULT 1,
	"variant" varchar(10) DEFAULT 'A',
	"version_display" varchar(20),
	"parent_id" uuid,
	"is_active" boolean DEFAULT true,
	"reject_count" integer DEFAULT 0,
	"check_in_location" jsonb,
	"check_in_at" timestamp with time zone,
	"is_late" boolean DEFAULT false,
	"measure_data" jsonb,
	"result_data" jsonb,
	"images" jsonb DEFAULT '[]'::jsonb,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"remark" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	CONSTRAINT "measure_tasks_measure_no_unique" UNIQUE("measure_no")
);
--> statement-breakpoint
CREATE TABLE "ap_statement_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"statement_id" uuid NOT NULL,
	"source_type" "ap_source_type" NOT NULL,
	"source_id" uuid NOT NULL,
	"source_no" varchar(50),
	"amount" numeric(12, 2) NOT NULL,
	"is_deduction" boolean DEFAULT false,
	"deduction_reason" text,
	"remark" text
);
--> statement-breakpoint
CREATE TABLE "ap_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"statement_no" varchar(50) NOT NULL,
	"type" "ap_type" NOT NULL,
	"status" "ap_status" DEFAULT 'PENDING_RECON',
	"supplier_id" uuid,
	"worker_id" uuid,
	"target_name" varchar(100),
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"deduction_amount" numeric(12, 2) DEFAULT '0',
	"actual_amount" numeric(12, 2) NOT NULL,
	"invoice_no" varchar(100),
	"invoice_url" text,
	"paid_at" timestamp with time zone,
	"payment_proof_url" text,
	"remark" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ap_statements_statement_no_unique" UNIQUE("statement_no")
);
--> statement-breakpoint
CREATE TABLE "ar_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"statement_no" varchar(50) NOT NULL,
	"order_id" uuid,
	"customer_id" uuid NOT NULL,
	"sales_id" uuid,
	"reconciliation_id" uuid,
	"status" "ar_status" DEFAULT 'PENDING_PAYMENT',
	"total_amount" numeric(12, 2) DEFAULT '0',
	"paid_amount" numeric(12, 2) DEFAULT '0',
	"remark" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ar_statements_statement_no_unique" UNIQUE("statement_no")
);
--> statement-breakpoint
CREATE TABLE "payment_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"statement_id" uuid,
	"stage_name" varchar(50) NOT NULL,
	"ratio" numeric(5, 2),
	"amount" numeric(12, 2) NOT NULL,
	"due_date" timestamp with time zone,
	"status" "payment_schedule_status" DEFAULT 'PENDING',
	"paid_at" timestamp with time zone,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"receipt_no" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"quote_bundle_id" uuid,
	"order_id" uuid,
	"type" "receipt_type" NOT NULL,
	"status" "receipt_status" DEFAULT 'PENDING',
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" "payment_method",
	"payment_proof" text,
	"statement_id" uuid,
	"schedule_id" uuid,
	"reconciliation_id" uuid,
	"remark" text,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"recorded_by" uuid,
	"confirmed_by" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "receipts_receipt_no_unique" UNIQUE("receipt_no")
);
--> statement-breakpoint
CREATE TABLE "reconciliation_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"statement_no" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"sales_id" uuid,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"previous_balance" numeric(12, 2) DEFAULT '0',
	"current_amount" numeric(12, 2) DEFAULT '0',
	"current_received" numeric(12, 2) DEFAULT '0',
	"ending_balance" numeric(12, 2) DEFAULT '0',
	"status" "reconciliation_status" DEFAULT 'DRAFT',
	"confirmed_at" timestamp with time zone,
	"confirmed_by" uuid,
	"attachment_urls" jsonb DEFAULT '[]'::jsonb,
	"remark" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reconciliation_statements_statement_no_unique" UNIQUE("statement_no")
);
--> statement-breakpoint
CREATE TABLE "approval_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"module" varchar(50) NOT NULL,
	"trigger_action" varchar(50) NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"timeout_hours" integer DEFAULT 24,
	"timeout_action" "approval_timeout_action" DEFAULT 'REMIND',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approval_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"flow_id" uuid,
	"module" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"status" "approval_status" DEFAULT 'PENDING',
	"current_step" integer DEFAULT 1,
	"applicant_id" uuid,
	"applied_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"deadline_at" timestamp with time zone,
	"reminded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "approval_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"step_order" integer NOT NULL,
	"approver_id" uuid,
	"action" "approval_action" NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "after_sales_resolutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"after_sales_id" uuid NOT NULL,
	"type" "resolution_type" NOT NULL,
	"status" "resolution_status" DEFAULT 'PENDING_APPROVAL',
	"description" text,
	"requires_visit" boolean DEFAULT false,
	"requires_production" boolean DEFAULT false,
	"estimated_cost" numeric(12, 2) DEFAULT '0',
	"actual_cost" numeric(12, 2) DEFAULT '0',
	"new_order_id" uuid,
	"return_items" jsonb DEFAULT '[]'::jsonb,
	"needs_approval" boolean DEFAULT false,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"cost_closure_type" "cost_closure_type",
	"cost_closure_ref_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "after_sales_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_no" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid,
	"type" "after_sales_type" NOT NULL,
	"priority" varchar(20) DEFAULT 'NORMAL',
	"status" "after_sales_status" DEFAULT 'PENDING',
	"description" text NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"assigned_to" uuid,
	"solution" text,
	"is_warranty" boolean DEFAULT true,
	"satisfaction" integer,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"closed_at" timestamp with time zone,
	CONSTRAINT "after_sales_tickets_ticket_no_unique" UNIQUE("ticket_no")
);
--> statement-breakpoint
CREATE TABLE "liability_notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"notice_no" varchar(50) NOT NULL,
	"after_sales_id" uuid NOT NULL,
	"liable_party_type" "liability_party_type" NOT NULL,
	"liable_party_id" uuid,
	"cost_amount" numeric(12, 2) NOT NULL,
	"reason" text,
	"evidence_photos" jsonb DEFAULT '[]'::jsonb,
	"status" "liability_status" DEFAULT 'DRAFT',
	"confirmed_at" timestamp with time zone,
	"confirmed_by" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "liability_notices_notice_no_unique" UNIQUE("notice_no")
);
--> statement-breakpoint
CREATE TABLE "resolution_progress_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resolution_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"remark" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_rules" ADD CONSTRAINT "reminder_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sys_dictionaries" ADD CONSTRAINT "sys_dictionaries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_default_supplier_id_suppliers_id_fk" FOREIGN KEY ("default_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_assigned_sales_id_users_id_fk" FOREIGN KEY ("assigned_sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_followup_logs" ADD CONSTRAINT "lead_followup_logs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_followup_logs" ADD CONSTRAINT "lead_followup_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_sales_id_users_id_fk" FOREIGN KEY ("assigned_sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_referrer_customer_id_customers_id_fk" FOREIGN KEY ("referrer_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_channel_categories" ADD CONSTRAINT "market_channel_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_channels" ADD CONSTRAINT "market_channels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_channels" ADD CONSTRAINT "market_channels_category_id_market_channel_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."market_channel_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_bundles" ADD CONSTRAINT "quote_bundles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_bundles" ADD CONSTRAINT "quote_bundles_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_bundles" ADD CONSTRAINT "quote_bundles_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_bundles" ADD CONSTRAINT "quote_bundles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_bundles" ADD CONSTRAINT "quote_bundles_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_plan_items" ADD CONSTRAINT "quote_plan_items_plan_id_quote_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."quote_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_plan_items" ADD CONSTRAINT "quote_plan_items_template_id_product_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."product_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_plans" ADD CONSTRAINT "quote_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_bundle_id_quote_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."quote_bundles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_sales_id_users_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_po_item_id_purchase_order_items_id_fk" FOREIGN KEY ("po_item_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_usage_logs" ADD CONSTRAINT "inventory_usage_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_usage_logs" ADD CONSTRAINT "inventory_usage_logs_batch_id_inventory_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_usage_logs" ADD CONSTRAINT "inventory_usage_logs_quote_item_id_quote_items_id_fk" FOREIGN KEY ("quote_item_id") REFERENCES "public"."quote_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_usage_logs" ADD CONSTRAINT "inventory_usage_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_usage_logs" ADD CONSTRAINT "inventory_usage_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_quote_item_id_quote_items_id_fk" FOREIGN KEY ("quote_item_id") REFERENCES "public"."quote_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_shipments" ADD CONSTRAINT "logistics_shipments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_shipments" ADD CONSTRAINT "logistics_shipments_installer_id_users_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_shipments" ADD CONSTRAINT "logistics_shipments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_order_items" ADD CONSTRAINT "processing_order_items_processing_order_id_processing_orders_id_fk" FOREIGN KEY ("processing_order_id") REFERENCES "public"."processing_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_orders" ADD CONSTRAINT "processing_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_orders" ADD CONSTRAINT "processing_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_orders" ADD CONSTRAINT "processing_orders_material_po_id_purchase_orders_id_fk" FOREIGN KEY ("material_po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_orders" ADD CONSTRAINT "processing_orders_processor_id_suppliers_id_fk" FOREIGN KEY ("processor_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_orders" ADD CONSTRAINT "processing_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_items" ADD CONSTRAINT "install_items_install_task_id_install_tasks_id_fk" FOREIGN KEY ("install_task_id") REFERENCES "public"."install_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_items" ADD CONSTRAINT "install_items_order_item_id_quote_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."quote_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_photos" ADD CONSTRAINT "install_photos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_photos" ADD CONSTRAINT "install_photos_install_task_id_install_tasks_id_fk" FOREIGN KEY ("install_task_id") REFERENCES "public"."install_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_photos" ADD CONSTRAINT "install_photos_install_item_id_install_items_id_fk" FOREIGN KEY ("install_item_id") REFERENCES "public"."install_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_photos" ADD CONSTRAINT "install_photos_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_sales_id_users_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_dispatcher_id_users_id_fk" FOREIGN KEY ("dispatcher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_assigned_worker_id_users_id_fk" FOREIGN KEY ("assigned_worker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD CONSTRAINT "measure_tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD CONSTRAINT "measure_tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD CONSTRAINT "measure_tasks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD CONSTRAINT "measure_tasks_sales_id_users_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD CONSTRAINT "measure_tasks_assigned_worker_id_users_id_fk" FOREIGN KEY ("assigned_worker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD CONSTRAINT "measure_tasks_dispatcher_id_users_id_fk" FOREIGN KEY ("dispatcher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD CONSTRAINT "measure_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_statement_items" ADD CONSTRAINT "ap_statement_items_statement_id_ap_statements_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."ap_statements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_statements" ADD CONSTRAINT "ap_statements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_statements" ADD CONSTRAINT "ap_statements_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_statements" ADD CONSTRAINT "ap_statements_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_statements" ADD CONSTRAINT "ap_statements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_statements" ADD CONSTRAINT "ar_statements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_statements" ADD CONSTRAINT "ar_statements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_statements" ADD CONSTRAINT "ar_statements_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_statements" ADD CONSTRAINT "ar_statements_sales_id_users_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_statements" ADD CONSTRAINT "ar_statements_reconciliation_id_reconciliation_statements_id_fk" FOREIGN KEY ("reconciliation_id") REFERENCES "public"."reconciliation_statements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_statements" ADD CONSTRAINT "ar_statements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_statement_id_ar_statements_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."ar_statements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_quote_bundle_id_quote_bundles_id_fk" FOREIGN KEY ("quote_bundle_id") REFERENCES "public"."quote_bundles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_statement_id_ar_statements_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."ar_statements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_reconciliation_id_reconciliation_statements_id_fk" FOREIGN KEY ("reconciliation_id") REFERENCES "public"."reconciliation_statements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_statements" ADD CONSTRAINT "reconciliation_statements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_statements" ADD CONSTRAINT "reconciliation_statements_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_statements" ADD CONSTRAINT "reconciliation_statements_sales_id_users_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_statements" ADD CONSTRAINT "reconciliation_statements_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_statements" ADD CONSTRAINT "reconciliation_statements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_flows" ADD CONSTRAINT "approval_flows_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_instances" ADD CONSTRAINT "approval_instances_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_instances" ADD CONSTRAINT "approval_instances_flow_id_approval_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."approval_flows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_instances" ADD CONSTRAINT "approval_instances_applicant_id_users_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_records" ADD CONSTRAINT "approval_records_instance_id_approval_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."approval_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_records" ADD CONSTRAINT "approval_records_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_resolutions" ADD CONSTRAINT "after_sales_resolutions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_resolutions" ADD CONSTRAINT "after_sales_resolutions_after_sales_id_after_sales_tickets_id_fk" FOREIGN KEY ("after_sales_id") REFERENCES "public"."after_sales_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_resolutions" ADD CONSTRAINT "after_sales_resolutions_new_order_id_orders_id_fk" FOREIGN KEY ("new_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_resolutions" ADD CONSTRAINT "after_sales_resolutions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_resolutions" ADD CONSTRAINT "after_sales_resolutions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_tickets" ADD CONSTRAINT "after_sales_tickets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_tickets" ADD CONSTRAINT "after_sales_tickets_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_tickets" ADD CONSTRAINT "after_sales_tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_tickets" ADD CONSTRAINT "after_sales_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_tickets" ADD CONSTRAINT "after_sales_tickets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liability_notices" ADD CONSTRAINT "liability_notices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liability_notices" ADD CONSTRAINT "liability_notices_after_sales_id_after_sales_tickets_id_fk" FOREIGN KEY ("after_sales_id") REFERENCES "public"."after_sales_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liability_notices" ADD CONSTRAINT "liability_notices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resolution_progress_logs" ADD CONSTRAINT "resolution_progress_logs_resolution_id_after_sales_resolutions_id_fk" FOREIGN KEY ("resolution_id") REFERENCES "public"."after_sales_resolutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resolution_progress_logs" ADD CONSTRAINT "resolution_progress_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pref_user" ON "notification_preferences" USING btree ("user_id","notification_type");--> statement-breakpoint
CREATE INDEX "idx_notif_tenant" ON "notifications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_notif_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notif_created" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notif_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_reminder_tenant" ON "reminder_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_reminder_module" ON "reminder_rules" USING btree ("module");--> statement-breakpoint
CREATE INDEX "idx_dict_tenant" ON "sys_dictionaries" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_dict_key" ON "sys_dictionaries" USING btree ("category","key");--> statement-breakpoint
CREATE INDEX "idx_sys_log_tenant" ON "system_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_sys_log_module" ON "system_logs" USING btree ("module");--> statement-breakpoint
CREATE INDEX "idx_sys_log_entity" ON "system_logs" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_sys_log_created" ON "system_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_customers_tenant" ON "customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_customers_phone" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_customers_sales" ON "customers" USING btree ("assigned_sales_id");--> statement-breakpoint
CREATE INDEX "idx_customers_created" ON "customers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_leads_tenant" ON "leads" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_leads_customer" ON "leads" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_leads_phone" ON "leads" USING btree ("customer_phone");--> statement-breakpoint
CREATE INDEX "idx_leads_status" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_leads_sales" ON "leads" USING btree ("assigned_sales_id");--> statement-breakpoint
CREATE INDEX "idx_leads_created" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_bundles_tenant" ON "quote_bundles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bundles_customer" ON "quote_bundles" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_bundles_lead" ON "quote_bundles" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_bundles_no" ON "quote_bundles" USING btree ("bundle_no");--> statement-breakpoint
CREATE INDEX "idx_bundles_status" ON "quote_bundles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bundles_created" ON "quote_bundles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_quotes_tenant" ON "quotes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_quotes_customer" ON "quotes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_quotes_lead" ON "quotes" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_quotes_no" ON "quotes" USING btree ("quote_no");--> statement-breakpoint
CREATE INDEX "idx_quotes_status" ON "quotes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_quotes_created" ON "quotes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_quotes_bundle" ON "quotes" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "idx_quotes_category" ON "quotes" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_orders_tenant" ON "orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_orders_customer" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_orders_lead" ON "orders" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_orders_no" ON "orders" USING btree ("order_no");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_sales" ON "orders" USING btree ("sales_id");--> statement-breakpoint
CREATE INDEX "idx_orders_created" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_inv_batch_tenant" ON "inventory_batches" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inv_batch_product" ON "inventory_batches" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_inv_batch_remaining" ON "inventory_batches" USING btree ("remaining_quantity");--> statement-breakpoint
CREATE INDEX "idx_inv_batch_inbound" ON "inventory_batches" USING btree ("inbound_at");--> statement-breakpoint
CREATE INDEX "idx_inv_tenant" ON "inventory_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inv_product" ON "inventory_logs" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_inv_created" ON "inventory_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_inv_usage_tenant" ON "inventory_usage_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inv_usage_batch" ON "inventory_usage_logs" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_inv_usage_item" ON "inventory_usage_logs" USING btree ("quote_item_id");--> statement-breakpoint
CREATE INDEX "idx_po_tenant" ON "purchase_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_po_order" ON "purchase_orders" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_po_supplier" ON "purchase_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_po_status" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_po_created" ON "purchase_orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_shipment_tenant" ON "logistics_shipments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_shipment_ref" ON "logistics_shipments" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_shipment_status" ON "logistics_shipments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_shipment_tracking" ON "logistics_shipments" USING btree ("tracking_no");--> statement-breakpoint
CREATE INDEX "idx_prc_tenant" ON "processing_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_prc_order" ON "processing_orders" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_prc_processor" ON "processing_orders" USING btree ("processor_id");--> statement-breakpoint
CREATE INDEX "idx_prc_status" ON "processing_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_prc_created" ON "processing_orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_install_photo_tenant" ON "install_photos" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_install_photo_task" ON "install_photos" USING btree ("install_task_id");--> statement-breakpoint
CREATE INDEX "idx_install_photo_type" ON "install_photos" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_install_photo_created" ON "install_photos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_install_tenant" ON "install_tasks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_install_order" ON "install_tasks" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_install_status" ON "install_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_install_worker" ON "install_tasks" USING btree ("assigned_worker_id");--> statement-breakpoint
CREATE INDEX "idx_install_created" ON "install_tasks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_measure_tenant" ON "measure_tasks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_measure_customer" ON "measure_tasks" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_measure_worker" ON "measure_tasks" USING btree ("assigned_worker_id");--> statement-breakpoint
CREATE INDEX "idx_ap_tenant" ON "ap_statements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ap_type" ON "ap_statements" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_ap_status" ON "ap_statements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ap_supplier" ON "ap_statements" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_ap_worker" ON "ap_statements" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "idx_ap_created" ON "ap_statements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ar_stmt_tenant" ON "ar_statements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ar_stmt_customer" ON "ar_statements" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_ar_stmt_order" ON "ar_statements" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_ar_stmt_status" ON "ar_statements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ar_stmt_created" ON "ar_statements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_sched_tenant" ON "payment_schedules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_sched_order" ON "payment_schedules" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_sched_statement" ON "payment_schedules" USING btree ("statement_id");--> statement-breakpoint
CREATE INDEX "idx_receipt_tenant" ON "receipts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_receipt_customer" ON "receipts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_receipt_order" ON "receipts" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_recon_tenant" ON "reconciliation_statements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_recon_customer" ON "reconciliation_statements" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_recon_status" ON "reconciliation_statements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_recon_created" ON "reconciliation_statements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_approval_flow_tenant" ON "approval_flows" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_approval_flow_module" ON "approval_flows" USING btree ("module","trigger_action");--> statement-breakpoint
CREATE INDEX "idx_approval_inst_tenant" ON "approval_instances" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_approval_inst_entity" ON "approval_instances" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_approval_inst_status" ON "approval_instances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_approval_rec_inst" ON "approval_records" USING btree ("instance_id");