# 订单模块数据库迁移指南

**版本**: v1.0  
**创建时间**: 2026-01-16  
**基于文档**: [订单模块整改计划_20260116.md](../02-requirements/modules/订单/订单模块整改计划_20260116.md)  
**目标读者**: 后端开发、DBA、运维人员

---

## 📋 目录

1. [迁移概述](#1-迁移概述)
2. [Schema变更详解](#2-schema变更详解)
3. [迁移脚本](#3-迁移脚本)
4. [回滚方案](#4-回滚方案)
5. [数据完整性验证](#5-数据完整性验证)
6. [性能优化](#6-性能优化)
7. [上线步骤](#7-上线步骤)

---

## 1. 迁移概述

### 1.1 迁移目标

本次迁移旨在完成订单模块的Schema增强,支持以下核心功能:
- 订单快照机制
- 变更单流程
- 智能拆单
- 发货与物流
- 叫停机制

### 1.2 迁移范围

**涉及表**:
- `orders` - 订单主表
- `order_items` - 订单明细表
- `change_requests` - 变更单表(新建)

**影响数据**:
- 现有订单数据
- 订单明细数据
- 报价单数据(通过外键关联)

### 1.3 迁移风险评估

| 风险项 | 风险等级 | 缓解措施 |
|:---|:---:|:---|
| 数据丢失 | 🔴 高 | 备份数据库,测试回滚脚本 |
| 性能影响 | 🟡 中 | 选择低峰期执行,分批迁移 |
| 兼容性问题 | 🟡 中 | 先在测试环境验证 |
| 回滚失败 | 🔴 高 | 准备详细回滚步骤 |

### 1.4 迁移时间估算

| 阶段 | 预计时间 | 说明 |
|:---|:---:|:---|
| 准备工作 | 0.5天 | 备份、测试环境验证 |
| 执行迁移 | 0.5天 | 实际执行迁移脚本 |
| 数据验证 | 0.5天 | 验证数据完整性 |
| 应用部署 | 0.5天 | 部署新版本代码 |
| **总计** | **2天** | - |

---

## 2. Schema变更详解

### 2.1 订单主表(orders)变更

#### 2.1.1 新增字段

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|:---|:---:|:---:|:---:|:---|
| `snapshot_data` | JSONB | ✓ | `'{}'` | 订单快照数据 |
| `halted_reason` | TEXT | - | NULL | 叫停原因 |
| `halted_at` | TIMESTAMP | - | NULL | 叫停时间 |
| `cancel_reason` | TEXT | - | NULL | 撤单原因 |
| `cancelled_by` | UUID | - | NULL | 撤单人ID |
| `cancelled_at` | TIMESTAMP | - | NULL | 撤单时间 |
| `locked_by` | UUID | - | NULL | 锁定人ID |
| `confirmation_deadline` | TIMESTAMP | - | NULL | 深化图确认截止时间 |

#### 2.1.2 OrderStatus枚举扩展

**原枚举**(8个状态):
```sql
CREATE TYPE order_status AS ENUM (
  'PENDING_PO',
  'PENDING_PRODUCTION',
  'PENDING_DELIVERY',
  'PENDING_SHIPMENT',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED'
);
```

**新枚举**(10个状态):
```sql
CREATE TYPE order_status AS ENUM (
  'PENDING_CONFIRMATION',  -- 新增
  'PENDING_PO',
  'PENDING_PRODUCTION',
  'PENDING_DELIVERY',
  'PENDING_SHIPMENT',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'HALTED',  -- 新增
  'CANCELLED'
);
```

**新增状态说明**:
- `PENDING_CONFIRMATION`: 待确认深化图(设计师上传深化图后)
- `HALTED`: 已叫停(订单暂停生产)

#### 2.1.3 快照数据结构

`snapshot_data`字段存储订单创建时的快照,包含:
- 报价单完整数据(含Items)
- 客户基础信息
- 快照时间戳

**JSON结构示例**:
```json
{
  "quote": {
    "id": "uuid",
    "quoteNo": "QT20260115001",
    "versionId": "uuid",
    "totalAmount": 10000.00,
    "hasDeepDesign": true,
    "createdAt": "2026-01-15T10:00:00Z",
    "items": [
      {
        "id": "uuid",
        "roomName": "客厅",
        "productId": "uuid",
        "productName": "梦幻帘",
        "category": "CURTAIN",
        "unitPrice": 300.00,
        "quantity": 2.00,
        "width": 2.50,
        "height": 2.80,
        "subtotal": 600.00
      }
    ]
  },
  "customer": {
    "id": "uuid",
    "name": "张三",
    "phone": "13800138000",
    "address": "北京市朝阳区XXX小区"
  },
  "snapshotTime": "2026-01-16T10:00:00Z"
}
```

### 2.2 订单明细表(order_items)变更

#### 2.2.1 新增字段

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|:---|:---:|:---:|:---:|:---|
| `supplier_id` | UUID | - | NULL | 供应商ID |
| `purchase_order_id` | UUID | - | NULL | 采购单ID |
| `delivery_status` | TEXT | - | 'PENDING' | 交付状态 |
| `delivered_at` | TIMESTAMP | - | NULL | 送达时间 |

#### 2.2.2 外键约束

```sql
ALTER TABLE order_items 
  ADD CONSTRAINT fk_order_items_supplier 
  FOREIGN KEY (supplier_id) 
  REFERENCES suppliers(id) 
  ON DELETE SET NULL;

ALTER TABLE order_items 
  ADD CONSTRAINT fk_order_items_purchase_order 
  FOREIGN KEY (purchase_order_id) 
  REFERENCES purchase_orders(id) 
  ON DELETE SET NULL;
```

#### 2.2.3 delivery_status枚举

**可选值**:
- `PENDING`: 待发货
- `SHIPPED`: 已发货
- `DELIVERED`: 已送达

### 2.3 变更单表(change_requests)新建

#### 2.3.1 表结构

```sql
CREATE TABLE change_requests (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 租户和订单关联
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- 变更信息
  change_type TEXT NOT NULL CHECK (change_type IN ('ADD_ITEM', 'REMOVE_ITEM', 'MODIFY_ITEM')),
  change_reason TEXT NOT NULL,
  original_items JSONB NOT NULL,
  new_items JSONB NOT NULL,
  price_difference DECIMAL(10,2),
  
  -- 审批信息
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- 审计字段
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 2.3.2 字段说明

| 字段名 | 类型 | 必填 | 说明 |
|:---|:---:|:---:|:---|
| `id` | UUID | ✓ | 主键 |
| `tenant_id` | UUID | ✓ | 租户ID |
| `order_id` | UUID | ✓ | 订单ID |
| `change_type` | TEXT | ✓ | 变更类型(ADD_ITEM/REMOVE_ITEM/MODIFY_ITEM) |
| `change_reason` | TEXT | ✓ | 变更原因 |
| `original_items` | JSONB | ✓ | 原始商品列表 |
| `new_items` | JSONB | ✓ | 新商品列表 |
| `price_difference` | DECIMAL(10,2) | - | 差价(正数=补差价,负数=退差价) |
| `status` | TEXT | ✓ | 状态(PENDING/APPROVED/REJECTED) |
| `approved_by` | UUID | - | 审批人ID |
| `approved_at` | TIMESTAMP | - | 审批时间 |
| `rejected_by` | UUID | - | 拒绝人ID |
| `rejected_at` | TIMESTAMP | - | 拒绝时间 |
| `rejection_reason` | TEXT | - | 拒绝原因 |
| `created_by` | UUID | ✓ | 创建人ID |
| `created_at` | TIMESTAMP | ✓ | 创建时间 |
| `updated_at` | TIMESTAMP | ✓ | 更新时间 |

#### 2.3.3 索引

```sql
-- 订单ID索引
CREATE INDEX idx_change_requests_order_id ON change_requests(order_id);

-- 状态索引
CREATE INDEX idx_change_requests_status ON change_requests(status);

-- 租户ID索引
CREATE INDEX idx_change_requests_tenant_id ON change_requests(tenant_id);

-- 复合索引(租户+状态)
CREATE INDEX idx_change_requests_tenant_status ON change_requests(tenant_id, status);
```

---

## 3. 迁移脚本

### 3.1 完整迁移脚本

**文件**: `drizzle/migrations/20260116_order_module_enhancement.sql`

```sql
-- ============================================
-- 订单模块增强迁移脚本
-- 版本: 20260116
-- 作者: 后端开发团队
-- 说明: 支持订单快照、变更单、拆单、发货、叫停功能
-- ============================================

BEGIN;

-- ============================================
-- 1. 扩展OrderStatus枚举
-- ============================================

-- 创建新枚举类型
CREATE TYPE order_status_new AS ENUM (
  'PENDING_CONFIRMATION',
  'PENDING_PO',
  'PENDING_PRODUCTION',
  'PENDING_DELIVERY',
  'PENDING_SHIPMENT',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'HALTED',
  'CANCELLED'
);

-- 迁移现有数据
ALTER TABLE orders 
  ALTER COLUMN status TYPE order_status_new 
  USING status::text::order_status_new;

-- 删除旧枚举
DROP TYPE order_status;

-- 重命名新枚举
ALTER TYPE order_status_new RENAME TO order_status;

-- ============================================
-- 2. 订单主表新增字段
-- ============================================

-- 快照数据
ALTER TABLE orders 
  ADD COLUMN snapshot_data JSONB NOT NULL DEFAULT '{}';

-- 叫停相关
ALTER TABLE orders 
  ADD COLUMN halted_reason TEXT;

ALTER TABLE orders 
  ADD COLUMN halted_at TIMESTAMP;

-- 撤单相关
ALTER TABLE orders 
  ADD COLUMN cancel_reason TEXT;

ALTER TABLE orders 
  ADD COLUMN cancelled_by UUID REFERENCES users(id);

ALTER TABLE orders 
  ADD COLUMN cancelled_at TIMESTAMP;

-- 锁定相关
ALTER TABLE orders 
  ADD COLUMN locked_by UUID REFERENCES users(id);

-- 深化图确认
ALTER TABLE orders 
  ADD COLUMN confirmation_deadline TIMESTAMP;

-- ============================================
-- 3. 订单明细表新增字段
-- ============================================

-- 供应商和采购单关联
ALTER TABLE order_items 
  ADD COLUMN supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE order_items 
  ADD COLUMN purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL;

-- 交付状态
ALTER TABLE order_items 
  ADD COLUMN delivery_status TEXT DEFAULT 'PENDING' 
  CHECK (delivery_status IN ('PENDING', 'SHIPPED', 'DELIVERED'));

ALTER TABLE order_items 
  ADD COLUMN delivered_at TIMESTAMP;

-- ============================================
-- 4. 创建变更单表
-- ============================================

CREATE TABLE change_requests (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 租户和订单关联
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- 变更信息
  change_type TEXT NOT NULL CHECK (change_type IN ('ADD_ITEM', 'REMOVE_ITEM', 'MODIFY_ITEM')),
  change_reason TEXT NOT NULL,
  original_items JSONB NOT NULL,
  new_items JSONB NOT NULL,
  price_difference DECIMAL(10,2),
  
  -- 审批信息
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- 审计字段
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- 5. 创建索引
-- ============================================

-- 订单表索引
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);

-- 订单明细表索引
CREATE INDEX idx_order_items_supplier_id ON order_items(supplier_id);
CREATE INDEX idx_order_items_po_id ON order_items(purchase_order_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 变更单表索引
CREATE INDEX idx_change_requests_order_id ON change_requests(order_id);
CREATE INDEX idx_change_requests_status ON change_requests(status);
CREATE INDEX idx_change_requests_tenant_id ON change_requests(tenant_id);
CREATE INDEX idx_change_requests_tenant_status ON change_requests(tenant_id, status);

-- ============================================
-- 6. 创建触发器自动更新updated_at
-- ============================================

-- 创建触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用到change_requests表
CREATE TRIGGER update_change_requests_updated_at 
  BEFORE UPDATE ON change_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. 数据迁移: 为现有订单生成快照
-- ============================================

-- 为现有订单生成快照数据
UPDATE orders o
SET snapshot_data = jsonb_build_object(
  'quote', jsonb_build_object(
    'id', q.id,
    'quoteNo', q.quote_no,
    'versionId', q.version_id,
    'totalAmount', q.total_amount,
    'hasDeepDesign', q.has_deep_design,
    'createdAt', q.created_at
  ),
  'customer', jsonb_build_object(
    'id', q.customer_id,
    'name', q.customer_name,
    'phone', q.customer_phone,
    'address', q.delivery_address
  ),
  'snapshotTime', o.created_at
)
FROM quotes q
WHERE o.quote_id = q.id
AND o.snapshot_data = '{}';

-- ============================================
-- 8. 添加注释
-- ============================================

-- 订单表注释
COMMENT ON COLUMN orders.snapshot_data IS '订单快照数据,包含报价单和客户信息';
COMMENT ON COLUMN orders.halted_reason IS '叫停原因';
COMMENT ON COLUMN orders.halted_at IS '叫停时间';
COMMENT ON COLUMN orders.cancel_reason IS '撤单原因';
COMMENT ON COLUMN orders.cancelled_by IS '撤单人ID';
COMMENT ON COLUMN orders.cancelled_at IS '撤单时间';
COMMENT ON COLUMN orders.locked_by IS '锁定人ID';
COMMENT ON COLUMN orders.confirmation_deadline IS '深化图确认截止时间';

-- 订单明细表注释
COMMENT ON COLUMN order_items.supplier_id IS '供应商ID';
COMMENT ON COLUMN order_items.purchase_order_id IS '采购单ID';
COMMENT ON COLUMN order_items.delivery_status IS '交付状态(PENDING/SHIPPED/DELIVERED)';
COMMENT ON COLUMN order_items.delivered_at IS '送达时间';

-- 变更单表注释
COMMENT ON TABLE change_requests IS '订单变更请求表';
COMMENT ON COLUMN change_requests.change_type IS '变更类型(ADD_ITEM/REMOVE_ITEM/MODIFY_ITEM)';
COMMENT ON COLUMN change_requests.change_reason IS '变更原因';
COMMENT ON COLUMN change_requests.original_items IS '原始商品列表(JSON)';
COMMENT ON COLUMN change_requests.new_items IS '新商品列表(JSON)';
COMMENT ON COLUMN change_requests.price_difference IS '差价(正数=补差价,负数=退差价)';
COMMENT ON COLUMN change_requests.status IS '状态(PENDING/APPROVED/REJECTED)';

COMMIT;

-- ============================================
-- 迁移完成
-- ============================================
```

### 3.2 迁移前检查清单

- [ ] 数据库已备份(全量备份)
- [ ] 测试环境已验证迁移脚本
- [ ] 应用代码已准备好新Schema
- [ ] 迁移时间窗口已确认(建议凌晨2-4点)
- [ ] 回滚脚本已准备
- [ ] 监控工具已就绪
- [ ] 相关人员已通知

### 3.3 迁移执行步骤

1. **备份生产数据库**
   ```bash
   pg_dump -h localhost -U postgres -d l2c_prod > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **停止应用服务**
   ```bash
   # 停止所有应用实例
   systemctl stop l2c-app
   ```

3. **执行迁移脚本**
   ```bash
   psql -h localhost -U postgres -d l2c_prod -f 20260116_order_module_enhancement.sql
   ```

4. **验证迁移结果**
   ```sql
   -- 检查新字段是否存在
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'orders' 
   AND column_name IN ('snapshot_data', 'halted_reason', 'cancel_reason');
   
   -- 检查新表是否创建
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'change_requests';
   
   -- 检查索引是否创建
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename IN ('orders', 'order_items', 'change_requests');
   ```

5. **启动应用服务**
   ```bash
   systemctl start l2c-app
   ```

6. **监控应用日志**
   ```bash
   tail -f /var/log/l2c-app/app.log
   ```

---

## 4. 回滚方案

### 4.1 回滚脚本

**文件**: `drizzle/migrations/20260116_order_module_enhancement_rollback.sql`

```sql
-- ============================================
-- 订单模块增强回滚脚本
-- 版本: 20260116
-- 说明: 回滚订单模块增强的所有变更
-- ============================================

BEGIN;

-- ============================================
-- 1. 删除触发器
-- ============================================

DROP TRIGGER IF EXISTS update_change_requests_updated_at ON change_requests;

-- ============================================
-- 2. 删除索引
-- ============================================

-- 变更单表索引
DROP INDEX IF EXISTS idx_change_requests_tenant_status;
DROP INDEX IF EXISTS idx_change_requests_tenant_id;
DROP INDEX IF EXISTS idx_change_requests_status;
DROP INDEX IF EXISTS idx_change_requests_order_id;

-- 订单明细表索引
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_po_id;
DROP INDEX IF EXISTS idx_order_items_supplier_id;

-- 订单表索引
DROP INDEX IF EXISTS idx_orders_tenant_id;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_orders_customer_id;
DROP INDEX IF EXISTS idx_orders_status;

-- ============================================
-- 3. 删除变更单表
-- ============================================

DROP TABLE IF EXISTS change_requests;

-- ============================================
-- 4. 删除订单明细表新增字段
-- ============================================

ALTER TABLE order_items DROP COLUMN IF EXISTS delivered_at;
ALTER TABLE order_items DROP COLUMN IF EXISTS delivery_status;
ALTER TABLE order_items DROP COLUMN IF EXISTS purchase_order_id;
ALTER TABLE order_items DROP COLUMN IF EXISTS supplier_id;

-- ============================================
-- 5. 删除订单主表新增字段
-- ============================================

ALTER TABLE orders DROP COLUMN IF EXISTS confirmation_deadline;
ALTER TABLE orders DROP COLUMN IF EXISTS locked_by;
ALTER TABLE orders DROP COLUMN IF EXISTS cancelled_at;
ALTER TABLE orders DROP COLUMN IF EXISTS cancelled_by;
ALTER TABLE orders DROP COLUMN IF EXISTS cancel_reason;
ALTER TABLE orders DROP COLUMN IF EXISTS halted_at;
ALTER TABLE orders DROP COLUMN IF EXISTS halted_reason;
ALTER TABLE orders DROP COLUMN IF EXISTS snapshot_data;

-- ============================================
-- 6. 恢复OrderStatus枚举
-- ============================================

-- 创建旧枚举类型
CREATE TYPE order_status_old AS ENUM (
  'PENDING_PO',
  'PENDING_PRODUCTION',
  'PENDING_DELIVERY',
  'PENDING_SHIPMENT',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED'
);

-- 迁移数据(将PENDING_CONFIRMATION和HALTED转为PENDING_PO)
ALTER TABLE orders 
  ALTER COLUMN status TYPE order_status_old 
  USING CASE 
    WHEN status::text = 'PENDING_CONFIRMATION' THEN 'PENDING_PO'::order_status_old
    WHEN status::text = 'HALTED' THEN 'PENDING_PO'::order_status_old
    ELSE status::text::order_status_old
  END;

-- 删除新枚举
DROP TYPE order_status;

-- 重命名旧枚举
ALTER TYPE order_status_old RENAME TO order_status;

-- ============================================
-- 7. 删除触发器函数
-- ============================================

DROP FUNCTION IF EXISTS update_updated_at_column();

COMMIT;

-- ============================================
-- 回滚完成
-- ============================================
```

### 4.2 回滚触发条件

出现以下情况时考虑回滚:
- 迁移脚本执行失败
- 数据完整性验证失败
- 应用启动后出现大量错误
- 性能严重劣化(>50%)
- 关键功能不可用

### 4.3 回滚执行步骤

1. **停止应用服务**
   ```bash
   systemctl stop l2c-app
   ```

2. **执行回滚脚本**
   ```bash
   psql -h localhost -U postgres -d l2c_prod -f 20260116_order_module_enhancement_rollback.sql
   ```

3. **验证回滚结果**
   ```sql
   -- 检查新字段是否已删除
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'orders' 
   AND column_name IN ('snapshot_data', 'halted_reason');
   
   -- 检查新表是否已删除
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'change_requests';
   ```

4. **恢复应用代码到上一版本**
   ```bash
   git checkout <previous-version-tag>
   ```

5. **启动应用服务**
   ```bash
   systemctl start l2c-app
   ```

---

## 5. 数据完整性验证

### 5.1 验证SQL脚本

**文件**: `drizzle/migrations/20260116_order_module_validation.sql`

```sql
-- ============================================
-- 数据完整性验证脚本
-- ============================================

-- 1. 验证订单表新字段
SELECT 
  COUNT(*) AS total_orders,
  COUNT(snapshot_data) AS orders_with_snapshot,
  COUNT(*) - COUNT(snapshot_data) AS orders_without_snapshot
FROM orders;

-- 2. 验证快照数据完整性
SELECT 
  COUNT(*) AS total_orders,
  COUNT(CASE WHEN snapshot_data->>'quote' IS NOT NULL THEN 1 END) AS orders_with_quote_snapshot,
  COUNT(CASE WHEN snapshot_data->>'customer' IS NOT NULL THEN 1 END) AS orders_with_customer_snapshot
FROM orders
WHERE snapshot_data != '{}';

-- 3. 验证订单明细表新字段
SELECT 
  COUNT(*) AS total_items,
  COUNT(supplier_id) AS items_with_supplier,
  COUNT(purchase_order_id) AS items_with_po
FROM order_items;

-- 4. 验证外键约束
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('orders', 'order_items', 'change_requests')
  AND tc.constraint_type = 'FOREIGN KEY';

-- 5. 验证索引
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('orders', 'order_items', 'change_requests')
ORDER BY tablename, indexname;

-- 6. 验证枚举类型
SELECT 
  typname AS type_name,
  enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'order_status'
ORDER BY enumsortorder;

-- 7. 验证触发器
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'change_requests';

-- 8. 验证数据量
SELECT 
  'orders' AS table_name,
  COUNT(*) AS row_count
FROM orders
UNION ALL
SELECT 
  'order_items' AS table_name,
  COUNT(*) AS row_count
FROM order_items
UNION ALL
SELECT 
  'change_requests' AS table_name,
  COUNT(*) AS row_count
FROM change_requests;
```

### 5.2 验收标准

**Schema验证**:
- [ ] 所有新字段已创建
- [ ] 所有新表已创建
- [ ] 所有外键约束正确
- [ ] 所有索引已创建
- [ ] 所有触发器已创建

**数据验证**:
- [ ] 现有订单数据未丢失
- [ ] 快照数据已生成(对于现有订单)
- [ ] 外键关联正确
- [ ] 数据量与迁移前一致

**功能验证**:
- [ ] 应用启动正常
- [ ] 订单列表查询正常
- [ ] 订单详情查询正常
- [ ] 创建订单正常
- [ ] 变更单功能正常

---

## 6. 性能优化

### 6.1 索引优化建议

**高频查询索引**:
```sql
-- 订单列表查询(按状态+创建时间)
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);

-- 订单列表查询(按客户+状态)
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);

-- 订单明细查询(按订单+供应商)
CREATE INDEX idx_order_items_order_supplier ON order_items(order_id, supplier_id);

-- 变更单查询(按订单+状态)
CREATE INDEX idx_change_requests_order_status ON change_requests(order_id, status);
```

### 6.2 查询优化建议

**使用索引的查询**:
```sql
-- ✅ 使用索引
SELECT * FROM orders 
WHERE status = 'PENDING_PO' 
AND created_at >= '2026-01-01'
ORDER BY created_at DESC;

-- ❌ 不使用索引(函数)
SELECT * FROM orders 
WHERE DATE(created_at) = '2026-01-16';

-- ✅ 使用索引(改写)
SELECT * FROM orders 
WHERE created_at >= '2026-01-16' 
AND created_at < '2026-01-17';
```

### 6.3 JSONB字段优化

**使用GIN索引加速JSONB查询**:
```sql
-- 为snapshot_data创建GIN索引
CREATE INDEX idx_orders_snapshot_data ON orders USING GIN (snapshot_data);

-- 查询示例
SELECT * FROM orders 
WHERE snapshot_data @> '{"quote": {"hasDeepDesign": true}}';
```

### 6.4 分区表建议

**按时间分区**(适用于大数据量):
```sql
-- 创建分区表
CREATE TABLE orders_2026_01 PARTITION OF orders
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE orders_2026_02 PARTITION OF orders
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

---

## 7. 上线步骤

### 7.1 上线前准备

**Day -7**:
- [ ] 完成迁移脚本开发
- [ ] 测试环境验证迁移脚本
- [ ] 完成应用代码开发
- [ ] 完成单元测试和集成测试

**Day -3**:
- [ ] 预演上线流程
- [ ] 准备回滚方案
- [ ] 通知相关方(产品、运维、客服)
- [ ] 准备监控工具

**Day -1**:
- [ ] 确认上线时间窗口
- [ ] 准备数据库备份
- [ ] 准备应用代码发布包
- [ ] 准备上线检查清单

### 7.2 上线执行

**Step 1: 数据库备份**(T-30分钟)
```bash
pg_dump -h localhost -U postgres -d l2c_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Step 2: 停止应用服务**(T-5分钟)
```bash
# 停止所有应用实例
kubectl scale deployment l2c-app --replicas=0
```

**Step 3: 执行迁移脚本**(T)
```bash
psql -h localhost -U postgres -d l2c_prod -f 20260116_order_module_enhancement.sql
```

**Step 4: 验证迁移结果**(T+5分钟)
```bash
psql -h localhost -U postgres -d l2c_prod -f 20260116_order_module_validation.sql
```

**Step 5: 部署新版本应用**(T+10分钟)
```bash
# 部署新版本代码
kubectl set image deployment/l2c-app l2c-app=registry.example.com/l2c-app:v1.2.0
```

**Step 6: 启动应用服务**(T+15分钟)
```bash
kubectl scale deployment l2c-app --replicas=3
```

**Step 7: 监控应用状态**(T+20分钟)
```bash
# 检查Pod状态
kubectl get pods -l app=l2c-app

# 查看应用日志
kubectl logs -f deployment/l2c-app
```

**Step 8: 功能验证**(T+30分钟)
- [ ] 订单列表查询正常
- [ ] 订单详情查询正常
- [ ] 创建订单正常
- [ ] 变更单功能正常
- [ ] 拆单功能正常
- [ ] 发货功能正常

### 7.3 上线后监控

**监控指标**:
- 应用错误率
- API响应时间
- 数据库查询性能
- 订单创建成功率
- 用户反馈

**监控工具**:
- Prometheus + Grafana
- Sentry(错误监控)
- ELK(日志分析)
- 应用性能监控(APM)

### 7.4 应急响应

**发现问题后**:
1. 立即评估影响范围
2. 决定是否需要回滚
3. 执行回滚或修复方案
4. 通知相关方
5. 事后复盘

---

## 8. 附录

### 8.1 相关文档

- [订单模块实施指南](../02-requirements/modules/订单/订单模块实施指南_20260116.md)
- [订单模块API文档](orders-api-implementation.md)
- [数据库Schema文档](../../03-database/schema.md)

### 8.2 联系人

| 角色 | 姓名 | 联系方式 |
|:---|:---|:---|
| 后端开发 | - | - |
| DBA | - | - |
| 运维 | - | - |
| 产品经理 | - | - |

### 8.3 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|:---|:---|:---|:---|
| v1.0 | 2026-01-16 | 初始版本 | AI Agent |

---

**文档结束**
