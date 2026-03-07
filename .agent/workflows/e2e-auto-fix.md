---
description: 全业务 E2E 循环测试直至通过 (Continuous E2E Test & Fix)
---

# 全业务 E2E 循环测试

此工作流指导 Agent 持续运行全业务 E2E 测试，并在失败时通过系统化调试和 TDD 驱动修复，直到所有测试通过为止。

## 核心原则

1. **持续循环**：测试失败 -> 根因分析 -> TDD 修复 -> 再测试。只有当测试全部通过时才停止。
2. **自动执行**：尽可能自动执行命令，无需用户确认 (Always Accept)。
3. **全业务覆盖**：优先保证核心业务流程 (Full Sales Flow) 通过。
4. **先诊断后治疗**：严禁未经根因分析就动手修复。
5. **熔断保护**：同一测试文件修复 ≥ 3 次仍失败，必须中断循环并请求用户决策。

## 步骤详解

### 0. 前置检查：强制全量构建（Pre-flight Build Gate）

// turbo-all

> ⚠️ **铁律**：E2E 测试在 standalone 生产构建产物上运行（非 dev 模式）。**每次跑 E2E 前必须重新构建**，禁止复用旧产物——旧产物不包含本次代码变更，会导致测试通过但上线后仍有 Bug（这是本项目曾经发生的真实事故：`unstable_cache` 和 `nuqs` 错误在 E2E 通过后才在线上暴露）。

```bash
# 强制删除旧构建产物，确保本次测试的是最新代码
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
pnpm build
```

- 🟢 **构建成功（无 Error）** → 继续 Step 1。
- 🔴 **构建失败** → **立即停止**，优先修复构建错误（类型错误、模块缺失、`unstable_cache` 违规等）。修复后从 Step 0 重新开始。

> **为什么要删掉旧产物再构建？**  
> `playwright.config.ts` 配置了 `reuseExistingServer: !process.env.CI`，在本地默认复用已有的 standalone 服务器。如果不清除旧产物重新构建，Playwright 会直接拿上一次构建的 `.next/standalone` 跑测试，新代码根本没被打包进去。

### 1. 运行测试

// turbo-all

```bash
pnpm test:e2e
```

**记录本轮信息**：

- 当前轮次编号（从 1 开始递增）
- 失败的测试文件列表及错误摘要
- 与上一轮相比的变化（新增失败 / 已修复 / 仍然失败）

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
  3. **根因分析 (必须)**：调用 `systematic-debugging` 技能，完成 Phase 1 (根因调查) 和 Phase 2 (模式分析)，明确失败的根本原因后再动手。
  4. **TDD 修复**：调用 `test-driven-development` 技能，通过 RED-GREEN-REFACTOR 流程驱动代码修复（无需询问）。
  5. 验证通过后，才继续运行全量测试。

#### 🌳 Branch C: 业务逻辑故障 (Business Logic Failure - P1/P2)

- **特征**: 失败文件为 `analytics`, `channels`, `products` 等。
- **优先级**: 普通 (Normal)。
- **行动**:
  1. 分析报错截图和日志。
  2. **根因分析 (必须)**：调用 `systematic-debugging` 技能定位根因，禁止直接猜测修改。
  3. **TDD 修复**：调用 `test-driven-development` 技能，通过 TDD 流程修复业务逻辑或更新测试断言。
  4. 运行单文件验证。

#### 🌳 Branch D: UI 不稳定 (UI/Flaky)

- **特征**: Timeout (超时), Hydration Error, 随机的 Selector 找不到。
- **行动**:
  1. **Retry**: 重新运行一次该测试文件确认是否可复现。
  2. 如果不可复现（Flaky），标记后跳过，继续全量测试。
  3. 如果可复现，调用 `systematic-debugging` 技能分析根因，然后通过 `test-driven-development` 技能用 TDD 流程修复选择器或等待逻辑。

### 3. 熔断机制 (Circuit Breaker)

为每个失败的测试文件维护一个 **修复计数器**：

| 修复次数  | 行动                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 第 1-2 次 | 正常走 Branch B/C/D 的修复流程                                                                                                                    |
| 第 3 次   | ⚠️ **强制中断**：停止对该文件的自动修复，调用 `notify_user` 向用户报告"该测试已尝试修复 3 次仍失败"，附上根因分析和已尝试的修复方案，等待用户决策 |

> **注意**：计数器按**测试文件**粒度统计，不同文件的计数器相互独立。

### 4. 执行循环

```
🟢 Result: ALL PASS
  └─> 进入 Step 5 (完成验证)

🔴 Result: FAIL
  └─> 检查熔断计数器
       ├─ 未触发熔断 -> 根据 Branch A/B/C/D 执行修复 -> Goto Step 1 (Loop)
       └─ 已触发熔断 -> notify_user 请求帮助
```

### 5. 完成验证 (Completion Gate)

当所有测试通过后，**不得立即宣布完成**。必须调用 `verification-before-completion` 技能执行最终验证：

1. **确认测试输出完整性**：检查测试命令的完整输出，确认 0 failures、无 skipped、无 warnings。
2. **确认无遗漏修复**：回顾本次循环中所有修改的文件，确保没有引入副作用。
3. **生成修复报告**：汇总本次自动修复的所有变更，包括：
   - 总循环轮次
   - 每个被修复的测试文件及对应的根因和修复方案
   - 最终全量测试的通过截图/日志
4. **通知用户**：将修复报告通过 `notify_user` 发送给用户。

## 注意事项

- 遇到环境问题（如 DB 连接失败），优先尝试重启服务或重置环境。
- 所有修复必须先走 `systematic-debugging` 定位根因，再通过 `test-driven-development` 用 TDD 流程驱动修复。
- 严格遵守熔断机制：同一文件 ≥ 3 次修复失败必须中断，禁止无限循环。
- 每轮循环都应记录轮次和结果变化，便于事后回溯。
