# TypeScript 错误集中修复计划

## 1. 错误分析

### 1.1 Blob 构造参数问题
- **位置**：`src/app/orders/status/[status]/page.tsx:326`
- **问题**：`URL.createObjectURL(blob)` 中的 `blob` 类型可能不正确
- **原因**：`batchService.exportData` 返回的 `blob` 类型定义可能存在问题

### 1.2 Record<UserRole, …> 键覆盖不完整问题
- **位置**：`src/app/page.tsx:319,350`
- **问题**：`UserRole` 类型包含 26 种角色，但 `roleMap` 和 `roleTodoData` 只覆盖了部分角色
- **缺少的角色**：`user`、`pro`、`admin`、`DESIGNER`、`CUSTOMER`

### 1.3 debounce 泛型签名问题
- **位置**：`src/features/leads/components/list/lead-filters.tsx:46,55`
- **问题**：`debounce` 函数的泛型签名与实际使用可能不匹配
- **当前定义**：`export function debounce<F extends (...args: any[]) => any>(func: F, wait: number = 300): ((...args: Parameters<F>) => void) & { clear: () => void }`

## 2. 修复方案

### 2.1 修复 Blob 构造参数问题
- 检查 `batchService.exportData` 函数的返回类型定义
- 确保返回的 `blob` 类型为 `Blob` 或兼容类型
- 如需要，添加类型断言确保类型安全

### 2.2 修复 Record<UserRole, …> 键覆盖问题
- 在 `roleMap` 和 `roleTodoData` 中添加所有 `UserRole` 类型的角色
- 为缺失的角色添加合理的默认值
- 确保映射关系完整，避免类型错误

### 2.3 修复 debounce 泛型签名问题
- 优化 `debounce` 函数的泛型定义，使其更精确
- 确保泛型约束与实际使用场景匹配
- 检查并修复调用处的类型使用

## 3. 具体实施步骤

### 3.1 修复 app/page.tsx 中的角色映射问题
- 添加缺失的角色到 `roleMap`
- 添加缺失的角色到 `roleTodoData`

### 3.2 修复 lead-filters.tsx 中的 debounce 泛型问题
- 检查 `debounce` 函数的使用方式
- 优化 `debounce` 函数的泛型定义（如果需要）

### 3.3 修复 orders/status/[status]/page.tsx 中的 Blob 问题
- 检查 `batchService.exportData` 的类型定义
- 确保 `blob` 类型正确

### 3.4 验证修复结果
- 运行类型检查（`npm run typecheck`）
- 运行 lint 检查（`npm run lint`）
- 运行测试（`npm run test`）

## 4. 预期效果
- ✅ 所有 TypeScript 错误修复
- ✅ 代码类型安全提高
- ✅ 函数泛型签名更精确
- ✅ 角色映射完整

## 5. 代码规范
- 严格遵循项目命名规范
- 保持代码可读性和可维护性
- 添加必要的注释说明
- 确保类型安全

## 6. 风险评估
- 修复范围有限，风险较低
- 所有修复都在类型层面，不影响运行时逻辑
- 可以通过类型检查和测试验证修复效果
