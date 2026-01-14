# UI组件测试修复计划

本计划旨在修复 `leads-filter-bar` 和 `return-lead-dialog` 的测试失败问题。

## 1. 修复 LeadsFilterBar 测试
文件: `src/features/leads/__tests__/leads-filter-bar.test.tsx`

- **问题**: `Select` 组件有默认值 "ALL"，导致 Placeholder 不显示，`getByPlaceholderText` 失败。
- **修复**:
  - 将 `getByPlaceholderText('销售人员')` 改为 `getByText('全部销售')`。
  - 将 `getByPlaceholderText('渠道来源')` 改为 `getByText('全部来源')`。
  - 调整下拉菜单的交互测试逻辑，点击默认文本触发下拉。

## 2. 修复 ReturnLeadDialog 测试
文件: `src/features/leads/__tests__/return-lead-dialog.test.tsx`

- **问题**: 测试试图在 DOM 中查找 `sonner` 的 Toast 消息，但在测试环境中 Toast 可能未渲染。
- **修复**:
  - 添加 `vi.mock('sonner')`。
  - 将 DOM 断言改为函数调用断言：`expect(toast.success).toHaveBeenCalled()` 和 `expect(toast.error).toHaveBeenCalled()`。

## 3. 验证
- 运行 `pnpm test src/features/leads/__tests__/leads-filter-bar.test.tsx`
- 运行 `pnpm test src/features/leads/__tests__/return-lead-dialog.test.tsx`
