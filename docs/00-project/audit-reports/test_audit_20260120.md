# 测试文件审计报告

**日期**: 2026-01-20
**审计对象**: `src/features/orders/__tests__`, `src/features/service/measurement/__tests__`, `e2e/flows`

## 1. 核心发现 (Critical Findings)

### 1.1 数据库 Schema 不一致 (Schema Mismatches)

*   **文件**: `src/features/orders/__tests__/order-finance-flow.test.ts`
*   **问题**: 测试代码中使用的枚举值与数据库 Schema 定义不一致。
    *   **AR Statement Status**: 测试使用了 `'PENDING'`，但在 `src/shared/api/schema/enums.ts` 中定义的 `arStatementStatusEnum` 并不包含此值 (应为 `'PENDING_RECON'`, `'PARTIAL'`, `'PAID'` 等)。
    *   **影响**: 测试验证的是一个真实系统中不存在的状态，可能导致业务逻辑在真实 DB 环境下报错或行为异常。

### 1.2 伪造的集成测试 (Fake Integration)

*   **文件**: `src/features/orders/__tests__/order-finance-flow.test.ts`
*   **问题**: 测试声称验证 "Order & Finance Integration Flow"，但导入的 `createPayment` 动作来自 `src/features/finance/actions/mutations.ts`，这是一个只有空实现的 Mock 文件 (`return { success: true }`)。
    *   **现象**: 测试逻辑通过手动修改 `orderMock.paidAmount` 来模拟付款效果，而非通过真实的 Action 逻辑 (如 `ar.ts` 或 `receipt.ts`) 来驱动状态变更。
    *   **结论**: 该测试无法验证订单与财务模块的真实联动。

### 1.3 缺失的业务逻辑测试 (Missing Business Logic Tests)

*   **模块**: `features/service/measurement`
*   **文件**: `src/features/service/measurement/__tests__/actions.test.ts`
*   **问题**: 现有的测量测试仅包含 Zod Schema 的输入校验 (`measureItemSchema` 等)，完全缺失对业务动作 (Actions) 的逻辑测试。
    *   **具体**: `rejectMeasureTask` (驳回逻辑) 涉及状态重置、驳回次数递增、警告触发等核心逻辑，目前处于无测试覆盖状态。

### 1.4 E2E 测试隐患

*   **文件**: `e2e/flows/finance-ar.spec.ts`
*   **问题**: 测试依赖 UI 文本 `PENDING` 或 `待回款`。虽然 UI 显示可能映射正确，但如果底层逻辑确实使用了错误的枚举值 (如单元测试暗示的那样)，E2E 虽然可能因容错通过，但数据完整性存在风险。

## 2. 建议改进方案 (Recommendations)

1.  **修复 `order-finance-flow.test.ts`**:
    *   修正 Mock 数据中的 Enum 值（使用 `PENDING_RECON`）。
    *   替换 Mock Action：引入真实的 `createPaymentOrder` (来自 `features/finance/actions/ar.ts`) 并配合适当的 Mock（如 Mock `FinanceService` 或 `db`），或明确将其降级为仅测试 Order 侧逻辑的单元测试。

2.  **补充 Measurement 逻辑测试**:
    *   为 `rejectMeasureTask` 编写真实的单元测试，验证状态流转 (Status -> `PENDING`) 和 `rejectCount` 逻辑。

3.  **清理死代码**:
    *   删除或标记 `src/features/finance/actions/mutations.ts`，避免误导开发者引用无效的 Mock 实现。

## 3. 下一步计划

建议立即执行上述修复，优先保证测试反映真实的业务逻辑和 Schema 约束。
