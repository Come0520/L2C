ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_phone_unique";--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'PENDING_ASSIGNMENT'::text;--> statement-breakpoint
DROP TYPE "public"."lead_status";--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('PENDING_ASSIGNMENT', 'PENDING_FOLLOWUP', 'FOLLOWING_UP', 'INVALID', 'WON');--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'PENDING_ASSIGNMENT'::"public"."lead_status";--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "status" SET DATA TYPE "public"."lead_status" USING "status"::"public"."lead_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_channels_code_unique" ON "channels" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_channels_name_unique" ON "channels" USING btree ("tenant_id","name");