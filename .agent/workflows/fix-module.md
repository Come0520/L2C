---
description: 读取指定模块的 problems.md，使用 TDD 逐条修复审计问题，每条修复后标记 ✅
---

# /fix-module 工作流

> **调用格式**：`/fix-module module=leads`
> **前置条件**：`docs/03-audits/{module}/problems.md` 必须已存在（先运行 `/audit-module`）
> **核心铁律**：每一条修复必须遵循 TDD 红-绿-重构循环，不得跳过

---

## Step 0：初始化

1. 读取 `docs/03-audits/{module}/problems.md`，统计待修复问题数量
2. 读取 `docs/03-audits/错题本.md`，了解每类问题的正确修复模式
3. 读取 `docs/03-audits/audit-queue.md`，将本模块"修复状态"更新为 🔧 修复中
4. 优先顺序：**P0 → P1 → P2**，P0 必须全部修复，P1 尽量修复，P2 酌情处理
5. **【强制】读取 TDD Skill**：使用 `view_file` 工具读取以下文件，完整阅读后才能开始修复：
   ```
   .agent/skills/test-driven-development/SKILL.md
   ```
   > 这不是建议，是前置条件。未读取 TDD Skill 即开始修复 = 违规，必须从头开始。

---

## Step 1：逐条修复（TDD 循环）

对 problems.md 中**每一条** `- [ ]` 未完成项，依次执行以下流程：

> **铁律（来自 TDD Skill Iron Law）**：
> ```
> NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
> ```
> 禁止"先改代码再补测试"。违反即删除代码，从头开始。

### 1.1 理解问题

- 打开 problems.md 中记录的**精确文件路径和行号**
- 阅读报告中的问题描述，结合错题本中的"典型反例"和"正确写法"理解预期行为

### 1.2 🔴 RED — 先写失败测试

根据问题类型选择测试文件位置：

| 问题类型 | 测试文件位置 |
|:---|:---|
| Server Action 鉴权缺失 (D3-001) | `src/features/{module}/actions/__tests__/` |
| 数据库查询问题 (D3-002, D4-001) | `src/features/{module}/actions/__tests__/` |
| UI 组件问题 (D2, D5) | `src/features/{module}/components/__tests__/` |
| 工具函数问题 | 同文件目录下 `__tests__/` |

**必须在此处运行测试确认 RED（失败）状态**：
```bash
# turbo
pnpm test path/to/new-test-file.test.ts
```
确认测试失败且失败原因正确（功能缺失，而非语法错误）才能继续。

### 1.3 🟢 GREEN — 最小修复代码

按照错题本中的"正确写法"实现最小改动通过测试。

**P0 安全问题的修复模板**（参考 `docs/03-audits/错题本.md`）：
- D3-001 权限锁：加 `await auth()` + `checkPermission(session, 'xxx.xxx')`
- D3-002 租户隔离：加 `.where(eq(table.tenantId, session.user.tenantId))`
- D3-003 Zod 校验：在 Action 顶部加 Zod Schema 并调用 `.safeParse()`

**修复代码完成后，运行测试确认 GREEN（全部通过）**：
```bash
# turbo
pnpm test path/to/new-test-file.test.ts
```

### 1.4 🔵 REFACTOR — 清理提升

测试全绿后进行代码整洁：
- 提取重复的鉴权/校验逻辑
- 改善变量命名和注释
- **不新增功能，始终保持测试绿色**

再次运行全量测试确认无回归：
```bash
# turbo
pnpm test --testPathPattern="src/features/{module}"
```

### 1.5 ✅ 标记完成

**当且仅当**满足以下所有条件，才能将 problems.md 中对应条目的 `- [ ]` 改为 `- [x]`：

```
✅ 测试先于代码编写（见过 RED 失败）
✅ pnpm test 全绿（无新失败）
✅ pnpm build 无类型错误（P0 问题强制）
```

在 problems.md 中更新为：
```markdown
- [x] [D3-001] `features/leads/actions/create.ts:12` — createLead Server Action 无鉴权 ✅ 已修复(2026-03-10)
```

---

## Step 2：批次验收（每完成 5 条或 P0 全部完成后执行）

```bash
# turbo
pnpm test --testPathPattern="src/features/{module}"
```

**如果有测试失败**：立即停止后续修复，先修好回归再继续。

---

## Step 3：E2E 验收（可选，P0 问题完成后）

```bash
# turbo
pnpm e2e:run --grep "{module}"
```

若有相关 E2E 测试文件，运行验证核心业务流程未被修复破坏。

---

## Step 4：收尾

### 当 P0 全部完成时

1. 更新 problems.md 顶部总览表的数字
2. 将 `audit-queue.md` 中本模块"修复状态"更新：
   - P0 全完成 → `🟠 P1修复中`
   - P0+P1 全完成 → `✅ 已完成`
3. 输出本次修复摘要：修复了哪些问题，跳过了哪些（附原因）

### 当所有问题（P0+P1+P2）完成时

1. 将 `audit-queue.md` 中本模块移至"已完成"表格
2. 更新 `docs/03-audits/audit-queue.md` 中双状态均改为 ✅
3. 将 `docs/03-audits/{module}/problems.md` 顶部加一行：
   ```
   > 🎉 修复完成：{YYYY-MM-DD} | P0: N条 | P1: N条 | P2: N条
   ```

---

## 修复决策树

```
收到一条问题
  ↓
能理解问题描述和文件位置？
  ├── 否 → 在 problems.md 该条目后追加备注：「需要人工确认」，跳过
  └── 是 → 调用 TDD skill
              ↓
           写失败测试 (RED)
              ↓
           确认失败原因正确？
              ├── 否 → 修改测试，重新 RED
              └── 是 → 写最小修复代码 (GREEN)
                          ↓
                       测试全绿？
                          ├── 否 → 修改实现，不改测试
                          └── 是 → 重构 (REFACTOR)
                                      ↓
                                   标记 [x] ✅
```

---

## 禁止事项

- ❌ 禁止先修改代码再写测试
- ❌ 禁止 `- [x]` 标记未通过测试的条目
- ❌ 禁止跳过 P0 问题去做 P2
- ❌ 禁止将"问题标记为忽略"（仅相公本人可以在 problems.md 中注明 `// WONTFIX: 原因`）
- ❌ 禁止在同一条修复中引入新功能

---

## 调用示例

```bash
# 先审计
/audit-module module=leads

# 查看生成的问题报告
# docs/03-audits/leads/problems.md

# 再修复
/fix-module module=leads
```

双 Agent 可并行工作：
- Agent A 正在 `/fix-module module=leads`
- Agent B 同时 `/audit-module module=customers`
