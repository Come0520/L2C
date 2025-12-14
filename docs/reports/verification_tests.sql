-- 批量操作功能验证SQL测试脚本
-- 在Supabase SQL Editor中执行
-- Project: rdpiajialjnmngnaokix

-- ==============================================
-- 测试1: 检查函数是否存在 (预期返回9行)
-- ==============================================
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'update_order_status_v2',
    'cancel_order',
    'batch_update_order_status_v2',
    'batch_assign_sales_person',
    'get_order_status_history_enhanced',
    'get_order_status_statistics',
    'get_order_status_timeline',
    'get_order_assignment_history',
    'get_sales_person_assignment_stats'
  )
ORDER BY routine_name;

-- 预期结果: 9个函数
-- ✅ / ❌ : __________


-- ==============================================
-- 测试2: 获取测试数据
-- ==============================================
-- 2.1 获取一个测试订单（记录ID和version）
SELECT 
  id,
  status,
  version,
  customer_id,
  sales_id
FROM orders 
WHERE status != 'cancelled'
LIMIT 1;

-- 记录数据:
-- order_id = ___________________________________
-- status = _____________________________________
-- version = ____________________________________


-- 2.2 获取管理员用户
SELECT id, name, role
FROM users 
WHERE role IN ('admin', 'sales_manager')
LIMIT 1;

-- admin_id = ___________________________________


-- 2.3 获取销售人员
SELECT id, name, role
FROM users 
WHERE role IN ('sales', 'sales_manager')
LIMIT 1;

-- sales_person_id = _____________________________


-- ==============================================
-- 测试3: 测试辅助函数
-- ==============================================
-- 替换<当前status>为测试订单的实际status
SELECT * FROM get_allowed_next_statuses('draft_signed');

-- 预期: 返回允许的下一状态列表
-- ✅ / ❌ : __________


-- 测试是否允许某个状态转换
SELECT is_valid_status_transition('draft_signed', 'pending_measurement');

-- 预期: 返回true
-- ✅ / ❌ : __________


-- ==============================================
-- 测试4: 测试审计日志查询（如果订单有历史）
-- ==============================================
-- 替换<order_id>为上面获取的订单ID
SELECT * FROM get_order_status_history_enhanced(
  '<order_id>'::uuid,
  0,
  5
);

-- 预期: 返回历史记录（可能为空）
-- ✅ / ❌ : __________


-- ==============================================
-- 测试5: 测试乐观锁更新（谨慎！会修改数据）
-- ==============================================
/*
-- 仅在确认要测试时取消注释
-- 使用上面获取的订单数据替换占位符

SELECT update_order_status_v2(
  '<order_id>'::uuid,
  'pending_measurement',      -- 目标状态
  '<admin_id>'::uuid,
  <current_version>,          -- 当前version
  '验证测试 - 乐观锁正常更新'
);

-- 预期: 返回 {"success": true, "newVersion": 2, ...}
-- ✅ / ❌ : __________
*/


-- ==============================================
-- 测试6: 测试订单统计（如果订单有历史）
-- ==============================================
-- 替换<order_id>
SELECT * FROM get_order_status_statistics('<order_id>'::uuid);

-- 预期: 返回统计数据
-- ✅ / ❌ : __________


-- ==============================================
-- 测试7: 检查分配历史表是否存在
-- ==============================================
SELECT COUNT(*) as assignment_history_count
FROM order_assignment_history;

-- 预期: 返回数字（可能为0）
-- ✅ / ❌ : __________


-- ==============================================
-- 验证总结
-- ==============================================
/*
测试结果汇总：
1. 函数存在检查: ✅ / ❌
2. 测试数据获取: ✅ / ❌
3. 辅助函数测试: ✅ / ❌
4. 审计日志查询: ✅ / ❌
5. 乐观锁更新: ✅ / ❌ / 跳过
6. 统计查询: ✅ / ❌
7. 分配历史表: ✅ / ❌

总体结论: ___________________
发现的问题: ___________________
*/
