-- 修复 tenants 表缺失的列
-- 这些列在 Drizzle Schema (infrastructure.ts) 中定义但从未生成迁移 SQL
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users integer;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS purchased_modules jsonb DEFAULT '[]'::jsonb;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS storage_quota bigint;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;

-- 验证
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name IN ('max_users', 'purchased_modules', 'storage_quota', 'trial_ends_at')
ORDER BY column_name;
