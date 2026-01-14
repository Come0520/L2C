CREATE TYPE "public"."measure_type" AS ENUM('PRE_SALES', 'RE_MEASURE');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" text NOT NULL,
	"record_id" text NOT NULL,
	"action" text NOT NULL,
	"user_id" text,
	"changed_fields" jsonb,
	"old_values" jsonb,
	"new_values" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quote_items" ADD COLUMN "measure_window_id" uuid;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "order_id" uuid;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "type" "measure_type" DEFAULT 'PRE_SALES';--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "sales_brief" jsonb;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD CONSTRAINT "measure_tasks_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;