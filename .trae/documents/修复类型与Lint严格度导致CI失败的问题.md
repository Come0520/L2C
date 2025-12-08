### 修复计划

1. **修复 register 函数参数不匹配问题**
   - **文件**：`src/app/auth/register/page.tsx`
   - **问题**：register 函数调用时传递了4个参数，但函数签名只接受3个参数
   - **修复**：移除不必要的邮箱参数，使用正确的参数顺序调用 register 函数

2. **修复 RoleMap 键覆盖问题**
   - **文件**：`src/app/page.tsx`
   - **问题**：roleMap 中存在键值覆盖问题（如 CUSTOMER 和 OTHER_CUSTOMER 都映射为"客户"）
   - **修复**：确保每个 UserRole 键都有唯一的中文名称映射

3. **修复 LeadFilters 中的 Hooks 依赖问题**
   - **文件**：`src/features/leads/components/list/lead-filters.tsx`
   - **问题**：debounce 函数直接调用在组件内部，导致每次渲染创建新函数实例
   - **修复**：使用 useCallback 包装 debounce 函数，确保函数实例稳定

4. **运行验证命令**
   - 运行 `npm run typecheck` 确保类型检查通过
   - 运行 `npm run lint` 确保代码风格符合要求
   - 运行 `npm run test:ci` 确保所有测试通过

### 修复步骤

1. 首先修复 register 函数参数问题，这是导致 typecheck 失败的直接原因
2. 然后修复 RoleMap 键覆盖问题，确保类型映射完整
3. 最后修复 LeadFilters 中的 Hooks 依赖问题，优化性能
4. 运行所有验证命令，确保修复成功

### 预期结果

- `npm run typecheck` 零错误
- `npm run lint` 零警告
- `npm run test:ci` 全绿
- CI 构建能够顺利通过