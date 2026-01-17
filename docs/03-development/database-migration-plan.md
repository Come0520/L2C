# 数据库迁移计划 - 报价模块整改

> **文档版本**: v1.0  
> **创建日期**: 2026-01-16  
> **优先级**: P0 (阻塞Bug修复)  
> **预估工时**: 2天  
> **依赖**: 无

---

## 📋 迁移概述

本次迁移主要解决报价模块的两个关键问题:
1. **版本管理约束缺失**: 数据库层面无法保证"同一时间只能有一个ACTIVE版本"
2. **快照机制缺失**: 转单时无法深度克隆报价数据,订单可能受商品库变更影响

---

## 🔧 迁移 #1: 版本管理唯一约束

### 问题描述

当前 `quotes` 表虽然有 `isActive` 字段,但数据库层面没有唯一约束,可能导致:
- 同一报价单号链存在多个ACTIVE版本
- 业务逻辑依赖应用层保证,存在并发问题

### 解决方案

添加部分唯一索引(Partial Unique Index),确保同一 `quoteNo` 链中只有一个 `isActive=true` 的记录。

### 迁移脚本

```sql
-- Migration: 0006_quote_unique_active_version.sql
-- Description: Add partial unique index to ensure only one active version per quote chain
-- Created: 2026-01-16

-- 添加部分唯一索引:同一quoteNo链中只能有一个isActive=true的记录
CREATE UNIQUE INDEX CONCURRENTLY idx_quotes_active_version
ON quotes (quote_no, is_active)
WHERE is_active = true;

-- 添加复合索引优化版本查询
CREATE INDEX CONCURRENTLY idx_quotes_quote_no_version
ON quotes (quote_no, version DESC);

-- 添加索引优化父子关系查询
CREATE INDEX CONCURRENTLY idx_quotes_parent_quote_id
ON quotes (parent_quote_id)
WHERE parent_quote_id IS NOT NULL;

-- 添加索引优化租户+状态查询
CREATE INDEX CONCURRENTLY idx_quotes_tenant_status
ON quotes (tenant_id, status);

-- 添加索引优化租户+客户查询
CREATE INDEX CONCURRENTLY idx_quotes_tenant_customer
ON quotes (tenant_id, customer_id);
```

### 回滚脚本

```sql
-- Rollback: 0006_quote_unique_active_version.sql

DROP INDEX CONCURRENTLY IF EXISTS idx_quotes_active_version;
DROP INDEX CONCURRENTLY IF EXISTS idx_quotes_quote_no_version;
DROP INDEX CONCURRENTLY IF EXISTS idx_quotes_parent_quote_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_quotes_tenant_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_quotes_tenant_customer;
```

### 验证步骤

1. **检查索引创建**:
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'quotes' 
   AND indexname LIKE 'idx_quotes_%';
   ```

2. **测试唯一约束**:
   ```sql
   -- 尝试插入两个ACTIVE版本,应失败
   BEGIN;
   INSERT INTO quotes (quote_no, is_active, version, customer_id, tenant_id, created_by)
   VALUES ('TEST-001', true, 1, 'uuid-1', 'uuid-2', 'uuid-3');
   
   INSERT INTO quotes (quote_no, is_active, version, customer_id, tenant_id, created_by)
   VALUES ('TEST-001', true, 2, 'uuid-1', 'uuid-2', 'uuid-3');
   ROLLBACK;
   ```

3. **测试非ACTIVE版本**:
   ```sql
   -- 应该成功插入多个非ACTIVE版本
   BEGIN;
   INSERT INTO quotes (quote_no, is_active, version, customer_id, tenant_id, created_by)
   VALUES ('TEST-002', false, 1, 'uuid-1', 'uuid-2', 'uuid-3');
   
   INSERT INTO quotes (quote_no, is_active, version, customer_id, tenant_id, created_by)
   VALUES ('TEST-002', false, 2, 'uuid-1', 'uuid-2', 'uuid-3');
   COMMIT;
   ```

### 影响评估

| 项目 | 影响 | 说明 |
|------|------|------|
| **现有数据** | 无影响 | 索引创建使用 `CONCURRENTLY`,不锁表 |
| **应用代码** | 需调整 | `createNextVersion` 需使用事务 |
| **性能** | 提升 | 新增索引优化查询性能 |
| **回滚风险** | 低 | 索引可安全删除 |

---

## 🔧 迁移 #2: 订单快照字段

### 问题描述

当前 `orders` 表仅通过 `quoteId` 和 `quoteVersionId` 引用报价单,存在以下问题:
- 商品库变更会影响已转订单的价格
- 计算参数变更会影响订单金额
- 无法追溯转单时的原始数据

### 解决方案

在 `orders` 表添加 `quote_snapshot` JSONB 字段,存储转单时的完整报价快照。

### 迁移脚本

```sql
-- Migration: 0007_order_quote_snapshot.sql
-- Description: Add quote_snapshot field to orders table for data isolation
-- Created: 2026-01-16

-- 添加quote_snapshot字段
ALTER TABLE orders
ADD COLUMN quote_snapshot JSONB;

-- 添加注释说明字段用途
COMMENT ON COLUMN orders.quote_snapshot IS '报价单快照,转单时深度克隆,包含完整报价数据(商品信息、计算参数、图片URL等),确保订单不受商品库变更影响';

-- 添加索引优化快照查询(可选,根据实际使用情况决定)
-- CREATE INDEX CONCURRENTLY idx_orders_quote_snapshot_gin
-- ON orders USING GIN (quote_snapshot);
```

### 回滚脚本

```sql
-- Rollback: 0007_order_quote_snapshot.sql

ALTER TABLE orders
DROP COLUMN IF EXISTS quote_snapshot;

DROP INDEX CONCURRENTLY IF EXISTS idx_orders_quote_snapshot_gin;
```

### 快照数据结构

```typescript
interface QuoteSnapshot {
  quote: {
    id: string;
    quoteNo: string;
    version: number;
    customerId: string;
    customerName: string;
    totalAmount: number;
    discountRate: number;
    discountAmount: number;
    finalAmount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  items: Array<{
    id: string;
    productName: string;
    productSku: string;
    category: string;
    unitPrice: number;
    quantity: number;
    width: number;
    height: number;
    foldRatio?: number;
    subtotal: number;
    attributes: Record<string, any>;
    calculationParams: Record<string, any>;
    imageUrl?: string;
    attachments?: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
  }>;
  rooms: Array<{
    id: string;
    name: string;
    sortOrder: number;
  }>;
  snapshotTimestamp: string;
  snapshotVersion: string;
}
```

### 应用层实现示例

```typescript
// src/features/quotes/actions/convert-to-order.ts
import { db } from '@/shared/api/db';
import { orders, quotes, quoteItems, quoteRooms } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

export async function convertQuoteToOrder(quoteId: string) {
  return await db.transaction(async (tx) => {
    // 1. 查询完整报价数据
    const quote = await tx.query.quotes.findFirst({
      where: eq(quotes.id, quoteId),
      with: {
        items: true,
        rooms: true,
        customer: true,
      }
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    // 2. 深度克隆快照数据
    const snapshot = {
      quote: {
        id: quote.id,
        quoteNo: quote.quoteNo,
        version: quote.version,
        customerId: quote.customerId,
        customerName: quote.customer?.name,
        totalAmount: quote.totalAmount?.toString(),
        discountRate: quote.discountRate?.toString(),
        discountAmount: quote.discountAmount?.toString(),
        finalAmount: quote.finalAmount?.toString(),
        status: quote.status,
        createdAt: quote.createdAt?.toISOString(),
        updatedAt: quote.updatedAt?.toISOString(),
      },
      items: quote.items.map(item => ({
        id: item.id,
        productName: item.productName,
        productSku: item.productSku,
        category: item.category,
        unitPrice: item.unitPrice?.toString(),
        quantity: item.quantity?.toString(),
        width: item.width?.toString(),
        height: item.height?.toString(),
        foldRatio: item.foldRatio?.toString(),
        subtotal: item.subtotal?.toString(),
        attributes: item.attributes,
        calculationParams: item.calculationParams,
        imageUrl: item.attributes?.imageUrl,
      })),
      rooms: quote.rooms.map(room => ({
        id: room.id,
        name: room.name,
        sortOrder: room.sortOrder,
      })),
      snapshotTimestamp: new Date().toISOString(),
      snapshotVersion: '1.0.0',
    };

    // 3. 创建订单
    const [order] = await tx.insert(orders).values({
      tenantId: quote.tenantId,
      orderNo: generateOrderNo(),
      quoteId: quote.id,
      quoteVersionId: quote.id,
      customerId: quote.customerId,
      customerName: quote.customer?.name,
      customerPhone: quote.customer?.phone,
      totalAmount: quote.finalAmount,
      quoteSnapshot: snapshot,
      status: 'DRAFT',
      createdBy: quote.createdBy,
    }).returning();

    // 4. 创建订单明细项(从快照读取)
    for (const item of quote.items) {
      await tx.insert(orderItems).values({
        orderId: order.id,
        tenantId: quote.tenantId,
        quoteItemId: item.id,
        roomName: item.roomName,
        productId: item.productId,
        productName: item.productName,
        category: item.category,
        quantity: item.quantity,
        width: item.width,
        height: item.height,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        sortOrder: item.sortOrder,
      });
    }

    return order;
  });
}
```

### 验证步骤

1. **检查字段创建**:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'orders'
   AND column_name = 'quote_snapshot';
   ```

2. **测试快照存储**:
   ```sql
   -- 插入测试订单
   INSERT INTO orders (
     tenant_id, order_no, quote_id, quote_version_id,
     customer_id, total_amount, quote_snapshot, status
   ) VALUES (
     'tenant-uuid',
     'ORD-20260116-001',
     'quote-uuid',
     'quote-uuid',
     'customer-uuid',
     1000.00,
     '{
       "quote": {"id": "quote-uuid", "quoteNo": "Q-001"},
       "items": [],
       "rooms": [],
       "snapshotTimestamp": "2026-01-16T00:00:00Z"
     }'::jsonb,
     'DRAFT'
   );

   -- 查询快照数据
   SELECT quote_snapshot->'quote'->>'quoteNo' as quote_no
   FROM orders
   WHERE order_no = 'ORD-20260116-001';
   ```

3. **验证快照隔离**:
   ```sql
   -- 修改报价单价格
   UPDATE quotes
   SET final_amount = 2000.00
   WHERE id = 'quote-uuid';

   -- 订单快照中的价格应该保持不变
   SELECT quote_snapshot->'quote'->>'finalAmount' as snapshot_amount,
          (SELECT final_amount FROM quotes WHERE id = 'quote-uuid') as current_amount
   FROM orders
   WHERE quote_id = 'quote-uuid';
   ```

### 影响评估

| 项目 | 影响 | 说明 |
|------|------|------|
| **现有数据** | 无影响 | 新字段可为NULL |
| **应用代码** | 需调整 | 转单逻辑需实现快照存储 |
| **性能** | 轻微影响 | JSONB字段增加存储空间 |
| **回滚风险** | 低 | 字段可安全删除 |

---

## 📊 迁移执行计划

### 执行顺序

1. **迁移 #1**: 版本管理唯一约束
   - 优先级: P0
   - 依赖: 无
   - 预估时间: 30分钟

2. **迁移 #2**: 订单快照字段
   - 优先级: P0
   - 依赖: 无
   - 预估时间: 15分钟

### 执行环境

- **生产环境**: 需在低峰期执行
- **测试环境**: 可随时执行
- **备份要求**: 执行前必须备份数据库

### 回滚预案

1. 如果迁移 #1 失败:
   - 删除新创建的索引
   - 检查现有数据是否有重复ACTIVE版本
   - 修复数据后重新执行

2. 如果迁移 #2 失败:
   - 删除 `quote_snapshot` 字段
   - 检查是否有数据已写入该字段
   - 重新执行迁移

---

## ✅ 验收标准

### 功能验收

- [ ] 数据库层面保证同一 `quoteNo` 链中只有一个 `isActive=true` 的记录
- [ ] 尝试插入多个ACTIVE版本时抛出唯一性错误
- [ ] 订单表成功添加 `quote_snapshot` 字段
- [ ] 转单时快照数据完整存储
- [ ] 订单快照不受商品库变更影响

### 性能验收

- [ ] 索引创建不阻塞正常业务(使用 `CONCURRENTLY`)
- [ ] 版本查询性能提升(新增索引)
- [ ] 快照查询响应时间<100ms

### 数据完整性验收

- [ ] 迁移后无数据丢失
- [ ] 迁移后无数据损坏
- [ ] 回滚后数据恢复原状

---

## 📝 注意事项

1. **并发执行**: 索引创建使用 `CONCURRENTLY`,避免锁表
2. **数据验证**: 执行前检查现有数据是否有重复ACTIVE版本
3. **应用同步**: 数据库迁移完成后,应用代码需同步更新
4. **监控告警**: 迁移后监控数据库性能指标
5. **文档更新**: 迁移完成后更新数据库Schema文档

---

## 🔗 相关文档

- [数据库Schema文档](../03-database/schema.md)
- [报价模块需求文档](../02-requirements/modules/报价单/报价单.md)
- [报价模块审计报告](../02-requirements/modules/报价单/quote-module-audit-20260116.md)
- [整改计划](./整改计划.md)

---

**最后更新**: 2026-01-16  
**维护者**: 开发团队
