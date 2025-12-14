# 批量操作功能快速验证指南

> **验证时间**: 2025-12-13 12:00  
> **预计时间**: 20分钟  
> **环境**: 生产环境

---

## 🎯 验证目标

快速验证3个核心功能：
1. ✅ 数据库函数已部署
2. ✅ Edge Function工作正常
3. ✅ 前端可以调用

---

## 📋 验证步骤

### Step 1: 验证数据库函数存在 (3分钟)

访问: https://supabase.com/dashboard/project/rdpiajialjnmngnaokix/editor

执行以下SQL检查函数是否存在：

```sql
-- 检查新增的函数
SELECT routine_name 
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
  );
```

**预期结果**: 应该返回9个函数名

**实际结果**: ✅ / ❌

---

### Step 2: 简单功能测试 (5分钟)

```sql
-- 2.1 获取一个测试订单
SELECT id, status, version FROM orders LIMIT 1;

-- 记录订单ID和当前version
-- order_id = _______________
-- version = _______________

-- 2.2 测试获取允许的下一状态
SELECT * FROM get_allowed_next_statuses('<当前status>');

-- 预期：返回允许的状态列表
-- 实际：✅ / ❌

-- 2.3 查看订单历史（如果有）
SELECT * FROM get_order_status_history_enhanced(
  '<order_id>'::uuid,
  0,
  5
);

-- 预期：返回历史记录
-- 实际：✅ / ❌
```

---

### Step 3: 验证Edge Function (5分钟)

在终端执行（需替换order_id）：

```bash
curl -X POST \
  https://rdpiajialjnmngnaokix.supabase.co/functions/v1/export-orders \
  -H "Authorization: Bearer sb_secret_5k6RlR3PqftG29R-yakSGg_z1w-JGHs" \
  -H "Content-Type: application/json" \
  -d '{
    "orderIds": ["替换为真实订单ID"],
    "format": "csv"
  }'
```

**预期返回**:
```json
{
  "success": true,
  "url": "https://...",
  "fileName": "...",
  "recordCount": 1
}
```

**实际结果**: ✅ / ❌

---

### Step 4: 检查Storage Bucket (2分钟)

访问: https://supabase.com/dashboard/project/rdpiajialjnmngnaokix/storage/buckets

**检查项**:
- [ ] order-exports bucket存在
- [ ] bucket为Public
- [ ] 如果执行了Step 3，应该能看到导出的文件

---

### Step 5: 前端代码检查 (5分钟)

检查前端服务文件：

```bash
cd ~/Documents/文稿\ -\ 来长城的MacBook\ Air/trae/L2C/slideboard-frontend

# 检查是否有新增的方法
grep -n "batchAssignSalesPerson\|exportOrders\|updateSalesOrderStatusV2" src/services/salesOrders.client.ts
```

**预期**: 找到这些方法的定义

**实际**: ✅ / ❌

---

## ✅ 快速验收

| 验证项 | 状态 | 备注 |
|--------|------|------|
| 数据库函数存在 | ⬜ | 9个函数 |
| 函数可以调用 | ⬜ | SQL测试成功 |
| Edge Function部署 | ⬜ | curl返回成功 |
| Storage bucket创建 | ⬜ | 可见order-exports |
| 前端代码已更新 | ⬜ | 方法已添加 |

---

## 🎯 简化结论

如果以上5步都通过：
- ✅ **部署成功**，可以开始UI集成
- ⚠️ **部署部分成功**，记录失败项
- ❌ **部署失败**，需要排查问题

---

## 📝 快速记录

**验证人**: 来长城  
**验证时间**: 2025-12-13 ____  
**总体状态**: ✅ 成功 / ⚠️ 部分成功 / ❌ 失败  
**问题**: _________________

---

## 🚀 下一步

如果验证通过：
1. 今天结束，明天继续UI集成
2. 或者现在就开始UI集成（docs/plans/next_steps_plan.md Day 4任务）

如果有问题：
1. 记录问题详情
2. 我协助排查和修复
