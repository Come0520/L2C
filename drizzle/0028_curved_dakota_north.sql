ALTER TYPE "public"."lead_status" ADD VALUE 'MEASUREMENT_SCHEDULED';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'QUOTED';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'LOST';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'PENDING_REVIEW';--> statement-breakpoint
DROP INDEX "idx_leads_status";--> statement-breakpoint
DROP INDEX "idx_leads_sales";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "import_batch_id" varchar(100);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "raw_data" jsonb;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "fee_check_status" "fee_check_status" DEFAULT 'NONE';--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "details" jsonb;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "trace_id" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD COLUMN "cost_price" numeric(12, 2);--> statement-breakpoint
CREATE INDEX "idx_leads_source_channel" ON "leads" USING btree ("tenant_id","source_channel_id");--> statement-breakpoint
CREATE INDEX "idx_leads_source_sub" ON "leads" USING btree ("tenant_id","source_sub_id");--> statement-breakpoint
CREATE INDEX "idx_leads_intention" ON "leads" USING btree ("tenant_id","intention_level");--> statement-breakpoint
CREATE INDEX "idx_install_customer" ON "install_tasks" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_install_tenant_status" ON "install_tasks" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_install_tenant_scheduled" ON "install_tasks" USING btree ("tenant_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_approval_tasks_tenant_approver_status" ON "approval_tasks" USING btree ("tenant_id","approver_id","status");--> statement-breakpoint
CREATE INDEX "idx_approvals_tenant_requester" ON "approvals" USING btree ("tenant_id","requester_id");--> statement-breakpoint
CREATE INDEX "idx_as_tenant_type_status" ON "after_sales_tickets" USING btree ("tenant_id","type","status");--> statement-breakpoint
CREATE INDEX "idx_ln_tenant_party_status" ON "liability_notices" USING btree ("tenant_id","liable_party_type","liable_party_id","status");--> statement-breakpoint
CREATE INDEX "idx_ln_tenant_status_confirmed" ON "liability_notices" USING btree ("tenant_id","status","confirmed_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_record" ON "audit_logs" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "idx_leads_status" ON "leads" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_leads_sales" ON "leads" USING btree ("tenant_id","assigned_sales_id");