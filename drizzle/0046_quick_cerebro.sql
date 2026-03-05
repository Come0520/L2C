CREATE TYPE "public"."damage_report_status" AS ENUM('DRAFT', 'PENDING_SIGNATURES', 'APPROVED', 'DISPUTED', 'ARBITRATED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."signature_status" AS ENUM('PENDING', 'SIGNED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "after_sales_damage_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"report_no" varchar(50) NOT NULL,
	"after_sales_ticket_id" uuid NOT NULL,
	"total_damage_amount" numeric(12, 2) NOT NULL,
	"description" text NOT NULL,
	"evidence_photos" text[],
	"status" "damage_report_status" DEFAULT 'DRAFT' NOT NULL,
	"creator_id" uuid,
	"resolved_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "after_sales_damage_reports_report_no_unique" UNIQUE("report_no")
);
--> statement-breakpoint
ALTER TABLE "liability_notices" ADD COLUMN "damage_report_id" uuid;--> statement-breakpoint
ALTER TABLE "liability_notices" ADD COLUMN "signature_status" "signature_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "liability_notices" ADD COLUMN "signature_image" text;--> statement-breakpoint
ALTER TABLE "liability_notices" ADD COLUMN "signed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "liability_notices" ADD COLUMN "reject_reason" text;--> statement-breakpoint
ALTER TABLE "after_sales_damage_reports" ADD CONSTRAINT "after_sales_damage_reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "after_sales_damage_reports" ADD CONSTRAINT "after_sales_damage_reports_after_sales_ticket_id_after_sales_tickets_id_fk" FOREIGN KEY ("after_sales_ticket_id") REFERENCES "public"."after_sales_tickets"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "after_sales_damage_reports" ADD CONSTRAINT "after_sales_damage_reports_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dr_tenant" ON "after_sales_damage_reports" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_dr_after_sales" ON "after_sales_damage_reports" USING btree ("after_sales_ticket_id");--> statement-breakpoint
CREATE INDEX "idx_dr_report_no" ON "after_sales_damage_reports" USING btree ("report_no");--> statement-breakpoint
CREATE INDEX "idx_dr_tenant_status" ON "after_sales_damage_reports" USING btree ("tenant_id","status");--> statement-breakpoint
ALTER TABLE "liability_notices" ADD CONSTRAINT "liability_notices_damage_report_id_after_sales_damage_reports_id_fk" FOREIGN KEY ("damage_report_id") REFERENCES "public"."after_sales_damage_reports"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_ln_damage_report" ON "liability_notices" USING btree ("damage_report_id");