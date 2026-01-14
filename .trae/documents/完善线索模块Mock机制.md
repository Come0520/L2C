# 修复 Lint 和 Type 错误计划

本计划旨在系统性地解决项目中发现的 700+ 个代码质量问题，按优先级分阶段执行。

## 阶段 1: 修复 ESLint 问题 (优先)

目标：解决 149 个 ESLint 问题，提升代码规范性。

1. **自动修复**: 运行 `eslint --fix` 解决 `no-unused-vars` (自动加前缀) 和格式问题。
2. **类型安全**: 手动将 `any` 替换为具体类型或 `unknown`，特别是在 `product-import-dialog.tsx` 和 `actions` 文件中。
3. **React 规范**: 修复 `react-hooks/exhaustive-deps` 和 `react/no-unescaped-entities`。

## 阶段 2: 修复源码 TypeScript 编译错误 (关键)

目标：解决影响生产构建的类型错误。

1. **工具库修复**: 修正 `src/lib/zod-i18n.ts` 中的 `ZodErrorMap` 类型签名。
2. **组件修复**:

   * 修复 `purchase-order-preview-dialog.tsx` 中缺失的 `Loader` 导入。

   * 修复 `export-button.tsx` 中的泛型约束问题。
3. **业务逻辑**: 修正各 Feature 中发现的类型不匹配问题。

## 阶段 3: 修复测试文件类型错误 (大量)

目标：解决 500+ 测试文件中的 Mock 类型报错。

1. **Mock 类型统一**: 修正 `vi.mocked()` 的使用方式，确保 Mock 对象符合接口定义。
2. **数据库 Mock**: 修正 `drizzle-orm` 相关 Mock 的返回值类型。

## 阶段 4: L2C 规范合规

目标：消除 L2C Check 警告。

1. **审计日志**: 在 `approval`, `finance`, `orders`, `inventory` 的关键 Action 中添加 `system_logs` 写入。
2. **文档注释**: 在 Schema 定义中补充单位注释。

