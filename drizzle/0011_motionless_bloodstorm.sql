ALTER TYPE "public"."order_status" ADD VALUE 'PAUSED' BEFORE 'PENDING_DELIVERY';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'PENDING_APPROVAL' BEFORE 'PENDING_DELIVERY';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paused_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pause_reason" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pause_cumulative_days" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD COLUMN "min_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD COLUMN "max_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD COLUMN "conditions" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD COLUMN "is_dynamic" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD COLUMN "parent_task_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_quotes_active_version" ON "quotes" USING btree ("root_quote_id") WHERE is_active = true;