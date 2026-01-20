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