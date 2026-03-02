# Sprint 1 — 任务 1.3：数据迁移 SQL 脚本

## 你的身份

你是一个实现子代理 (Implementer Subagent)，正在执行 L2C 多租户改造方案。

**前置任务**：任务 1.1 和 1.2 已完成（tenant_members Schema 已定义、users 表已新增 lastActiveTenantId 字段）。

## 任务描述

创建数据库迁移脚本，在 PostgreSQL 中执行以下操作：

1. 创建 `tenant_members` 表
2. 将现有 `users` 表中的租户绑定数据迁移到 `tenant_members`
3. 给 `users` 表添加 `last_active_tenant_id` 列
4. （预留但注释掉）删除旧列

## 具体工作

### 创建 `drizzle/0040_multi_tenant_members.sql`

```sql
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
```

## 注意事项

1. 迁移脚本使用 `IF NOT EXISTS` / `IF EXISTS` 确保幂等性（可重复执行不报错）
2. `ON CONFLICT DO NOTHING` 防止重复数据
3. **不要执行阶段 4！** 只写注释，让团队决定何时执行
4. 工作目录：`c:\Users\bigey\Documents\Antigravity\L2C`

## 验证方式

脚本创建后，可以检查文件是否存在：

```bash
cat drizzle/0040_multi_tenant_members.sql | head -20
```

如果数据库在本地运行，也可以 dry-run 检查语法（但不要真正执行）。

## 完成后报告

请报告创建了哪些文件。
