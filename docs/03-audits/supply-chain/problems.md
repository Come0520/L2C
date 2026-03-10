# supply-chain 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/supply-chain

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 1 |
| 🟠 P1 — 质量/性能（应当修复） | 3 |
| 🟡 P2 — 规范/UX（建议改进） | 2 |
| **合计** | **6** |

---

## 🔴 P0 — 必须立即修复

- [x] [D3-006-R6] `actions/inventory-actions.ts:598-600` — `setMinStock` 函数更新库存记录的 `minStock` 字段，UPDATE 的 WHERE 子句为 `eq(inventory.id, existing.id)`，**缺少 `tenantId` 过滤**（D3-006 TOCTOU 第 6 次复现）。前置查询（第588-593行）已验证 tenantId，但实际 UPDATE 未加保护

---

## 🟠 P1 — 应当修复

- [x] [D4-P1-1] `actions/inventory-actions.ts:483-497` — `checkInventoryAlertsActionInternal` 中查询库存预警时，**加载当前租户所有库存记录**（无 LIMIT）后在 JS 层进行预警筛选。大型租户（1000+ SKU × 多仓库）下会产生大量数据传输，建议改为在 SQL WHERE 中直接筛选 `quantity <= minStock`

- [x] [D4-P1-2] `actions/po-actions.ts:446-449` — `batchUpdatePoStatus` 中批量更新审计日志使用串行 `for` 循环逐条写入，高并发下每次调用都会产生 N 次串行写入（N 为 PO 数量）。建议改为 `Promise.all` 并发写入或批量写入优化

- [x] [D4-P1-3] `actions/po-actions.ts:222-244` — `createPurchaseOrder` 的 items 循环逐条查询产品信息（`tx.query.products.findFirst`），然后单条 INSERT。创建含 20 条明细的采购单会触发 20 次串行查询 + 20 次串行 INSERT。建议先批量查询（`inArray`），再批量 INSERT

---

## 🟡 P2 — 建议改进

- [x] [D5-P2-1] `actions/po-actions.ts:343-345` — `revalidateTag` 被以 `revalidateTag('supplier-rating-...', {})` 的方式调用并传入第二个参数 `{}`，注释中也特别标注"修复"：`revalidateTag 不支持多参数`。但实际 Next.js 的 `revalidateTag` 只接受一个字符串参数，第二个 `{}` 会被忽略。此为待清理的注释混乱，可能引发误解

- [x] [D6-P2-2] 13 个测试文件中，缺少覆盖 D3-006（setMinStock 跨租户）、CAS 并发锁（采购单并发状态变更）的专项测试

---

## ✅ 表现良好项（无需修复）

- **D3 采购单 CAS 乐观锁**：`updatePoStatus`、`confirmPoQuote`、`confirmPoCompletion` 等所有状态流转 UPDATE WHERE 均加入 `eq(table.status, currentStatus)` 乐观锁，并校验 `result.length === 0` 判断并发冲突，是全项目最完善的并发控制实现
- **D3 库存行级锁**：`adjustInventory`、`transferInventory` 使用 `SELECT ... FOR UPDATE` 数据库行级锁，并结合 `sql\`quantity + delta >= 0\`` CAS 条件防超扣，是全项目唯二使用数据库锁的场景（另一个是 approval 模块）
- **D3 供应商启用状态校验**：`createPurchaseOrder` 在创建前验证供应商 `isActive`，防止向停用供应商下单
- **D3 租户隔离完整**：所有读操作均含 tenantId 条件；所有 INSERT/DELETE 操作均携带 tenantId（除 P0 条目外 UPDATE 也均有）
- **D4 独立付款记录表**：`confirmPoPayment` 使用 `poPayments` 独立表存储付款流水，不覆盖主记录字段，支持多次付款记录
- **D8 完整审计链路**：创建、状态变更、付款确认、收货、库存调整、调拨、安全库存设置 均有 AuditService 记录，携带新旧值
