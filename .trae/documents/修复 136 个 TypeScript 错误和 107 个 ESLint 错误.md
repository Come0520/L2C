# L2C 项目错误修复计划

## 📊 错误概览
- **TypeScript 错误**: 136 个（主要在测试文件）
- **ESLint 错误**: 107 个（主要是 `any` 类型）
- **ESLint 警告**: 64 个（未使用变量、兼容性警告）

## 🎯 修复优先级

### 阶段 1：修复核心业务代码的 ESLint 错误（高优先级）
1. 修复 quotes 相关组件中的 `any` 类型（约 20 个错误）
   - curtain-fabric-quote-form.tsx
   - quote-bundle-editor.tsx
   - quote-bundle-summary-table.tsx
   - track-quote-form.tsx
   - quick-quote-form.tsx
   - room-view.tsx

2. 修复其他业务组件的 `any` 类型（约 10 个错误）
   - reminder-rule-form.tsx
   - stateful-button.tsx

### 阶段 2：修复测试文件的 TypeScript 错误（中优先级）
1. 修复 mock 类型问题（约 80 个错误）
   - leads/__tests__/ (35 个)
   - orders/__tests__/ (29 个)
   - supply-chain/__tests__/ (19 个)

2. 修复 Session 和 Drizzle 查询类型问题（约 20 个错误）

### 阶段 3：清理警告（低优先级）
1. 移除未使用的变量（约 40 个）
2. 替换 `<img>` 为 Next.js `<Image>`（约 5 个）
3. 处理 React Hook Form 兼容性警告（约 3 个）

### 阶段 4：L2C 规范优化（可选）
1. 添加缺失的审计日志记录（3 处）
2. 在 Schema 中添加单位注释（3 处）

## 📝 修复策略
- 严格遵循零 `any` 原则，所有类型从 Drizzle Schema 推导
- 测试文件使用正确的 mock 类型定义
- 保持代码风格一致性