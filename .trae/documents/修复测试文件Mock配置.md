## 修复测试文件Mock配置计划

### 问题分析
测试失败的主要原因是 Mock 配置不完整，缺少 `supabase` 导出定义。具体来说：

1. **实际模块导出** (`@/lib/supabase/client.ts`)：
   - 导出了 `supabase` 实例
   - 导出了 `createClient` 函数

2. **测试文件Mock配置**：
   - `installation-calendar.test.tsx`：已经正确导出了 `supabase` 和 `createClient`
   - `installations.client.test.ts`：只导出了 `createClient`，缺少 `supabase` 导出

### 修复方案

#### 1. 更新 `installations.client.test.ts` 的 Mock 配置
- 在第27-29行的 Mock 配置中添加 `supabase` 导出
- 确保 `supabase` 导出指向与 `createClient` 相同的 client 对象

#### 2. 验证修复结果
- 运行测试命令，确保所有测试用例通过
- 检查是否还有其他相关测试文件需要修复

### 实施步骤

1. **修改 `installations.client.test.ts`**：
   - 打开文件：`src/services/__tests__/installations.client.test.ts`
   - 在第27-29行的 Mock 配置中添加 `supabase` 导出

2. **运行测试验证**：
   - 执行 `npm test` 或 `yarn test` 命令
   - 确认所有测试用例通过

### 预期结果
- 所有测试用例通过
- 测试文件的 Mock 配置与实际模块导出保持一致
- 代码符合 VibeCoding 敏捷5S规则