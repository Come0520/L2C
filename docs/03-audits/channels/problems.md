# channels 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/channels

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 0 |
| 🟠 P1 — 质量/性能（应当修复） | 2 |
| 🟡 P2 — 规范/UX（建议改进） | 3 |
| **合计** | **5** |

> ⚠️ 本模块**无 P0 安全问题**，是审计最佳模块之一。

---

## 🟠 P1 — 应当修复

- [x] [D8-P1-1] `actions/settlements.ts:314-330` — `submitSettlementForApproval` 将结算单从 DRAFT 推进为 PENDING，**缺少 `AuditService.log` 审计记录**。其他状态操作（CREATE、APPROVE、PAID）均有审计，唯独此处遗漏。结算单提交审批是核心财务动作，必须留记录

- [x] [D4-P1-2] `actions/settlements.ts:225-244` — `getSettlements` 的分页查询**未限制 `pageSize` 最大值**（commissions.ts 第157行已有该修复：`const limit = Math.min(Math.max(pageSize, 1), 100)`，但 settlements.ts 同名查询未同步）。恶意请求传入 `pageSize=999999` 将触发全量查询

---

## 🟡 P2 — 建议改进

- [ ] [D6-P2-1] `actions/__tests__` 中仅 6 个测试文件，**缺乏覆盖以下场景的专项测试**：
  - 结算单并发竞态（两个请求同时结算相同佣金记录）
  - 审批自审约束（Self-Approval 防护）
  - Decimal.js 精度场景（超大金额佣金计算）

- [ ] [D5-P2-2] `actions/settlements.ts:403` — 审批结算单时，自动创建付款单（`paymentBills`）的 `paymentMethod` 硬编码为 `'BANK'`。实际业务中渠道结算可能使用支票、现金、网转等多种方式。建议在 `approveSettlement` 接收 `paymentMethod` 参数，或改在实际付款操作时确认方式 (复核发现未彻底修复，代码中仍硬编码为 `BANK`)

- [ ] [D5-P2-3] `actions/mutations.ts` 中 `updateChannel`、`addChannelContact` 以及 `actions/settlements.ts` 中的 `submitSettlementForApproval` 均未将业务状态更新与 `AuditService.log` 放在同一个数据库事务（`db.transaction`）内执行。这使得系统无法保证业务数据流转与操作审计日志记录的绝对原子性。

---

## ✅ 表现良好项（无需修复）

- **D3 佣金金额防篡改**：`createCommissionRecord` 拒绝接受前端传入金额/费率，**完全由服务端查询订单+渠道规则后通过 `calculateOrderCommission` 计算**，无前端注入风险
- **D3 防重复佣金**：创建前检查同一订单是否已有有效（非 VOID）佣金记录，`ne(status, 'VOID')` 去重
- **D3 并发结算防护**：`createSettlement` 事务内更新佣金时额外加 `eq(status, 'PENDING')` 双重校验，并验证 `updatedCommissions.length === commissionIds.length`，防止并发导致数据双算
- **D3 职责分离**：`approveSettlement` 检查 `settlement.createdBy === session.user.id`，禁止自审批（Segregation of Duties）
- **D3 全量 tenantId 隔离**：所有查询、更新均正确使用 `and(eq(table.tenantId, tenantId), ...)`
- **D4 Decimal.js 全程使用**：佣金总额、调节金额、最终金额均使用 `Decimal.js` 精确计算，`toFixed(2)` 落库，无浮点精度风险
- **D4 结算号碰撞重试**：`createSettlement` 检测 Postgres `23505` 唯一约束冲突并自动重试（最多3次）
- **D8 审计日志完整**：VOID 佣金、创建结算单、审批结算单、标记已付款均有完整 AuditService 记录（仅缺 submit 步骤，见 P1）
