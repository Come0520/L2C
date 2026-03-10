ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "max_users" integer;-->statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "purchased_modules" jsonb DEFAULT '[]'::jsonb;-->statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "storage_quota" bigint;-->statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamp with time zone;
