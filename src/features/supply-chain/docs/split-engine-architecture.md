# 供应链订单自动分包 (Split Engine) 架构说明

> 版本：v1.0 | 最后更新：2026-02-23
> 核心文件：`src/features/supply-chain/logic/split-engine.ts`

---

## 功能概述

Split Engine 是订单→采购单的**自动路由引擎**，根据预配置的分包规则，将用户订单中的商品自动分配到对应的供应商/加工厂采购单。

---

## 分包流转时序图

```
订单确认 (Order CONFIRMED)
        │
        ▼
 Split Engine 触发
        │
        ├── 读取分包规则 (split_rules)
        │         │
        │         ├── 匹配规则：按 category / supplier / region
        │         └── 无匹配规则 → 进入人工分配队列
        │
        ├── 创建采购单 (purchase_orders)
        │         │
        │         ├── 按规则分到不同供应商或工厂
        │         └── 同时更新库存预订量
        │
        └── 触发 logger + AuditService 记录
```

---

## 分包规则 (Split Rules) 结构

```typescript
interface SplitRule {
  id: string;
  tenantId: string;
  // 触发条件
  category?: string;       // 商品分类
  supplierId?: string;     // 指定供应商
  minAmount?: number;      // 最小金额触发
  // 路由目标
  targetSupplierId: string;
  targetProcessorId?: string;
  priority: number;        // 规则优先级（小值优先）
}
```

---

## 并发库存安全（待加固）

> [!WARNING]
> 当前高并发批量下单时，inventory 扣减操作还未实现数据库层面的 `SELECT FOR UPDATE`。
> 如遭遇批量抢购场景，建议在应用层增加分布式锁（基于 Redis SETNX）。

**计划引入方案：**

```sql
-- 库存扣减前加行级排他锁
SELECT * FROM inventory WHERE id = ? FOR NO KEY UPDATE;
-- 检查库存充足后再执行扣减
UPDATE inventory SET quantity = quantity - ? WHERE id = ?;
```
