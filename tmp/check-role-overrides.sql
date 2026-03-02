-- 修复 role_overrides 表的 added_permissions 和 removed_permissions 列类型
-- 需要使用 USING 子句将文本转换为 jsonb

-- 先查看当前列类型
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'role_overrides'
ORDER BY ordinal_position;
