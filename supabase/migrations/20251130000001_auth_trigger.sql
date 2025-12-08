-- 创建 Trigger：自动同步 auth.users 到 public.users

-- 1. 创建函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, phone, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.phone, -- 如果使用手机号注册
    new.raw_user_meta_data->>'avatar_url'
  );
  
  -- 如果有积分账户表，也可以在这里初始化
  INSERT INTO public.points_accounts (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 绑定 Trigger
-- 先删除旧的（如果存在），避免重复
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
