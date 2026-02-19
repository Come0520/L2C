CREATE TYPE "public"."showroom_item_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."showroom_item_type" AS ENUM('PRODUCT', 'CASE', 'KNOWLEDGE');--> statement-breakpoint
CREATE TABLE "showroom_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" "showroom_item_type" NOT NULL,
	"product_id" uuid,
	"title" varchar(200) NOT NULL,
	"content" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"score" integer DEFAULT 0,
	"status" "showroom_item_status" DEFAULT 'DRAFT' NOT NULL,
	"views" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "showroom_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sales_id" uuid NOT NULL,
	"customer_id" uuid,
	"items_snapshot" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" integer DEFAULT 1,
	"expires_at" timestamp with time zone NOT NULL,
	"views" integer DEFAULT 0,
	"last_viewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "source" varchar(50);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "referrer_name" varchar(50);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "score" numeric(5, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "showroom_items" ADD CONSTRAINT "showroom_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showroom_items" ADD CONSTRAINT "showroom_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showroom_items" ADD CONSTRAINT "showroom_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showroom_items" ADD CONSTRAINT "showroom_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showroom_shares" ADD CONSTRAINT "showroom_shares_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showroom_shares" ADD CONSTRAINT "showroom_shares_sales_id_users_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showroom_shares" ADD CONSTRAINT "showroom_shares_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_showroom_items_tenant" ON "showroom_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_showroom_items_product" ON "showroom_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_showroom_items_type" ON "showroom_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_showroom_shares_tenant" ON "showroom_shares" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_showroom_shares_sales" ON "showroom_shares" USING btree ("sales_id");--> statement-breakpoint
CREATE INDEX "idx_showroom_shares_customer" ON "showroom_shares" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_leads_external_id" ON "leads" USING btree ("external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_channel_categories_code" ON "channel_categories" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_channel_categories_name" ON "channel_categories" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "idx_commissions_list" ON "channel_commissions" USING btree ("tenant_id","channel_id","status");