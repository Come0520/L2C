# 订单模块性能优化指南

> 版本：v1.0 | 最后更新：2026-02-23

---

## 一、大批量导出安全策略

`order-export.ts` 中的全量导出功能在大数据量下存在 OOM 风险。推荐：

### 游标分页导出（Cursor-based Export）

```typescript
// 替代 findMany({ limit: 10000 })
// 改用游标逐批处理
async function* streamOrders(tenantId: string, filters: OrderFilters) {
  let cursor: string | undefined = undefined;
  do {
    const batch = await db.query.orders.findMany({
      where: and(eq(orders.tenantId, tenantId), cursor ? gt(orders.id, cursor) : undefined),
      limit: 500,            // 每批 500 条
      orderBy: [asc(orders.id)],
    });
    if (batch.length === 0) break;
    yield batch;
    cursor = batch[batch.length - 1].id;
  } while (true);
}
```

---

## 二、订单快照查询优化

复杂的订单改单历史查询，建议添加 React `cache()` 包裹：

```typescript
import { cache } from 'react';

export const getOrderSnapshot = cache(async (orderId: string, tenantId: string) => {
  return db.query.orderSnapshots.findMany({
    where: and(eq(orderSnapshots.orderId, orderId), eq(orderSnapshots.tenantId, tenantId)),
    orderBy: [desc(orderSnapshots.createdAt)],
  });
});
```

---

## 三、精细化缓存 Tag 规划

```typescript
export const ORDER_CACHE_TAGS = {
  LIST: 'order-list',
  DETAIL: (id: string) => `order-${id}`,
  STATUS: (status: string) => `order-status-${status}`,
};
```

| 操作 | 需要淘汰的 Tag |
|:---|:---|
| 创建订单 | `ORDER_CACHE_TAGS.LIST` |
| 更新订单状态 | `ORDER_CACHE_TAGS.DETAIL(id)`, `ORDER_CACHE_TAGS.LIST` |
| 取消订单 | `ORDER_CACHE_TAGS.DETAIL(id)`, `ORDER_CACHE_TAGS.STATUS('CANCELLED')` |
