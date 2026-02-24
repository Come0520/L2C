CREATE TYPE "public"."debt_status" AS ENUM('ACTIVE', 'PARTIALLY_SETTLED', 'FULLY_SETTLED');--> statement-breakpoint
CREATE TABLE "debt_ledgers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"debt_no" varchar(50) NOT NULL,
	"liable_party_type" "liable_party_type" NOT NULL,
	"liable_party_id" uuid NOT NULL,
	"original_after_sales_id" uuid NOT NULL,
	"original_liability_notice_id" uuid NOT NULL,
	"original_deduction_amount" numeric(12, 2) NOT NULL,
	"actual_deducted_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"remaining_debt" numeric(12, 2) NOT NULL,
	"debt_status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"settled_at" timestamp with time zone,
	CONSTRAINT "debt_ledgers_debt_no_unique" UNIQUE("debt_no")
);
--> statement-breakpoint
ALTER TABLE "notification_queue" ADD COLUMN "idempotency_token" varchar(200);--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD COLUMN "balance_before" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "showroom_shares" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "showroom_shares" ADD COLUMN "max_views" integer;--> statement-breakpoint
ALTER TABLE "debt_ledgers" ADD CONSTRAINT "debt_ledgers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_ledgers" ADD CONSTRAINT "debt_ledgers_original_after_sales_id_after_sales_tickets_id_fk" FOREIGN KEY ("original_after_sales_id") REFERENCES "public"."after_sales_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_ledgers" ADD CONSTRAINT "debt_ledgers_original_liability_notice_id_liability_notices_id_fk" FOREIGN KEY ("original_liability_notice_id") REFERENCES "public"."liability_notices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dl_tenant_party" ON "debt_ledgers" USING btree ("tenant_id","liable_party_type","liable_party_id");--> statement-breakpoint
CREATE INDEX "idx_dl_status" ON "debt_ledgers" USING btree ("debt_status");--> statement-breakpoint
CREATE INDEX "idx_customers_tenant_status" ON "customers" USING btree ("tenant_id","pipeline_status");--> statement-breakpoint
CREATE INDEX "idx_customers_tenant_sales_status" ON "customers" USING btree ("tenant_id","assigned_sales_id","pipeline_status");--> statement-breakpoint
CREATE INDEX "idx_customers_tenant_updated_at" ON "customers" USING btree ("tenant_id","updated_at");--> statement-breakpoint
CREATE INDEX "idx_quotes_tenant_customer" ON "quotes" USING btree ("tenant_id","customer_id");--> statement-breakpoint
ALTER TABLE "notification_queue" ADD CONSTRAINT "unq_notif_queue_idempotency" UNIQUE("tenant_id","idempotency_token");