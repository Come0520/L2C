ALTER TABLE "install_tasks" ADD COLUMN "assigned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "check_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "check_in_location" jsonb;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "actual_labor_fee" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "adjustment_reason" text;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "rating" integer;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "confirmed_by" uuid;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "install_tasks" ADD CONSTRAINT "install_tasks_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint