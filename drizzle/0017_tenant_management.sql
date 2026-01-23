-- 租户管理与平台管理员迁移脚本
-- 日期: 2026-01-23
-- 功能: 添加租户状态、申请信息、地区、审批信息字段，以及平台管理员标识

-- 1. 创建租户状态枚举类型
DO $$ BEGIN
    CREATE TYPE tenant_status AS ENUM (
        'pending_approval',  -- 待审批
        'active',            -- 已激活
        'rejected',          -- 已拒绝
        'suspended'          -- 已暂停
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. 扩展 tenants 表
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS status tenant_status DEFAULT 'active' NOT NULL,
    ADD COLUMN IF NOT EXISTS applicant_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS applicant_phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS applicant_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS region VARCHAR(100),
    ADD COLUMN IF NOT EXISTS business_description TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reject_reason TEXT;

-- 3. 扩展 users 表，添加平台管理员标识
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;

-- 4. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_users_platform_admin ON users(is_platform_admin) WHERE is_platform_admin = true;

-- 5. 更新现有租户状态为 active（如果尚未设置）
UPDATE tenants SET status = 'active' WHERE status IS NULL;
