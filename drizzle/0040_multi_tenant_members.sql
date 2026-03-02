-- ==========================================
-- L2C 多租户改造迁移脚本
-- 参考模型：Clerk/WorkOS/Auth0 Organization
-- ==========================================

-- ==========================================
-- 阶段 1：创建 tenant_members 表
-- ==========================================
CREATE TABLE IF NOT EXISTS tenant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'SALES',
    roles JSONB DEFAULT '[]'::jsonb,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_tenant UNIQUE(user_id, tenant_id)
);

-- 索引：加速按 user_id 查询（查某人加入了哪些租户）
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON tenant_members(user_id);

-- 索引：加速按 tenant_id 查询（查某租户有哪些成员）
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON tenant_members(tenant_id);

-- 索引：加速查找活跃成员
CREATE INDEX IF NOT EXISTS idx_tenant_members_active ON tenant_members(user_id, is_active) WHERE is_active = true;

-- ==========================================
-- 阶段 2：数据迁移 — 从 users 表复制到 tenant_members
-- ==========================================
INSERT INTO tenant_members (user_id, tenant_id, role, roles, permissions, is_active, joined_at)
SELECT 
    id AS user_id,
    tenant_id,
    COALESCE(role, 'SALES') AS role,
    COALESCE(roles, '[]'::jsonb) AS roles,
    COALESCE(permissions, '[]'::jsonb) AS permissions,
    COALESCE(is_active, true) AS is_active,
    COALESCE(created_at, NOW()) AS joined_at
FROM users
WHERE tenant_id IS NOT NULL
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- ==========================================
-- 阶段 3：给 users 表添加 last_active_tenant_id 列
-- ==========================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_tenant_id UUID;

-- 用现有 tenant_id 填充 last_active_tenant_id
UPDATE users 
SET last_active_tenant_id = tenant_id 
WHERE tenant_id IS NOT NULL AND last_active_tenant_id IS NULL;

-- ==========================================
-- 阶段 4（延迟执行 — 请勿取消注释！）
-- 等系统稳定运行 1-2 个版本后再执行
-- ==========================================
-- ALTER TABLE users DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE users DROP COLUMN IF EXISTS role;
-- ALTER TABLE users DROP COLUMN IF EXISTS roles;
-- ALTER TABLE users DROP COLUMN IF EXISTS permissions;
