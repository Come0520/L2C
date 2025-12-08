-- 增强RLS策略，添加缺失的策略并完善现有策略

-- 只执行策略更新部分，跳过创建策略的部分
-- 因为PostgreSQL不支持CREATE POLICY IF NOT EXISTS语法

-- 28. 确保所有策略都使用正确的角色名称
-- 将所有使用'admin'角色的策略更新为同时支持'LEAD_ADMIN'角色
DO $$
BEGIN
  -- 更新users表策略
  ALTER POLICY "Admins can view all users" ON users
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  ALTER POLICY "Admins can update all users" ON users
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  ALTER POLICY "Admins can delete users" ON users
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  -- 更新products表策略
  ALTER POLICY "Admins can view all products" ON products
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  ALTER POLICY "Admins can create products" ON products
    WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  ALTER POLICY "Admins can update products" ON products
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  ALTER POLICY "Admins can delete products" ON products
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  -- 更新orders表策略
  ALTER POLICY "Admins can view all orders" ON orders
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  ALTER POLICY "Admins can update all orders" ON orders
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  -- 更新leads表策略
  ALTER POLICY "Admins can view all leads" ON leads
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  ALTER POLICY "Admins can update all leads" ON leads
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  -- 更新quotes表策略
  ALTER POLICY "Admins can view all quotes" ON quotes
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  ALTER POLICY "Admins can update all quotes" ON quotes
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  -- 更新sales_orders表策略
  ALTER POLICY "Admins can view all sales orders" ON sales_orders
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  ALTER POLICY "Admins can update all sales orders" ON sales_orders
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  -- 更新notifications表策略
  ALTER POLICY "Admins can view all notifications" ON notifications
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  -- 更新reminders表策略
  ALTER POLICY "Admins can view all reminders" ON reminders
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  ALTER POLICY "Admins can update all reminders" ON reminders
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  -- 更新points_accounts表策略
  ALTER POLICY "Admins can view all points accounts" ON points_accounts
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  -- 更新points_transactions表策略
  ALTER POLICY "Admins can view all points transactions" ON points_transactions
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  -- 更新points_orders表策略
  ALTER POLICY "Admins can view all points orders" ON points_orders
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  -- 更新gifts表策略
  ALTER POLICY "Admins can view all gifts" ON gifts
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  ALTER POLICY "Admins can create gifts" ON gifts
    WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
  
  ALTER POLICY "Admins can update gifts" ON gifts
    USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'LEAD_ADMIN');
END $$;