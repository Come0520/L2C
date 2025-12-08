-- 创建超级管理员脚本
-- 使用说明：先通过前端注册账号，然后用该账号的手机号替换下面的 'YOUR_PHONE_NUMBER'

-- 方式1: 通过手机号升级为超级管理员
-- UPDATE "users" 
-- SET "role" = 'LEAD_ADMIN', "updated_at" = now()
-- WHERE "phone" = 'YOUR_PHONE_NUMBER';

-- 方式2: 通过邮箱升级（如果使用email注册）
-- UPDATE auth.users
-- SET raw_app_meta_data = jsonb_set(
--   COALESCE(raw_app_meta_data, '{}'::jsonb),
--   '{role}',
--   '"LEAD_ADMIN"'::jsonb
-- )
-- WHERE email = 'YOUR_EMAIL';
-- 
-- UPDATE "users"
-- SET "role" = 'LEAD_ADMIN', "updated_at" = now()
-- WHERE "auth_user_id" = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');

-- 方式3: 直接插入超级管理员（仅用于开发测试）
-- 注意：如果使用Supabase Auth，建议先通过注册页面注册，再升级权限
-- INSERT INTO "users" (
--   "phone",
--   "name",
--   "role",
--   "created_at",
--   "updated_at"
-- ) VALUES (
--   '13800138000',  -- 替换为您的手机号
--   '超级管理员',    -- 替换为您的姓名
--   'LEAD_ADMIN',
--   now(),
--   now()
-- )
-- ON CONFLICT ("phone") DO UPDATE
-- SET "role" = 'LEAD_ADMIN', "updated_at" = now();

-- 验证：查询超级管理员
SELECT id, phone, name, role, created_at 
FROM "users" 
WHERE "role" = 'LEAD_ADMIN';
