ALTER TYPE "public"."user_role" ADD VALUE 'SUPER_ADMIN' BEFORE 'ADMIN';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'BOSS' BEFORE 'ADMIN';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'DISPATCHER' BEFORE 'SALES';--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_wechat_openid_unique";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "uq_users_tenant_wechat" UNIQUE("tenant_id","wechat_openid");