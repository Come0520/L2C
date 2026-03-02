-- 落地页功能：tenants 表新增展示信息字段
-- 用于小程序租户专属落地页的品牌展示

ALTER TABLE "tenants" ADD COLUMN "slogan" varchar(200);
ALTER TABLE "tenants" ADD COLUMN "detail_address" text;
ALTER TABLE "tenants" ADD COLUMN "contact_wechat" varchar(100);
ALTER TABLE "tenants" ADD COLUMN "landing_cover_url" text;
