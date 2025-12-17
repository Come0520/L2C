-- 修复用户注册触发器
-- 解决注册时可能的错误

-- 1. 删除旧的触发器和函数
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. 创建改进的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 创建用户记录
  -- 注意：邮箱认证时，phone存储在raw_user_meta_data中
  INSERT INTO public.users (id, name, phone, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', '未命名用户'),
    COALESCE(new.phone, new.raw_user_meta_data->>'phone', ''),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  -- 创建积分账户（如果points_accounts表存在）
  -- 使用 ON CONFLICT 避免重复插入错误
  BEGIN
    INSERT INTO public.points_accounts (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN undefined_table THEN
      -- 如果表不存在，跳过（不影响用户注册）
      NULL;
    WHEN OTHERS THEN
      -- 记录其他错误但不阻止用户注册
      RAISE WARNING 'Failed to create points account for user %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 重新绑定触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. 验证触发器已创建
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
