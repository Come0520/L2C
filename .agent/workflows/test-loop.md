# 🎯 全面测试循环 (Strict Test & Pass Loop)

此技能定义了严格的“测试-调试-通过”工作流。Agent 在交付任何任务前必须严格执行此流程。

## Phase 1: 静态分析 (Static Analysis - Shift Left)
**原则**: 尽早拦截低级错误 (语法、类型、Lint)，避免浪费时间运行 E2E。

1. **执行静态检查**:
   // turbo
   pnpm type-check && pnpm lint
   
   - 🔴 **FAIL**: 必须优先修复，禁止进入下一步。
   - 🟢 **PASS**: 进入 Phase 2。

## Phase 2: 精准测试 (Smart Testing)
**原则**: 先跑相关测试，再跑回归测试。

1. **确定测试范围**:
   - 识别修改的文件及其依赖。
   - 选定 **Related Tests** (关联测试)。

2. **执行关联测试**:
   - Unit Test: `pnpm vitest run [related/path]`
   - E2E Test: `pnpm playwright test [related/path]`
   
   _(如果修改范围较大，或无法确定关联，则直接运行全量测试)_

## Phase 3: 结果判定与智能决策 (Decision Tree)

使用以下 **智能决策树** 来处理失败：

#### 🌳 Branch A: 环境故障 (Environment Failure)
- **特征**: DB 连接失败, API 500, Seeding 报错, "Module not found".
- **行动**: `pnpm db:seed:test` 或 重启 `pnpm dev` -> 重试 Phase 2。

#### 🌳 Branch B: 代码故障 (Code Failure)
- **特征**: 具体的 Assertion Error, Logic Error, Type Error。
- **行动**:
  1. 读取错误日志。
  2. 修复代码。
  3. **Regression**: 重新运行失败的测试。

#### 🌳 Branch C: 成功 (Success)
- **特征**: 所有选定的测试通过。
- **行动**: 进入 Phase 4。

## Phase 4: 最终验收 (Definition of Done)

在交付任务前，必须确认以下 checklist 全绿：

- [ ] **Static Check**: `pnpm type-check` ✅
- [ ] **Lint**: `pnpm lint` (无新错误) ✅
- [ ] **Tests**: 目标测试集全部通过 (0 Failed) ✅
- [ ] **Build**: `pnpm build` (如果修改了配置或依赖) ✅

---
> **Rule**: 任何红色的测试失败都视为阻塞性问题 (Blocker)。不要试图 "解释掉" 错误，必须 "修复" 错误。