CREATE TABLE "split_route_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"priority" numeric(10, 0) DEFAULT '0' NOT NULL,
	"conditions" text NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_supplier_id" uuid,
	"is_active" numeric(1, 0) DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "split_route_rules" ADD CONSTRAINT "split_route_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_route_rules" ADD CONSTRAINT "split_route_rules_target_supplier_id_suppliers_id_fk" FOREIGN KEY ("target_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_route_rules" ADD CONSTRAINT "split_route_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_split_rule_tenant" ON "split_route_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_split_rule_priority" ON "split_route_rules" USING btree ("priority");