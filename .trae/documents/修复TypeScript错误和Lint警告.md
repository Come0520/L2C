## 修复计划

### 1. 修复 debounce 泛型签名问题
**问题**：在 `lead-filters.tsx` 中，`debounce` 函数的泛型签名导致 TypeScript 错误
**原因**：导入路径错误，`debounce` 函数实际上位于 `@/lib/utils` 而非 `@/utils/lib-utils`
**修复方案**：
- 修改 `lead-filters.tsx` 中 `debounce` 的导入路径

### 2. 修复 Record<UserRole, …> 键覆盖不完整问题
**问题**：`permissions.ts` 中的 `roleLabels` 对象没有覆盖所有 `UserRole` 枚举值
**原因**：`roleLabels` 对象缺少一些 `UserRole` 枚举值
**修复方案**：
- 完整列出所有 `UserRole` 枚举值的标签映射

### 3. 修复 React Hooks 依赖数组警告
**问题**：ESLint 警告 `react-hooks/exhaustive-deps`
**原因**：`useEffect` 等 Hooks 的依赖数组不完整
**修复方案**：
- 检查并更新所有 Hooks 的依赖数组

## 修复步骤

1. 修复 `lead-filters.tsx` 中的 `debounce` 导入路径
2. 更新 `permissions.ts` 中的 `roleLabels` 对象，添加缺失的角色标签
3. 运行 `npm run type-check` 验证 TypeScript 错误是否修复
4. 运行 `npm run lint --fix` 修复 ESLint 警告

## 预期结果
- 所有 TypeScript 编译错误消失
- 所有 ESLint 警告被清理
- CI/CD 流水线能够成功运行