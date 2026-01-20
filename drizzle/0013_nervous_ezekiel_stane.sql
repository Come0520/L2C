ALTER TYPE "public"."product_category" ADD VALUE 'SERVICE';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "wechat_openid" varchar(100);--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "bundle_id" uuid;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_wechat_openid_unique" UNIQUE("wechat_openid");