ALTER TYPE "public"."showroom_item_type" ADD VALUE 'TRAINING';--> statement-breakpoint
CREATE TABLE "payment_plan_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ar_statement_id" uuid NOT NULL,
	"node_index" integer NOT NULL,
	"node_name" varchar(100) NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"due_date" date,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "product_bundle_items" DROP CONSTRAINT "product_bundle_items_bundle_id_product_bundles_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_plan_nodes" ADD CONSTRAINT "payment_plan_nodes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plan_nodes" ADD CONSTRAINT "payment_plan_nodes_ar_statement_id_ar_statements_id_fk" FOREIGN KEY ("ar_statement_id") REFERENCES "public"."ar_statements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_payment_plan_nodes_tenant" ON "payment_plan_nodes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_payment_plan_nodes_ar" ON "payment_plan_nodes" USING btree ("ar_statement_id");--> statement-breakpoint
ALTER TABLE "product_bundle_items" ADD CONSTRAINT "product_bundle_items_bundle_id_product_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."product_bundles"("id") ON DELETE cascade ON UPDATE no action;