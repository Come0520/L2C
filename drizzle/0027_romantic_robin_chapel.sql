DROP INDEX "idx_channels_code";--> statement-breakpoint
DROP INDEX "idx_channels_code_unique";--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "channel_no" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "locked_by" uuid;--> statement-breakpoint
ALTER TABLE "package_products" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "is_late" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "late_minutes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "variant" varchar(50);--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "reject_history" jsonb;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_products" ADD CONSTRAINT "package_products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_quotes_tenant_status" ON "quotes" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_quotes_tenant_created" ON "quotes" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_tenant_created" ON "orders" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_fabric_logs_tenant" ON "fabric_inventory_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_package_products_tenant" ON "package_products" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bundle_items_tenant" ON "product_bundle_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_bundle_items_product" ON "product_bundle_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_production_tasks_status" ON "production_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_split_route_rules_tenant" ON "split_route_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_split_route_rules_priority" ON "split_route_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_measure_sheets_tenant_task" ON "measure_sheets" USING btree ("tenant_id","task_id");--> statement-breakpoint
CREATE INDEX "idx_measure_task_splits_new" ON "measure_task_splits" USING btree ("new_task_id");--> statement-breakpoint
CREATE INDEX "idx_measure_tasks_worker" ON "measure_tasks" USING btree ("assigned_worker_id");--> statement-breakpoint
CREATE INDEX "idx_measure_tasks_customer" ON "measure_tasks" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_channels_code" ON "channels" USING btree ("channel_no");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_channels_code_unique" ON "channels" USING btree ("tenant_id","channel_no");--> statement-breakpoint
ALTER TABLE "channels" DROP COLUMN "code";--> statement-breakpoint
ALTER TABLE "channel_specific_prices" ADD CONSTRAINT "uq_csp_product_channel" UNIQUE("product_id","channel_id");--> statement-breakpoint
ALTER TABLE "product_suppliers" ADD CONSTRAINT "uq_product_suppliers_product_supplier" UNIQUE("product_id","supplier_id");