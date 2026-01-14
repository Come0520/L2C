# 修复剩余 any 类型错误的计划

## 当前状态
- Lint 错误：80 个（其中约 50 个是 any 类型错误）
- Lint 警告：53 个（未使用变量等）

## 修复计划

### 第一阶段：修复测试文件中的 any 类型（约 30 个错误）

**文件列表：**
1. `src/features/approval/__tests__/approval-flow.test.ts` - 13 个 any 类型
   - 为动态导入的函数定义正确的函数类型
   - 为 Drizzle 查询的 where 子句定义类型

2. `src/features/leads/__tests__/additional-actions.test.ts` - 8 个 any 类型
   - 为 mock 返回值定义正确的类型
   - 为 vi.mocked() 调用添加类型

3. `src/features/quotes/__tests__/aggregation.test.ts` - 4 个 any 类型
   - 为动态导入的函数定义正确的函数类型

4. `src/features/quotes/__tests__/bundle-flow.test.ts` - 8 个 any 类型
   - 为动态导入的函数定义正确的函数类型

5. `src/features/orders/__tests__/status-sync.test.ts` - 8 个 any 类型
   - 为 mock 对象定义正确的类型

6. `src/features/leads/__tests__/actions.test.ts` - 4 个 any 类型
   - 为 mock 返回值定义正确的类型

7. `src/features/customers/__tests__/actions.test.ts` - 4 个 any 类型
   - 为 mock 返回值定义正确的类型

8. `src/features/leads/__tests__/lead-detail.test.tsx` - 2 个 any 类型
   - 为 mock 返回值定义正确的类型

9. `src/features/leads/__tests__/leads-page-client.test.tsx` - 3 个 any 类型
   - 为 mock 返回值定义正确的类型

### 第二阶段：修复业务代码中的 any 类型（约 10 个错误）

**文件列表：**
1. `src/app/(dashboard)/service/measurement/page.tsx` - 5 个 any 类型
   - 为 Drizzle 查询的 where 子句定义类型

2. `src/app/(dashboard)/workbench/notifications/page.tsx` - 2 个 any 类型
   - 为事件处理器定义正确的类型

3. `src/app/(dashboard)/workbench/workbench-client.tsx` - 7 个 any 类型
   - 为 map 函数的索引参数定义类型

4. `src/app/(dashboard)/leads/[id]/page.tsx` - 2 个 any 类型
   - 为组件属性定义正确的类型

5. `src/app/(dashboard)/quotes/create/page.tsx` - 1 个 any 类型
   - 为组件属性定义正确的类型

6. `src/app/(dashboard)/settings/page.tsx` - 1 个 any 类型
   - 为事件处理器定义正确的类型

7. `src/features/approval/actions.ts` - 1 个 any 类型
   - 为函数参数定义正确的类型

8. `src/features/approval/components/workflow-list.tsx` - 1 个 any 类型
   - 为组件属性定义正确的类型

### 第三阶段：修复种子文件中的 any 类型（约 6 个错误）

**文件列表：**
1. `seed-partners.ts` - 2 个 any 类型
2. `seed-products.ts` - 3 个 any 类型
3. `seed-test-measurements.ts` - 1 个 any 类型

### 第四阶段：修复其他 any 类型（约 4 个错误）

**文件列表：**
1. `src/features/quotes/components/create-wizard/step-room-products.tsx` - 1 个 any 类型

## 修复策略

### 1. 测试文件中的动态导入类型
```typescript
// 修复前
let createQuoteBundle: any;

// 修复后
import type { createQuoteBundle as CreateQuoteBundleType } from '@/features/quotes/actions';
let createQuoteBundle: CreateQuoteBundleType;
```

### 2. Drizzle 查询中的 any 类型
```typescript
// 修复前
where: (l: any, { eq }: any) => eq(l.tenantId, tenantId)

// 修复后
where: (l: { tenantId: string }, { eq }: { eq: (a: any, b: any) => any }) => eq(l.tenantId, tenantId)
```

### 3. Mock 返回值中的 any 类型
```typescript
// 修复前
vi.mocked(db.query.leads.findFirst).mockResolvedValueOnce(mockLead as any);

// 修复后
vi.mocked(db.query.leads.findFirst).mockResolvedValueOnce(mockLead as Lead);
```

### 4. 组件属性中的 any 类型
```typescript
// 修复前
const handleFilterChange = (filter: any) => { ... }

// 修复后
const handleFilterChange = (filter: string) => { ... }
```

### 5. Map 函数中的索引参数
```typescript
// 修复前
{[1, 2, 3].map((i) => <div key={i} />)}

// 修复后
{[1, 2, 3].map((i, idx) => <div key={idx} />)}
```

## 预期结果
- 修复约 50 个 any 类型错误
- Lint 错误从 80 个减少到约 30 个
- 提高代码类型安全性

## 注意事项
- 修复测试文件时，确保 mock 类型与实际函数签名匹配
- 修复 Drizzle 查询时，使用正确的表类型
- 修复组件属性时，确保类型与实际使用一致