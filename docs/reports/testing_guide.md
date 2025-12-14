# 批量操作功能验证测试指南

> **测试环境**: 生产环境  
> **测试时间**: 2025-12-13 10:12  
> **部署状态**: ✅ 100%完成

---

## ✅ 部署完成确认

| 组件 | 状态 | 验证 |
|------|------|------|
| 数据库迁移 | ✅ | 3个迁移已applied |
| Edge Function | ✅ | export-orders已部署 |
| Storage Bucket | ✅ | order-exports已创建 |

---

## 🧪 测试步骤

### 第一步：数据库函数测试

在Supabase SQL Editor中运行：

#### 1. 测试乐观锁功能
```sql
-- 获取一个真实订单ID进行测试
SELECT id, status, version FROM orders LIMIT 1;

-- 假设得到: id='abc123', status='draft_signed', version=1

-- 测试更新（应该成功）
SELECT update_order_status_v2(
  'abc123'::uuid,
  'pending_measurement',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  1,  -- 正确的version
  '测试部署 - 乐观锁正常'
);

-- 应返回: {"success": true, "newVersion": 2, ...}

-- 再次用旧version测试（应该失败）
SELECT update_order_status_v2(
  'abc123'::uuid,
  'shipped',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  1,  -- 旧version，应该冲突
  '测试部署 - 乐观锁冲突检测'
);

-- 应返回错误: "Optimistic lock failed"
```

#### 2. 测试批量分配
```sql
-- 获取测试订单和销售人员
SELECT id FROM orders WHERE status = 'draft_signed' LIMIT 2;
SELECT id FROM users WHERE role IN ('sales_manager', 'sales') LIMIT 1;

-- 批量分配
SELECT batch_assign_sales_person(
  ARRAY[
    '<order-id-1>'::uuid,
    '<order-id-2>'::uuid
  ],
  '<sales-person-id>'::uuid,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);

-- 应返回: {"success": true, "successCount": 2, "failedCount": 0, ...}
```

#### 3. 测试审计日志
```sql
-- 查询订单状态历史
SELECT * FROM get_order_status_history_enhanced(
  '<order-id>'::uuid,
  0,
  10
);

-- 查询订单统计
SELECT * FROM get_order_status_statistics('<order-id>'::uuid);

-- 查询时间线（用于可视化）
SELECT * FROM get_order_status_timeline('<order-id>'::uuid);
```

#### 4. 测试分配历史
```sql
-- 查询分配历史
SELECT * FROM get_order_assignment_history('<order-id>'::uuid);

-- 查询销售人员统计
SELECT * FROM get_sales_person_assignment_stats(
  '<sales-person-id>'::uuid,
  NULL,
  NULL
);
```

---

### 第二步：Edge Function测试

#### 使用curl测试导出功能

```bash
# 测试CSV导出
curl -X POST \
  https://rdpiajialjnmngnaokix.supabase.co/functions/v1/export-orders \
  -H "Authorization: Bearer sb_secret_5k6RlR3PqftG29R-yakSGg_z1w-JGHs" \
  -H "Content-Type: application/json" \
  -d '{
    "orderIds": ["<order-id-1>", "<order-id-2>"],
    "format": "csv",
    "fileName": "test_export.csv"
  }'

# 应返回:
# {
#   "success": true,
#   "url": "https://...",
#   "fileName": "test_export.csv",
#   "recordCount": 2
# }
```

#### 验证文件
1. 点击返回的URL，应该能下载CSV文件
2. 用Excel打开，检查：
   - ✅ 中文显示正常（UTF-8 BOM）
   - ✅ 表头为中文
   - ✅ 数据完整

---

### 第三步：前端服务测试

#### 在浏览器开发者工具Console中运行：

```typescript
// 1. 测试批量分配
const assignResult = await fetch('/api/orders/batch-assign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderIds: ['<order-id-1>', '<order-id-2>'],
    salesPersonId: '<sales-person-id>'
  })
}).then(r => r.json())

console.log('批量分配结果:', assignResult)
// 应显示: { success: true, successCount: 2, ... }

// 2. 测试导出
const exportResult = await fetch('/api/orders/export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderIds: ['<order-id>'],
    format: 'csv'
  })
}).then(r => r.json())

console.log('导出结果:', exportResult)
// 应显示: { downloadUrl: "https://...", fileName: "...", ... }

// 3. 测试审计日志
const auditResult = await fetch('/api/orders/<order-id>/audit-log')
  .then(r => r.json())

console.log('审计日志:', auditResult)
```

---

### 第四步：UI组件测试

#### BulkOperationProgress 组件测试

**测试页面**: 创建测试页面 `/test-bulk-ui`

```typescript
// pages/test-bulk-ui.tsx
'use client'

import { useState } from 'react'
import { BulkOperationProgress } from '@/components/ui/bulk-operation-progress'
import { PaperButton } from '@/components/ui/paper-button'

export default function TestBulkUI() {
  const [progress, setProgress] = useState({
    isOpen: false,
    total: 10,
    current: 0,
    successCount: 0,
    failedCount: 0,
    failedItems: [],
  })

  const simulateProgress = () => {
    setProgress(prev => ({ ...prev, isOpen: true, current: 0 }))
    
    let current = 0
    const interval = setInterval(() => {
      current++
      const success = Math.random() > 0.2
      
      setProgress(prev => ({
        ...prev,
        current,
        successCount: success ? prev.successCount + 1 : prev.successCount,
        failedCount: !success ? prev.failedCount + 1 : prev.failedCount,
        failedItems: !success ? [
          ...prev.failedItems,
          { id: `order-${current}`, name: `订单 ${current}`, reason: '测试失败' }
        ] : prev.failedItems,
      }))
      
      if (current >= 10) clearInterval(interval)
    }, 500)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">批量操作UI测试</h1>
      <PaperButton onClick={simulateProgress}>
        开始模拟批量操作
      </PaperButton>
      
      <BulkOperationProgress
        {...progress}
        title="批量分配销售人员"
        onClose={() => setProgress(prev => ({ ...prev, isOpen: false }))}
        onRetry={(ids) => console.log('重试:', ids)}
      />
    </div>
  )
}
```

**测试检查**:
- [ ] 进度条平滑动画
- [ ] 数字滚动显示
- [ ] 失败列表展开动画
- [ ] 重试按钮功能
- [ ] 完成动画（全部成功时）

---

## 📋 验收清单

### 数据库功能
- [ ] 乐观锁正常工作
- [ ] 批量分配权限验证正确
- [ ] 审计日志记录完整
- [ ] 分配历史可查询

### Edge Function
- [ ] CSV导出成功
- [ ] 文件上传到Storage
- [ ] 签名URL可下载
- [ ] 中文显示正常

### 前端集成
- [ ] API调用成功
- [ ] 进度UI显示正常
- [ ] 重试功能可用
- [ ] 错误提示清晰

---

## 🐛 常见问题排查

### 问题1: Edge Function调用失败
**错误**: `unauthorized` 或 `403`

**解决**:
```typescript
// 确认前端使用正确的API Key
const { data } = await supabase.functions.invoke('export-orders', {
  body: { ... }
})
```

### 问题2: Storage上传失败
**错误**: `Bucket not found`

**解决**:
1. 确认bucket名称: `order-exports`
2. 确认bucket为Public
3. 检查RLS策略

### 问题3: 乐观锁冲突
**错误**: `Optimistic lock failed`

**说明**: 这是正常的并发保护机制

**处理**: 前端应提示用户刷新后重试

---

## 📊 性能测试

### 批量操作性能
```sql
-- 测试100个订单批量分配（应<5秒）
SELECT batch_assign_sales_person(
  (SELECT array_agg(id) FROM orders WHERE status = 'draft_signed' LIMIT 100),
  '<sales-person-id>'::uuid,
  '<admin-id>'::uuid
);
```

### 导出性能
```bash
# 测试1000个订单导出（应<30秒）
time curl -X POST ... -d '{"orderIds": [...]}'
```

---

**测试负责人**: 来长城  
**完成时间**: 2025-12-13 10:30（预计）
