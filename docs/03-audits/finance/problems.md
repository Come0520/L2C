# finance 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/finance

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 2 |
| 🟠 P1 — 质量/性能（应当修复） | 3 |
| 🟡 P2 — 规范/UX（建议改进） | 2 |
| **合计** | **7** |

---

## 🔴 P0 — 必须立即修复

- [ ] [D3-006] `features/finance/actions/transfers.ts:231` — TOCTOU 漏洞：更新 internalTransfers 时，WHERE 子句仅使用了 id，缺少 tenantId 过滤
- [ ] [D3-006] `features/finance/actions/transfers.ts:413` — TOCTOU 漏洞：更新 internalTransfers 时，WHERE 子句仅使用了 id，缺少 tenantId 过滤
- [ ] [D3-006] `features/finance/actions/transfers.ts:511` — TOCTOU 漏洞：更新 internalTransfers 时，WHERE 子句仅使用了 id，缺少 tenantId 过滤

## 🟠 P1 — 应当修复

- [ ] [D4-001] `features/finance/actions/ap.ts:560` — N+1 查询：for 循环内部执行 `await tx.query.apSupplierStatements.findFirst` 及 `.update`
- [ ] [D4-002] `features/finance/actions/receipt.ts:19` — 无限制查询未设 LIMIT：`getReceiptBills` 可能返回全量数据
- [ ] [D4-002] `features/finance/actions/receipt.ts:97` — 无限制查询未设 LIMIT：`getAvailablePrepayments` 返回符合条件的全量记录

## 🟡 P2 — 建议改进

- [ ] [D5-001] `features/finance/components/` — 列表组件缺少针对空数据时的统一 Empty State 提示
- [ ] [D5-002] `features/finance/components/` — 数据表格（Table）在手机端视图缺少包裹层 `overflow-x-auto` 控制

---

## 🔖 错题本命中记录

> 本次审计中，以下历史错题在当前模块复现，审计结束后需更新错题本的复现记录：

- D3-006 TOCTOU 漏洞：查询加 tenantId、更新不加 → 复现于 finance 模块
- D4-001 N+1 查询问题 → 复现于 finance 模块
- D4-002 无限制查询未设 LIMIT → 复现于 finance 模块

---

## ✅ 表现良好项（无需修复）

- D1: 业务逻辑基础较为完整
- D3: 绝大部分 Action 开头均执行了 `await auth()` 并校验了 tenantId
