---
description: 严格的测试与通过验收流程 (Strict Test & Pass Loop)
---

# 全面测试循环 (Comprehensive Test Loop)

此技能定义了严格的“测试-调试-通过”工作流。Agent 在交付任何任务前必须严格执行此流程。

## 权限配置 (Permissions)

在执行此工作流中的任何命令时，必须严格遵守以下权限规则：

```json
{
  "permissions": {
    "allow": ["bash(pnpm run test*)", "bash(git diff*)", "bash(pnpm vitest*)", "bash(pnpm playwright*)"],
    "ask": ["bash(git push*)", "bash(pnpm publish*)"],
    "deny": ["bash(env:*)", "bash(rm -rf*)"]
  }
}
```

**规则说明 (Rules):**
1. **allow**: 列表中的命令可自动执行，无需单独询问用户（即在工具调用中设置 `SafeToAutoRun: true`）。
2. **ask**: 列表中的命令在执行前必须明确询问用户是否允许（即在工具调用中设置 `SafeToAutoRun: false`，用户需点击 "Accept"）。
3. **deny**: 列表中的命令严禁执行。

1. **分析与准备 (Analyze & Prepare)**
   - 确定受影响的代码范围。
   - 选定需要运行的测试集：
     - **Unit Tests**: `pnpm vitest run [path/to/test]`
     - **E2E Tests**: `pnpm playwright test [path/to/spec]`
   - 确保测试环境（数据库、环境变量）就绪。

2. **执行测试 (Execute Tests)**
   // turbo
   pnpm vitest run && pnpm playwright test

   *(注：根据实际需要替换为具体的测试命令)*

3. **结果判定与循环 (Decision Loop)**
   - **🔴 失败 (FAIL)**:
     - **禁止忽略**：任何红色的测试失败都必须被视为阻塞性问题。
     - **立即调试**：
       1. 读取错误日志。
       2. 检查代码逻辑。
       3. 修复问题。
     - **回归测试**：修复后，必须**重新执行步骤 2**。
     - *不要停止，直到测试变绿。*

4. **最终验收 (Final Verification)**
   - **🟢 通过 (PASS)**:
     - 确认没有引入新的 Lint 错误。
     - 确认没有破坏其他核心流程。
     - 允许交付任务。

此流程不仅是建议，更是强制性的质量门禁。