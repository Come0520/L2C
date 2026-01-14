# Lint 错误修复计划

## 第一阶段：修复 `any` 类型错误 (29个)

### 1. 核心业务类型替换
- **leads/page.tsx** - 将 `status as any` 替换为 `LeadStatus`，`intentionLevel as any` 替换为 `IntentionLevel`
- **curtain-fabric-quote-form.tsx** - 移除 `zodResolver` 的 `as any` 断言，使用正确的类型

### 2. 测试文件类型修复
- **after-sales/__tests__/actions.test.ts** - 为测试数据对象定义接口类型
- **orders/__tests__/order-actions.test.ts** - 为 mock 函数定义类型
- **quotes/__tests__/bundle-flow.test.ts** - 为动态导入的函数定义类型

### 3. 数据库操作类型修复
- **seed-measurements.ts** - 为 `taskData` 定义正确的类型
- **settings/approvals/page.tsx** - 定义 `ApprovalFlow` 接口，替换 `as any`

## 第二阶段：清理未使用变量 (19个)

### 1. 删除未使用的导入和变量
- **check-data.ts** - 删除 `schema`, `eq`
- **leads/[id]/page.tsx** - 删除 `createMeasureTask`
- **service/measurement/page.tsx** - 删除 `CreateMeasureTaskDialog`
- **workbench/workbench-client.tsx** - 删除未使用的 setter 函数
- **测试文件** - 清理所有未使用的变量和导入

### 2. 清理未使用的 eslint-disable 指令
- **curtain-fabric-quote-form.tsx** - 删除 3 处未使用的 eslint-disable 注释

## 第三阶段：处理警告 (可选优化)

### 1. React Compiler 警告 (3个)
- 为 React Hook Form 的 `watch()` 添加注释说明使用场景，或考虑使用 `useFormContext` 重构

### 2. <img> 标签警告 (5个)
- 将 `<img>` 替换为 Next.js 的 `<Image>` 组件（需要配置域名）

---

**预计修复文件数**: 约 15 个文件  
**预计时间**: 修复所有 29 个错误，清理 19 个警告