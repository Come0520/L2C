-- 企业认证功能迁移
-- 添加认证状态枚举和相关字段

-- 创建认证状态枚举
DO $$ BEGIN
    CREATE TYPE "public"."verification_status" AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 添加认证相关字段到 tenants 表
ALTER TABLE "tenants"
ADD COLUMN IF NOT EXISTS "verification_status" "verification_status" DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS "business_license_url" text,
ADD COLUMN IF NOT EXISTS "legal_rep_name" varchar(50),
ADD COLUMN IF NOT EXISTS "registered_capital" varchar(50),
ADD COLUMN IF NOT EXISTS "business_scope" text,
ADD COLUMN IF NOT EXISTS "verified_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "verified_by" uuid,
ADD COLUMN IF NOT EXISTS "verification_reject_reason" text;
