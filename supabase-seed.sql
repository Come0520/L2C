-- Supabase 订单数据模拟脚本（最终兼容版）
-- 运行环境：Supabase SQL编辑器
-- 功能：为每个订单状态生成10条模拟数据，客户名字从"测试1"开始

-- 1. 创建客户数据（安全方式）
INSERT INTO customers (name, phone, address, created_at, updated_at)
SELECT 
  '测试' || i,
  '138000000' || LPAD(i::text, 2, '0'),
  '测试地址' || i || '号',
  NOW(),
  NOW()
FROM generate_series(1, 120) AS i
ON CONFLICT (phone) DO NOTHING;

-- 2. 确保有销售用户
INSERT INTO users (name, email, phone, role, created_at, updated_at)
VALUES 
('销售经理', 'sales@example.com', '13800000002', 'sales', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 3. 生成订单数据（兼容整数和UUID类型）
-- 为每种订单状态生成10条订单
INSERT INTO sales_orders (
  sales_no, order_no, customer_id, sales_id, sales_person_name, 
  status, project_address, create_time, created_at, updated_at
)
SELECT 
  -- 生成唯一销售单号
  'SO' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD((ROW_NUMBER() OVER ())::text, 4, '0'),
  -- 生成唯一订单号
  'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD((ROW_NUMBER() OVER ())::text, 4, '0'),
  -- 客户ID（从现有客户中获取）
  (SELECT id FROM customers WHERE name = '测试' || (ROW_NUMBER() OVER (PARTITION BY status))),
  -- 销售ID（从现有用户中获取）
  (SELECT id FROM users WHERE role IN ('sales', 'admin') LIMIT 1),
  -- 销售姓名（从现有用户中获取）
  (SELECT name FROM users WHERE role IN ('sales', 'admin') LIMIT 1),
  -- 订单状态
  status,
  -- 项目地址
  '测试项目地址',
  -- 创建时间
  NOW() - INTERVAL '1 day' * (ROW_NUMBER() OVER (PARTITION BY status)),
  -- 其他时间字段
  NOW(),
  NOW()
FROM (
  -- 生成12种状态，每种10条
  SELECT status FROM (
    VALUES 
    ('draft'),
    ('pending_push'),
    ('push_order_confirmed'),
    ('payment_confirmed'),
    ('plan_confirmed'),
    ('production_in_progress'),
    ('production_completed'),
    ('ready_for_installation'),
    ('installation_scheduled'),
    ('installation_completed'),
    ('invoice_issued'),
    ('completed')
  ) AS t(status)
  CROSS JOIN generate_series(1, 10) AS gs(i)
) AS status_series(status);

-- 4. 输出结果统计
SELECT 
  status,
  COUNT(*) AS order_count
FROM sales_orders
GROUP BY status
ORDER BY status;

-- 5. 输出总订单数
SELECT 
  'Total Orders' AS description,
  COUNT(*) AS count
FROM sales_orders;

-- 6. 输出客户使用情况（前20个客户）
SELECT 
  c.name,
  COUNT(so.id) AS order_count
FROM customers c
LEFT JOIN sales_orders so ON c.id = so.customer_id
WHERE c.name LIKE '测试%'
GROUP BY c.name
ORDER BY c.name
LIMIT 20;
