# 消除 TypeScript `any` 类型错误计划

## 阶段 1：基础设施类型（高优先级）
1. **修复数据库事务类型**（约 10 处）
   - 在 `quotes/actions.ts` 中使用 `Transaction` 类型替换 `tx: any`
   - 在 `approval/actions.ts` 中使用 `Transaction` 类型替换 `tx?: any`
   - 移除 `eslint-disable-next-line` 注释

2. **修复产品搜索类型**（约 3 处）
   - 在 `quote-bundle-editor.tsx` 中使用 `Product[]` 替换 `any[]`
   - 在 `curtain-fabric-quote-form.tsx` 中使用 `Product` 替换 `product: any`

## 阶段 2：UI 组件类型（中优先级）
3. **修复报价单组件 Props**（约 15 处）
   - 从 `shared/api/schema` 推导 `QuoteBundle`, `Quote`, `QuoteItem` 类型
   - 更新 `quote-bundle-summary-table.tsx` 的 Props 接口
   - 更新 `quote-bundle-detail-view.tsx` 的 Props 接口
   - 更新 `quote-detail-view.tsx` 的 Props 接口
   - 更新 `workflow-list.tsx` 的 Props 接口（使用 `InferSelectModel<typeof approvalFlows>`）

## 阶段 3：数据映射类型（中优先级）
4. **修复页面数据映射**（约 10 处）
   - 在 `quotes/page.tsx` 中使用推导类型替换 `dataItems: any[]`
   - 在 `quotes/[id]/page.tsx` 中使用推导类型替换 `att: any`, `room: any`
   - 在 `notifications/actions.ts` 中使用推导类型替换 `data: any[]`

## 阶段 4：Mock 和测试类型（低优先级）
5. **优化测试 Mock 类型**（约 20 处）
   - 在 `src/test/setup.ts` 中使用 `Transaction` 类型
   - 在 `src/shared/types/mocks.ts` 中使用 `InferSelectModel` 替换索引签名中的 `any`
   - 在测试文件中使用推导类型替换变量声明的 `any`

## 阶段 5：动态对象和 Seed 脚本（低优先级）
6. **修复动态对象更新**（约 5 处）
   - 在 `quote-bundle-editor.tsx` 中使用 `Partial<QuoteItem>` 替换 `updates: any`
   - 在 `approval/actions.ts` 中使用 `Record<string, unknown>` 替换 `metadata?: any`

7. **修复 Seed 脚本**（约 10 处）
   - 为 seed 脚本中的 setup 回调定义适当的类型接口

## 预期结果
- 消除所有 70+ 处 `@typescript-eslint/no-explicit-any` 错误
- 提升类型安全性，减少运行时错误
- 符合项目"零 any 模式"规范
- 所有类型从 Drizzle Schema 推导，确保与数据库结构一致