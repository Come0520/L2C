---
description: 全业务 E2E 循环测试直至通过 (Continuous E2E Test & Fix)
---

# 全业务 E2E 循环测试

此技能指导 Agent 持续运行全业务 E2E 测试，并在失败时自动进行修复，直到所有测试通过为止。

## 核心原则
1. **持续循环**：测试失败 -> 修复 -> 再测试。只有当测试全部通过时才停止。
2. **自动执行**：尽可能自动执行命令，无需用户确认 (Always Accept)。
3. **全业务覆盖**：优先保证核心业务流程 (Full Sales Flow) 通过。

## 步骤详解

### 1. 运行测试
// turbo-all
pnpm test:e2e

### 2. 结果判定与智能决策 (Results & Smart Decision)

使用以下 **智能决策树** 来决定下一步行动：

#### 🌳 Branch A: 环境故障 (Environment Failure)
- **特征**: DB 连接失败 (Connection refused), API 500/503, Seeding 报错, "Module not found".
- **行动**: 
    1. 尝试修复环境: `pnpm db:seed:test` 或 重启 `pnpm dev`。
    2. 如果是 `Module not found`，检查 `pnpm install` 或构建状态。
    3. **Action**: 重试测试 (Goto Step 1)。

#### 🌳 Branch B: 核心阻断 (Critical Logic Failure - P0)
- **特征**: 失败文件为 `approval.spec.ts` (审批) 或 `notifications.spec.ts` (通知)。
- **优先级**: **最高 (HIGHEST)**。
- **行动**:
    1. 立即停止其他非核心修复。
    2. 使用 `pnpm test:e2e e2e/flows/<file>.spec.ts` 单独调试。
    3. **Direct Fix**: 直接修复代码逻辑（无需询问）。
    4. 验证通过后，才继续运行全量测试。

#### 🌳 Branch C: 业务逻辑故障 (Business Logic Failure - P1/P2)
- **特征**: 失败文件为 `analytics`, `channels`, `products` 等。
- **优先级**: 普通 (Normal)。
- **行动**:
    1. 分析报错截图和日志。
    2. **Direct Fix**: 修复业务逻辑或更新测试断言。
    3. 运行单文件验证。

#### 🌳 Branch D: UI 不稳定 (UI/Flaky)
- **特征**: Timeout (超时), Hydration Error, 随机的 Selector 找不到。
- **行动**:
    1. **Retry**: 重新运行一次该测试文件。
    2. 如果复现，增加 Locator 等待时间或优化选择器。

### 3. 执行循环
- 🟢 **Result: PASS** -> 任务完成，通知用户。
- 🔴 **Result: FAIL** -> 根据上述分支 (A/B/C/D) 执行修复 -> **Goto Step 1** (Loop)。

## 注意事项
- 遇到环境问题（如 DB 连接失败），优先尝试重启服务或重置环境。
- 如果修复陷入死循环（反复失败），请尝试回退最近一次变更或通过 `notify_user` 寻求帮助，但在此之前应尽力尝试自行解决。
