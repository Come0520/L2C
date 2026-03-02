-- 手动修复 role_overrides 表的类型转换（drizzle-kit push 无法自动处理）
-- 将 added_permissions 和 removed_permissions 从 text[] 或 text 转换为 jsonb

ALTER TABLE "role_overrides" 
  ALTER COLUMN "added_permissions" SET DATA TYPE jsonb 
  USING added_permissions::text::jsonb;

ALTER TABLE "role_overrides" 
  ALTER COLUMN "added_permissions" SET DEFAULT '[]'::jsonb;

ALTER TABLE "role_overrides" 
  ALTER COLUMN "removed_permissions" SET DATA TYPE jsonb 
  USING removed_permissions::text::jsonb;

ALTER TABLE "role_overrides" 
  ALTER COLUMN "removed_permissions" SET DEFAULT '[]'::jsonb;
