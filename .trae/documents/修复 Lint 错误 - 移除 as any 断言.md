# 修复 Lint 错误 - 移除 as any 断言

## 问题分析
我们有3个非测试文件中存在 `any` 类型断言，这些是为了修复 TypeScript 编译错误而添加的，但违反了 "零 any 模式" 规范，导致 lint 报错：
- `finance/ap/page.tsx:69`：`ApTable data={list as any}`
- `finance/labor/page.tsx:69`：`ApTable data={list as any}`
- `service/installation/page.tsx:105`：`InstallTaskTable data={data as any}`

## 根因分析
1. **`ApTable` 类型不匹配**：`getApStatements` 返回的数据包含 `creator` 关系，但缺少 `supplier` 和 `worker` 关系，与 `ApTable` 期望的 `ApStatement[]` 类型不匹配
2. **`InstallTaskTable` 类型不匹配**：实际返回的数据是 `InstallTaskWithRelations[]` 类型，与 `InstallTaskTable` 期望的 `InstallTaskData[]` 类型不匹配

## 解决方案
创建数据适配器函数，将实际返回的数据转换为组件期望的类型，移除 `as any` 断言：

### 1. 修复 `finance/ap/page.tsx` 和 `finance/labor/page.tsx`
- 创建数据适配器，将 `getApStatements` 返回的数据转换为 `ApStatement` 类型
- 移除 `as any` 断言

### 2. 修复 `service/installation/page.tsx`
- 创建数据适配器，将 `InstallTaskWithRelations` 转换为 `InstallTaskData` 类型
- 移除 `as any` 断言

## 预期效果
- 所有非测试文件通过 TypeScript 编译
- 所有非测试文件通过 lint 检查
- 代码符合 "零 any 模式" 规范

## 修复步骤
1. 修复 `finance/ap/page.tsx`
2. 修复 `finance/labor/page.tsx`
3. 修复 `service/installation/page.tsx`
4. 运行 TypeScript 编译检查
5. 运行 lint 检查

## 注意事项
- 保持数据转换逻辑简单明了
- 确保转换后的数据结构与组件期望的类型完全匹配
- 不修改组件的类型定义，只在使用处进行数据转换

## 相关文件
- `src/features/finance/ap/components/ap-statement-table.tsx`：`ApTable` 组件定义
- `src/features/service/installation/components/install-task-table.tsx`：`InstallTaskTable` 组件定义
- `src/features/finance/actions.ts`：`getApStatements` 函数定义