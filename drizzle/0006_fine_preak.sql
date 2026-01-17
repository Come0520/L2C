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