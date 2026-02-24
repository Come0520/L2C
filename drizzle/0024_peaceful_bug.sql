ALTER TYPE "public"."measure_sheet_status" ADD VALUE 'SUBMITTED' BEFORE 'CONFIRMED';--> statement-breakpoint
ALTER TABLE "notification_queue" ALTER COLUMN "retry_count" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "notification_queue" ALTER COLUMN "retry_count" SET DATA TYPE integer USING retry_count::integer;--> statement-breakpoint
ALTER TABLE "notification_queue" ALTER COLUMN "retry_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "notification_queue" ALTER COLUMN "max_retries" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "notification_queue" ALTER COLUMN "max_retries" SET DATA TYPE integer USING max_retries::integer;--> statement-breakpoint
ALTER TABLE "notification_queue" ALTER COLUMN "max_retries" SET DEFAULT 3;--> statement-breakpoint
ALTER TABLE "measure_tasks" ADD COLUMN "cancel_reason" text;--> statement-breakpoint
CREATE INDEX "idx_notifications_tenant_user_read" ON "notifications" USING btree ("tenant_id","user_id","is_read");--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "unq_notif_prefs_user_type" UNIQUE("user_id","notification_type");