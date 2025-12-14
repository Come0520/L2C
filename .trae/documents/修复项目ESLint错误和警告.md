## 问题分析

通过运行ESLint检查，发现项目中存在1791个问题，其中651个错误和1140个警告。主要问题类型包括：

1. **未使用的导入**（如`Database`在多个文件中导入但未使用）
2. **未使用的变量和参数**
3. **使用`any`类型**
4. **导入顺序错误**
5. **不必要的`console`语句**
6. **应该使用`const`而不是`let`的地方**
7. **匿名默认导出**

## 修复计划

### 1. 修复未使用的导入和变量

**目标文件**：
- `src/shared/types/customer.ts`：移除未使用的`Database`导入
- `src/shared/types/lead.ts`：移除未使用的`Database`导入
- `src/shared/types/purchase-order.ts`：移除未使用的`Database`导入
- 其他类似问题的文件

**修复方法**：
```typescript
// 从
import { Database } from './supabase';

// 改为
// 移除未使用的导入
```

### 2. 修复导入顺序错误

**目标文件**：
- `src/services/reconciliationRules.client.ts`：调整导入顺序
- `src/shared/types/auth.ts`：添加导入组之间的空行
- `src/utils/export.ts`：调整导入顺序
- `vitest.setup.ts`：调整导入顺序

**修复方法**：
```typescript
// 按照ESLint规则调整导入顺序，确保相同类型的导入在一起
```

### 3. 修复未使用的参数

**目标文件**：
- `src/services/measurement.client.ts`：将未使用的`reason`参数改为`_reason`
- `src/services/salesOrders.client.ts`：将未使用的`customerName`参数改为`_customerName`
- `src/services/reconciliationRules.client.ts`：将未使用的`ruleId`、`limit`、`offset`参数改为`_ruleId`、`_limit`、`_offset`

**修复方法**：
```typescript
// 从
function example(reason: string) {
  // ...
}

// 改为
function example(_reason: string) {
  // ...
}
```

### 4. 修复应该使用`const`的地方

**目标文件**：
- `src/services/reconciliation.client.ts`：将`query`变量改为`const`
- `src/services/salesOrders.client.ts`：将`selectString`变量改为`const`

**修复方法**：
```typescript
// 从
let query = 'some value';

// 改为
const query = 'some value';
```

### 5. 处理其他警告

**目标文件**：
- 所有使用`any`类型的文件：逐步替换为更具体的类型
- 包含`console`语句的文件：根据需要保留或移除
- `src/utils/analytics.ts`：将匿名默认导出改为命名导出

**修复方法**：
```typescript
// any类型替换示例
// 从
const data: any = fetchData();

// 改为
interface Data {
  // 定义具体类型
}
const data: Data = fetchData();

// 匿名默认导出替换示例
// 从
export default {
  // ...
};

// 改为
const analyticsConfig = {
  // ...
};
export default analyticsConfig;
```

## 实施步骤

1. **批量修复简单问题**：使用ESLint的`--fix`选项自动修复可修复的问题
2. **手动修复剩余问题**：针对无法自动修复的问题逐个处理
3. **验证修复结果**：再次运行ESLint检查确保所有问题都已解决
4. **运行测试**：确保修复不会引入新的问题

## 预期结果

- 所有ESLint错误都被修复
- 大部分ESLint警告被处理
- 代码质量得到显著提升
- 项目可以顺利通过CI/CD检查