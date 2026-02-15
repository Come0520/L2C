ALTER TYPE "public"."install_task_status" ADD VALUE 'PENDING_ACCEPT' BEFORE 'PENDING_VISIT';--> statement-breakpoint
ALTER TYPE "public"."install_task_status" ADD VALUE 'IN_PROGRESS' BEFORE 'PENDING_CONFIRM';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'SALES';--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "roles" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "labor_fee" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "actual_labor_fee" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "adjustment_reason" text;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "fee_breakdown" jsonb;