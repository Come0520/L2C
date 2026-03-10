# pricing 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/pricing

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 0 |
| 🟠 P1 — 质量/性能（应当修复） | 1 |
| 🟡 P2 — 规范/UX（建议改进） | 1 |
| **合计** | **2** |

> ⚠️ 本模块**无 P0 安全问题**，tenantId 隔离完整，checkPermission 均有 await，安全质量优秀。

---

## 🟠 P1 — 应当修复

- [x] [D4-P1-1] `actions/pricing-rules.ts:299-331` — `batchUpdatePricingRuleAction` **只记录了审计日志，未真正执行数据库 UPDATE**（注释标注「仅演示」），当前版本调用此接口批量更新定价规则不会实际修改任何数据。建议在单一事务中对 `rules` 数组每个元素执行 UPDATE，或显式标注此函数为 WIP、禁止在生产环境调用

---

## 🟡 P2 — 建议改进

- [x] [D8-P2-2] `actions/pricing-rules.ts` — `createPricingRuleAction`、`updatePricingRuleAction` 和 `deletePricingRuleAction` 中，对业务表的插入/更新/删除操作与 `AuditService.log` 的记录**没有包裹在同一个 `db.transaction` 事务中**。若审计记录写入失败抛出异常，会导致业务数据已落库但没有审计留存，破坏数据一致性。✅ 已修复(2026-03-10)

---

## ✅ 表现良好项（无需修复）

- **D3 checkPermission 完整**：所有写操作均有 `await checkPermission(session, 'settings:write')`
- **D3 tenantId 双重保护**：`update`/`delete` 操作先 findFirst 校验 tenantId 归属，再在 WHERE 中加 tenantId 过滤
- **D7 严格枚举校验**：`entityType`、`category`、`unitType` 均使用 `z.enum()` 限定合法值
- **D8 oldValues/newValues 对比审计**：更新和删除时均记录变更前快照
