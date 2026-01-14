# Lint 错误修复计划（69 个问题）

## 问题分类统计

### 错误（35 个）
- **`@typescript-eslint/no-explicit-any`**: 35 个错误 - 使用了 `any` 类型

### 警告（37 个）
- **`@typescript-eslint/no-unused-vars`**: 27 个警告 - 未使用的变量或导入
- **`@typescript-eslint/no-unused-vars`**: 2 个警告 - 未使用的 eslint-disable 指令
- **`@next/next/no-img-element`**: 4 个警告 - 使用 `<img>` 标签
- **`Compilation Skipped`**: 4 个警告 - 使用不兼容的库

## 修复计划

### 阶段 1：修复类型错误（35 个）

#### 1.1 测试文件中的 any 类型（约 50 个）
- `src/features/approval/__tests__/approval-flow.test.ts` - 修复 1 个
- `src/features/customers/__tests__/actions.test.ts` - 修复 7 个
- `src/features/leads/__tests__/actions.test.ts` - 修复 7 个
- `src/features/leads/__tests__/additional-actions.test.ts` - 修复 19 个
- `src/features/orders/__tests__/order-actions.test.ts` - 修复 5 个
- `src/features/products/__tests__/actions.test.ts` - 修复 4 个
- `src/features/quotes/__tests__/actions.test.ts` - 修复 3 个
- `src/features/quotes/__tests__/aggregation.test.ts` - 修复 12 个
- `src/features/quotes/__tests__/quick-quote.test.ts` - 修复 1 个

#### 1.2 业务代码中的 any 类型（约 10 个）
- `src/features/approval/actions.ts` - 修复 3 个
- `src/features/approval/components/workflow-list.tsx` - 修复 11 个
- `src/features/orders/components/order-timeline.tsx` - 修复 2 个
- `src/features/quotes/actions.ts` - 修复 2 个
- `src/features/quotes/components/create-wizard/step-room-products.tsx` - 修复 5 个
- `src/features/quotes/components/curtain-fabric-quote-form.tsx` - 修复 1 个

### 阶段 2：清理未使用变量（27 个）

#### 2.1 未使用的导入和变量
- `check-test-tenant.ts` - 移除 `schema`, `eq`
- `seed-measurements.ts` - 移除 `createMeasureTask`
- `src/app/(dashboard)/leads/page.tsx` - 移除 `CreateMeasureTaskDialog`
- `src/app/(dashboard)/settings/approvals/page.tsx` - 移除 `setTodos`, `setAlerts`, `setSalesUsers`, `setIsLoading`
- `src/features/after-sales/__tests__/actions.test.ts` - 移除 `dotenvResult`, `EqType`
- `src/features/approval/__tests__/approval-flow.test.ts` - 移除 `getApprovalFlows`, `approvalFlowsTable`, `measureTasksTable`
- `src/features/leads/__tests__/additional-actions.test.ts` - 移除 `getLeadTimelineLogs`
- `src/features/leads/__tests__/leads-page-client.test.tsx` - 移除 `getLeads`
- `src/features/orders/__tests__/order-actions.test.ts` - 移除 `MockDb`
- `src/features/leads/__tests__/actions.test.ts` - 移除 `customers`, `leads`, `EqType`
- `src/features/orders/components/order-timeline.tsx` - 移除 `onToggleExpand`
- `src/features/quotes/components/curtain-calc-settings-form.tsx` - 移除 `error`
- `src/features/quotes/components/curtain-fabric-quote-form.tsx` - 移除 `Check`, `CurtainCalcSettings`
- `src/features/quotes/components/create-wizard/step-room-products.tsx` - 移除 `CurtainFabricQuoteForm`
- `src/features/quotes/components/quote-bundle-editor.tsx` - 移除 `handleDetailUpdate`, `accessoryNameColSpan`
- `src/features/quotes/quick-quote/components/quick-quote-form.tsx` - 移除 `CurtainQuickQuoteConfig`

#### 2.2 移除未使用的 eslint-disable 指令
- `src/features/quotes/components/curtain-fabric-quote-form.tsx` - 移除 2 个未使用的 eslint-disable 指令

### 阶段 3：优化图片加载（4 个）

#### 3.1 替换 `<img>` 为 `<Image />`
- `src/features/quotes/components/create-wizard/step-room-products.tsx` - 替换 1 个
- `src/features/quotes/components/quote-bundle-editor.tsx` - 替换 2 个
- `src/features/quotes/components/views/room-view.tsx` - 替换 1 个

### 阶段 4：修复库兼容性问题（4 个）

#### 4.1 处理不兼容库的编译警告
- `src/features/approval/__tests__/approval-flow.test.ts` - 修复 1 个
- `src/features/leads/__tests__/additional-actions.test.ts` - 修复 1 个
- `src/features/orders/__tests__/order-actions.test.ts` - 修复 1 个
- `src/features/quotes/components/curtain-calc-settings-form.tsx` - 修复 1 个

## 预期结果

- **修复前**: 69 个问题（35 个错误，37 个警告）
- **修复后**: 0 个问题
- **减少率**: 100%

## 执行顺序

1. 修复类型错误（35 个）
2. 清理未使用变量（27 个）
3. 优化图片加载（4 个）
4. 修复库兼容性问题（4 个）