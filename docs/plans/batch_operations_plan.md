# 批量操作功能详细实施计划

> **开始日期**: 2025-12-12  
> **优先级**: P0  
> **预计工作量**: 2-3天  
> **目标**: 提升订单批量操作效率50%+

---

## 📊 需求背景

当前订单管理系统在批量操作方面存在以下问题：
1. **效率低**: 批量修改状态需要逐个点击，耗时长
2. **无反馈**: 批量操作无进度提示，用户不知道是否成功
3. **错误不透明**: 批量操作失败无详细错误信息
4. **功能单一**: 只能批量改状态，不能批量分配、导出

---

## 🎯 功能目标

### 1. 批量分配销售人员
**业务价值**: 销售负责人可快速重新分配订单，提升团队协作效率

**场景**:
- 销售人员离职，需批量转移订单
- 根据区域/产品类型重新分配订单
- 工作量均衡调整

### 2. 批量导出订单数据
**业务价值**: 支持数据分析和外部系统对接

**场景**:
- 导出本月订单用于财务对账
- 导出特定状态订单用于生产排程
- 导出客户订单数据用于客户关系管理

### 3. 批量操作进度提示
**业务价值**: 提升用户体验，降低操作焦虑

**场景**:
- 批量修改100+订单，需要知道进度
- 批量操作被中断，需要重试失败的订单
- 批量操作部分失败，需要查看具体原因

---

## 🏗️ 技术方案

### 方案 1: 批量分配销售人员

#### 数据库函数
```sql
-- supabase/migrations/20251212000007_batch_assign_sales.sql
CREATE OR REPLACE FUNCTION batch_assign_sales_person(
  p_order_ids uuid[],
  p_sales_person_id uuid,
  p_assigned_by_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_success_count integer := 0;
  v_failed_count integer := 0;
  v_failed_orders jsonb := '[]'::jsonb;
  v_old_sales_person_id uuid;
BEGIN
  -- 验证分配人权限（只有销售主管及以上可批量分配）
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_assigned_by_id 
    AND role IN ('sales_manager', 'admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to batch assign';
  END IF;

  -- 验证目标销售人员存在且为销售角色
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_sales_person_id 
    AND role IN ('sales', 'sales_manager')
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Invalid sales person';
  END IF;

  -- 逐个处理订单
  FOREACH v_order_id IN ARRAY p_order_ids LOOP
    BEGIN
      -- 获取当前销售人员
      SELECT sales_id INTO v_old_sales_person_id 
      FROM orders 
      WHERE id = v_order_id
      FOR UPDATE;

      IF NOT FOUND THEN
        v_failed_count := v_failed_count + 1;
        v_failed_orders := v_failed_orders || jsonb_build_object(
          'order_id', v_order_id,
          'reason', 'Order not found'
        );
        CONTINUE;
      END IF;

      -- 跳过已分配给同一人的订单
      IF v_old_sales_person_id = p_sales_person_id THEN
        v_success_count := v_success_count + 1;
        CONTINUE;
      END IF;

      -- 更新销售人员
      UPDATE orders
      SET 
        sales_id = p_sales_person_id,
        updated_at = now()
      WHERE id = v_order_id;

      -- 记录分配历史
      INSERT INTO order_assignment_history (
        order_id,
        old_assignee_id,
        new_assignee_id,
        assigned_by_id,
        assigned_at,
        reason
      ) VALUES (
        v_order_id,
        v_old_sales_person_id,
        p_sales_person_id,
        p_assigned_by_id,
        now(),
        p_reason
      );

      v_success_count := v_success_count + 1;

    EXCEPTION WHEN OTHERS THEN
      v_failed_count := v_failed_count + 1;
      v_failed_orders := v_failed_orders || jsonb_build_object(
        'order_id', v_order_id,
        'reason', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success_count', v_success_count,
    'failed_count', v_failed_count,
    'failed_orders', v_failed_orders
  );
END;
$$ LANGUAGE plpgsql;

-- 创建分配历史表
CREATE TABLE IF NOT EXISTS order_assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_assignee_id uuid REFERENCES users(id) ON DELETE SET NULL,
  new_assignee_id uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  assigned_by_id uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_assignment_history_order ON order_assignment_history(order_id);
CREATE INDEX idx_order_assignment_history_assigned_at ON order_assignment_history(assigned_at DESC);
```

#### 前端服务
```typescript
// src/services/salesOrders.client.ts
/**
 * 批量分配销售人员
 */
async batchAssignSalesPerson(
  orderIds: string[],
  salesPersonId: string,
  options?: { reason?: string }
): Promise<ServiceResponse<{
  successCount: number;
  failedCount: number;
  failedOrders: Array<{ orderId: string; reason: string }>;
}>> {
  return withErrorHandler(async () => {
    const supabase = createClient();
    
    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError('User not authenticated', 401);

    const { data, error } = await supabase.rpc('batch_assign_sales_person', {
      p_order_ids: orderIds,
      p_sales_person_id: salesPersonId,
      p_assigned_by_id: user.id,
      p_reason: options?.reason ?? null,
    });

    if (error) throw error;

    return {
      code: 0,
      message: 'success',
      data: {
        successCount: data.success_count,
        failedCount: data.failed_count,
        failedOrders: data.failed_orders,
      },
    };
  });
}
```

---

### 方案 2: 批量导出订单数据

#### 数据库函数
```sql
-- supabase/migrations/20251212000008_batch_export_orders.sql
CREATE OR REPLACE FUNCTION get_orders_for_export(
  p_order_ids uuid[],
  p_format text DEFAULT 'csv',
  p_include_fields text[] DEFAULT NULL
)
RETURNS TABLE (
  order_data jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', o.id,
      'sales_no', o.sales_no,
      'customer_name', o.customer_name,
      'customer_phone', o.customer_phone,
      'status', o.status,
      'total_amount', o.total_amount,
      'sales_person', sp.real_name,
      'created_at', o.created_at,
      'updated_at', o.updated_at
      -- 可根据 p_include_fields 动态选择字段
    ) as order_data
  FROM orders o
  LEFT JOIN users sp ON o.sales_id = sp.id
  WHERE o.id = ANY(p_order_ids)
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

#### 前端服务
```typescript
/**
 * 批量导出订单
 */
async exportOrders(
  orderIds: string[],
  format: 'csv' | 'excel' | 'pdf' = 'csv',
  options?: {
    includeFields?: string[];
    fileName?: string;
  }
): Promise<ServiceResponse<{ downloadUrl: string }>> {
  return withErrorHandler(async () => {
    const supabase = createClient();
    
    // 调用 Edge Function 处理导出
    const { data, error } = await supabase.functions.invoke('export-orders', {
      body: {
        orderIds,
        format,
        includeFields: options?.includeFields,
        fileName: options?.fileName,
      },
    });

    if (error) throw error;

    return {
      code: 0,
      message: 'success',
      data: {
        downloadUrl: data.url,
      },
    };
  });
}
```

#### Edge Function
```typescript
// supabase/functions/export-orders/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { orderIds, format, includeFields, fileName } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  // 获取订单数据
  const { data: orders } = await supabase.rpc('get_orders_for_export', {
    p_order_ids: orderIds,
    p_format: format,
    p_include_fields: includeFields
  })

  let fileContent: string | Uint8Array
  let contentType: string

  if (format === 'csv') {
    // 生成 CSV
    fileContent = generateCSV(orders)
    contentType = 'text/csv'
  } else if (format === 'excel') {
    // 生成 Excel (使用 xlsx 库)
    fileContent = generateExcel(orders)
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  } else {
    // 生成 PDF
    fileContent = generatePDF(orders)
    contentType = 'application/pdf'
  }

  // 上传到 Storage
  const filePath = `exports/${fileName || Date.now()}.${format}`
  await supabase.storage.from('order-exports').upload(filePath, fileContent)

  // 生成签名URL（1小时有效）
  const { data: { signedUrl } } = await supabase.storage
    .from('order-exports')
    .createSignedUrl(filePath, 3600)

  return new Response(JSON.stringify({ url: signedUrl }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

### 方案 3: 批量操作进度UI组件

#### React组件设计
```typescript
// src/components/BulkOperationProgress.tsx
interface BulkOperationProgressProps {
  total: number;
  current: number;
  successCount: number;
  failedCount: number;
  failedItems?: Array<{ id: string; reason: string }>;
  onCancel?: () => void;
  onRetry?: (failedIds: string[]) => void;
}

export function BulkOperationProgress({
  total,
  current,
  successCount,
  failedCount,
  failedItems = [],
  onCancel,
  onRetry,
}: BulkOperationProgressProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  const isComplete = current >= total;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] max-h-[600px] flex flex-col">
        {/* 标题 */}
        <h3 className="text-lg font-semibold mb-4">
          批量操作进行中...
        </h3>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>进度</span>
            <span>{current} / {total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{current}</div>
            <div className="text-xs text-gray-500">已处理</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-xs text-gray-500">成功</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <div className="text-xs text-gray-500">失败</div>
          </div>
        </div>

        {/* 失败列表 */}
        {failedItems.length > 0 && (
          <div className="flex-1 overflow-auto mb-4">
            <div className="text-sm font-medium mb-2">失败详情:</div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {failedItems.map((item, index) => (
                <div key={index} className="text-sm p-2 bg-red-50 rounded">
                  <div className="font-medium text-red-700">ID: {item.id}</div>
                  <div className="text-red-600">{item.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {!isComplete && onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              取消
            </button>
          )}
          {isComplete && failedItems.length > 0 && onRetry && (
            <button
              onClick={() => onRetry(failedItems.map(i => i.id))}
              className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              重试失败项
            </button>
          )}
          {isComplete && (
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 📋 实施步骤

### Step 1: 数据库准备 (0.5天)
1. ✅ 创建 `order_assignment_history` 表
2. ✅ 创建 `batch_assign_sales_person` 函数
3. ✅ 创建 `get_orders_for_export` 函数
4. ✅ 添加必要索引

### Step 2: Edge Function开发 (0.5天)
1. ✅ 创建 `export-orders` Edge Function
2. ✅ 实现 CSV/Excel/PDF 生成逻辑
3. ✅ 配置 Storage bucket

### Step 3: 前端服务层 (0.5天)
1. ✅ 更新 `salesOrders.client.ts`
2. ✅ 添加批量分配方法
3. ✅ 添加批量导出方法

### Step 4: UI组件开发 (1天)
1. ✅ 实现 `BulkOperationProgress` 组件
2. ✅ 实现 `BulkAssignSalesModal` 组件
3. ✅ 实现 `BulkExportModal` 组件

### Step 5: 集成测试 (0.5天)
1. ✅ 测试批量分配功能
2. ✅ 测试批量导出功能
3. ✅ 测试进度UI

---

## ✅ 验收标准

### 功能验收
- ✅ 可批量分配100+订单给新销售人员
- ✅ 批量分配有详细成功/失败统计
- ✅ 可导出订单为CSV/Excel/PDF
- ✅ 导出文件格式正确，数据完整
- ✅ 批量操作有实时进度显示
- ✅ 失败订单可单独重试

### 性能验收
- ✅ 批量分配100订单 < 5秒
- ✅ 批量导出1000订单 < 30秒
- ✅ UI进度更新流畅，无卡顿

### 用户体验验收
- ✅ 操作流程清晰，不超过3步
- ✅ 错误提示明确，用户知道如何修复
- ✅ 进度反馈及时，用户有掌控感

---

**计划制定**: 2025-12-12  
**预计开始**: Day 2  
**预计完成**: Day 3
