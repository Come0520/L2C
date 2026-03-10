# 售后服务模块 (After-Sales) 审计报告

## 审计概述
本次针对 `after-sales` 模块进行了深入审计，重点审查了售后工单、定责单、定损报告以及数据统计功能的代码规范、安全性、性能和业务逻辑完整性。该模块整体架构清晰，严格执行了 `tenantId` 隔离，核心状态流转（定责、客诉状态更新）拥有完备的系统日志记录（`AuditService`）。此外，模块中已存在部分针对并发竞争和计算精度的优秀实践（如数据库级别 `SUM` 计算、`Decimal.js` 财务精度保证）。但在报表查询性能与部分并发场景的严谨程度上仍有改进空间。

---

## 缺陷记录

### 🟥 P1 严重问题 (High Priority)

#### [P1] `analytics.ts`### 1. 统计报表缺失日期边界及条件过滤 ✅ (已修复)
- **位置**: `src/features/after-sales/actions/analytics.ts` -> `getCachedQualityAnalytics`
- **问题描述**: `ticketsByType` 和 `ticketsByStatus` 统计全表数据，缺失依附于前端入参 `startDate` 和 `endDate` 的条件过滤 (AS-P-02)。另外 `getQualityAnalyticsSchema` 缺少请求的 Date Range 限定，极端大时间跨度请求易造成库慢查询 (DoS风险)。
- **修复指引**:
  - `schemas.ts`: 利用 `z.superRefine` 增加起止日期合法性校验，约束跨度不得超过 365 天。
  - `analytics.ts`: 对统计下推查询补充等效的日期 `where` 过滤条件，严格缩小查询数据集。

---

### 🟨 P2 一般问题 (Medium Priority)

### 2. `damage-report.ts` 存在 N+1 查询隐患 ✅ (已修复)
- **文件路径**: `src/features/after-sales/actions/damage-report.ts`
- **问题描述**: 在 `createDamageReportAction` 中，遍历 `data.liabilities` 时使用了 `for...of` 循环并在其中 `await checkDeductionAllowed(...)`。由于 `checkDeductionAllowed` 底层依赖 2~3 次数据库查询，虽然单次定损责任方理论上不多（上限 6 种类型），但这仍是典型的循环内等待 DB 请求的**次优做法**。
- **修复措施**: 实现了 `checkMultipleDeductionsAllowed` 批量聚合查询，避免了 N+1 数据库访问，并在循环外提取数据内存比对进行优化。

### 3. 结案相关更新缺失乐观锁保障 ✅ (已修复)
- **文件路径**: `src/features/after-sales/actions/ticket.ts`
- **问题描述**: 在 `closeResolutionCostClosure` 及其他部分状态更新操作中，虽然限制了 `tenantId` 和 `id`，但没有使用乐观锁（`version` 字段）。如果多个操作人员同时对同一张客诉工单进行结案操作或在处理客诉信息时结案，可能会产生覆盖写问题。
- **修复措施**: 在 `afterSalesTickets` 表增加了 `version` 限制，为 `updateTicketStatusAction` 与 `closeResolutionCostClosure` 操作引入版本检查和更新时的 `.set({ version: ticket.version + 1 })`。

---

## 优秀实践 (Good Practices)
✅ **完整的租户隔离和鉴权**: `checkPermission` 与 `tenantId` 贯穿所有的 Server Actions 操作上下文，非常安全。
✅ **防丢精度的财务计算**: 对于金额计算严格使用了 `Decimal.js`，避免了 Javascript 浮点数累加常见的精度丢失问题。
✅ **系统合规透明度**: 广泛集成 `AuditService`，保证了核心业务运转每一步状态的前后快照都有被留存。
✅ **局部缓存设计**: `analytics.ts` 对复杂驾驶舱数据查询施加了 `unstable_cache`（5分钟重发机制），是防止高频请求穿透打挂数据库的好策略（前提是修补好漏掉的日期过滤条件）。
