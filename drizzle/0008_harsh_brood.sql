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