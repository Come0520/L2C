CREATE TABLE "sales_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"target_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "customer_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"description" text NOT NULL,
	"images" text[] DEFAULT '{}',
	"location" jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "custom_channel_type" varchar(50);--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD COLUMN "actual_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_activities" ADD CONSTRAINT "customer_activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sales_targets_user_date_idx" ON "sales_targets" USING btree ("tenant_id","user_id","year","month");--> statement-breakpoint
CREATE INDEX "idx_cust_activities_tenant" ON "customer_activities" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cust_activities_customer" ON "customer_activities" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_cust_activities_creator" ON "customer_activities" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_cust_activities_date" ON "customer_activities" USING btree ("created_at");