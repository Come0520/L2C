# sales 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/sales

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 1 |
| 🟠 P1 — 质量/性能（应当修复） | 2 |
| 🟡 P2 — 规范/UX（建议改进） | 3 |
| **合计** | **6** |

---

## 🔴 P0 — 必须立即修复

- [x] [D3-006-R8] `actions/targets.ts:400-407` — `adjustSalesTarget` 调整销售目标时 UPDATE 的 WHERE 子句为 `eq(salesTargets.id, oldTarget.id)`，**缺少 `tenantId` 过滤**（D3-006 TOCTOU 第 8 次复现）。`oldTarget` 的前置查询（第368-375行）已验证 tenantId 归属，但实际 UPDATE 未加保护 ✅ 已修复(2026-03-10)

---

## 🟠 P1 — 应当修复

- [x] [D4-P1-2] `actions/targets.ts:127-141` 和 `actions/analytics.ts:98-110` — `getSalesTargets` 和 `getMonthlyAchievedAmount` 均加载**全租户所有 ACCEPTED 报价单**（无日期范围过滤），然后在 JS 层用 `filter()` 按月过滤。当租户历史報价单积累到 10,000+ 条时，每次查询都会全表扫描。应改为在 SQL WHERE 中加入 `gte(quotes.createdAt, startDate)` 和 `lte(quotes.createdAt, endDate)` 条件 ✅ 已修复(2026-03-10)

- [x] [D4-P1-3] `actions/analytics.ts:232-277` — `getSalesRanking` 和 `getSalesTargetWarnings` 中，对每个销售人员使用 `Array.map + await getMonthlyAchievedAmount()`，每次调用都独立查询一次 `quotes` 表（N 个销售 = N 次独立全表扫描）。应改为一次性查询当月报价并在内存中按 userId 分组 ✅ 已修复(2026-03-10)

---

## 🟡 P2 — 建议改进

- [x] [D2-P2-1] `actions/targets.ts:290-291` — `updateSalesTarget`、`adjustSalesTarget`、`confirmSalesTarget` 函数末尾均有 `const { revalidateTag } = await import('next/cache');` **但未实际调用 `revalidateTag(...)`**，缓存失效未实现（代码残留 TODO） ✅ 已修复(2026-03-10)

- [ ] [D4-P2-2] `actions/analytics.ts` — `getSalesRanking` 和 `getSalesTargetWarnings` 在解决了 `quotes` 表的 N+1 全表扫描后，内部循环中对 `salesTargets` 的加载仍然基于用户列表使用了 `Array.map + await findFirst` 的 N+1 查询，建议在循环外一次性查出当月所有目标并放入 Map 中。

- [ ] [D8-P2-3] `actions/targets.ts`、`actions/annual-targets.ts` 和 `actions/weekly-targets.ts` — 所有的写入方法（如 `updateSalesTarget`、`adjustSalesTarget` 等）中，对业务表的插入/更新操作与 `AuditService.log` 的记录**没有包裹在同一个 `db.transaction` 事务中**，存在数据一致性隐患。

---

## ✅ 表现良好项（无需修复）

- **D3 完整 checkPermission**：`updateSalesTarget`、`adjustSalesTarget`、`confirmSalesTarget`、`getSalesRanking`、`getSalesTargetWarnings` 均正确调用 `checkPermission(session, PERMISSIONS.SALES_TARGETS.MANAGE)` 或 `PERMISSIONS.ANALYTICS.VIEW_ALL`
- **D3 tenantId 隔离前置查询**：所有 findFirst 查询均含 `eq(salesTargets.tenantId, session.user.tenantId)`
- **D4 onConflictDoUpdate upsert**：`updateSalesTarget` 使用 upsert 避免先查后插的 N+1
- **D4 unstable_cache 已正确配置**：缓存 key 含 tenantId、userId、年、月，TTL 60秒，不存在跨租户共享
- **D7 详细 Zod 校验**：年份范围 2020-2100、月份范围 1-12、金额非负数均有 Zod 校验
- **D8 全量审计事件**：未授权、校验失败、权限拒绝、成功等各维度均有 AuditService 记录
