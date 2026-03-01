# [Agent Task 3] After-Sales 模块测试与文档补强

> 任务类型：测试补强 + 文档同步
> 优先级：P1
> 预计工时：3 天
> 验收人：主线程（Antigravity）

---

## 背景

`after-sales` 模块当前评分 **6.9/10（L3）**，距 L4 仅差最后一步：
- **D3 测试覆盖：7/10** — 10 个测试文件，但工单全流程路径覆盖不完整
- **D4 文档完整性：7/10** — `售后.md` 需求文档与当前新增功能（责任追溯、费用关闭）未完全同步

完成本任务后，D3+D4 预期从 7 提升至 8，模块整体从 L3 升至 L4。

---

## 工作范围

| 允许修改 | 说明 |
|:---|:---|
| `src/features/after-sales/` | 仅测试文件或小范围修复 |
| `docs/02-requirements/modules/售后.md` | 需求文档同步 |

**禁止**：修改其他 features 的代码。

---

## 执行步骤

### Step 1：了解现有结构

```bash
# 查看现有测试
ls src/features/after-sales/__tests__/

# 查看现有需求文档
cat "docs/02-requirements/modules/售后.md"

# 查看 after-sales 源码结构
ls src/features/after-sales/actions/
```

### Step 2：补充集成测试（核心任务）

在 `src/features/after-sales/__tests__/` 下，新增 ≥ 3 个涵盖完整工单流程的测试：

**必须覆盖的场景**：

```typescript
// 场景 1：售后工单完整生命周期
// 创建工单 → 受理 → 处理中 → 关闭
it('should complete full ticket lifecycle: create → accept → process → close', async () => {
  // 模拟 db、auth、AuditService
  // 创建工单
  // 验证状态流转
  // 验证 AuditService.recordFromSession 被调用（最重要！）
  expect(AuditService.recordFromSession).toHaveBeenCalledWith(
    expect.anything(), 'after_sales_tickets', expect.any(String), 'UPDATE', expect.anything()
  )
})

// 场景 2：责任追溯通知（liability notice）全流程
// 创建责任通知 → 承认 → 处理
it('should create and process liability notice with audit trail', async () => { ... })

// 场景 3：费用关闭（cost closure）操作
// 关闭售后费用 → 验证审计记录
it('should close after-sales cost and record audit log', async () => { ... })

// 场景 4（加分）：多租户隔离验证
// 不同租户的工单不能互相访问
it('should enforce tenant isolation for tickets', async () => { ... })
```

**编写规范**：
- 参考已有的 `ticket-actions.test.ts`、`liability-actions.test.ts` 的 mock 风格
- 必须验证 `AuditService.recordFromSession` 被正确调用
- 使用 `vi.mock` 模拟 `@/shared/lib/audit-service`

### Step 3：同步需求文档

打开 `docs/02-requirements/modules/售后.md`，检查并补充以下内容（如文档中缺失）：

**需要确认文档覆盖的功能点**：
- [ ] 责任追溯通知（liability notice）的完整业务流程
- [ ] 费用关闭（cost-closure）的触发条件和结果
- [ ] 对账（reconciliation）的数据来源和计算逻辑
- [ ] 工单审计追踪——哪些操作会触发 AuditService

如果文档中已有上述内容，只需确认与当前代码行为一致即可；如有出入，以代码行为为准更新文档。

### Step 4：验证

```bash
cd c:\Users\bigey\Documents\Antigravity\L2C

# 类型检查
npx tsc --noEmit

# 运行 after-sales 模块测试（全部通过）
npx vitest run src/features/after-sales

# 确认新增测试
npx vitest run src/features/after-sales --reporter=verbose 2>&1 | grep -E "✓|×|Tests"
```

---

## 验收标准

| 检查项 | 目标 |
|:---|:---|
| 新增测试用例数 | **≥ 3 个**工单流程集成测试 |
| 文档同步 | 售后.md 覆盖责任追溯、费用关闭、对账 |
| `npx tsc --noEmit` | 零错误 |
| `npx vitest run src/features/after-sales` | **全部通过** |

---

## 返回报告格式

```
[Agent 3 - After-Sales]

## 新增测试
- 文件：src/features/after-sales/__tests__/xxx.test.ts
- 新增用例：X 个（列出用例名称）
- AuditService 验证：✅ 已在所有新测试中验证

## 文档更新
- docs/02-requirements/modules/售后.md
- 新增/更新内容：（简要描述）

## 验证结果
- tsc --noEmit：✅ / ❌
- vitest after-sales：✅ X/X 通过 / ❌

## 需要主线程注意的问题
```
