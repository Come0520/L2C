-- 向数据库中插入模拟订单数据

-- 创建测试用户（如果不存在）
INSERT INTO "users" ("id", "phone", "name", "role", "created_at", "updated_at")
VALUES 
  ('00000000-0000-0000-0000-000000000001', '13800000001', '测试用户1', 'customer', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '13800000002', '测试用户2', 'customer', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '13800000003', '测试用户3', 'customer', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '13800000004', '测试用户4', 'customer', now(), now()),
  ('00000000-0000-0000-0000-000000000005', '13800000005', '测试用户5', 'customer', now(), now()),
  ('00000000-0000-0000-0000-000000000011', '13800000011', '销售1', 'sales', now(), now()),
  ('00000000-0000-0000-0000-000000000012', '13800000012', '销售2', 'sales', now(), now()),
  ('00000000-0000-0000-0000-000000000013', '13800000013', '销售3', 'sales', now(), now())
ON CONFLICT ("phone") DO NOTHING;

-- 定义所有订单状态
DO $$ 
DECLARE
  v_status TEXT;
  v_i INT;
BEGIN
  -- 定义所有可能的订单状态
  FOREACH v_status IN ARRAY [
    'pending_assignment', 'pending_tracking', 'tracking', 'draft_signed', 'pending_measurement',
    'measuring_pending_assignment', 'measuring_assigning', 'measuring_pending_visit',
    'measuring_pending_confirmation', 'plan_pending_confirmation', 'pending_push',
    'pending_order', 'in_production', 'stock_prepared', 'pending_shipment', 'shipped',
    'installing_pending_assignment', 'installing_assigning', 'installing_pending_visit',
    'installing_pending_confirmation', 'delivered', 'pending_reconciliation',
    'pending_invoice', 'pending_payment', 'completed', 'cancelled', 'suspended', 'exception'
  ] LOOP
    -- 为每个状态插入10条模拟订单
    FOR v_i IN 1..10 LOOP
      INSERT INTO "orders" ("id", "sales_no", "customer_id", "sales_id", "total_amount", "status", "created_at", "updated_at")
      VALUES (
        gen_random_uuid(),
        'SO' || to_char(now(), 'YYYYMMDD') || lpad((v_i::text), 3, '0'),
        -- 随机选择客户
        (SELECT "id" FROM "users" WHERE "role" = 'customer' ORDER BY random() LIMIT 1),
        -- 随机选择销售
        (SELECT "id" FROM "users" WHERE "role" = 'sales' ORDER BY random() LIMIT 1),
        -- 随机金额（1000-10000）
        floor(random() * 9000 + 1000),
        v_status,
        now() - (random() * INTERVAL '30 days'), -- 随机创建时间（过去30天内）
        now() - (random() * INTERVAL '30 days')  -- 随机更新时间（过去30天内）
      );
    END LOOP;
  END LOOP;
END $$;