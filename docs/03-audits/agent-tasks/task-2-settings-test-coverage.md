# [Agent Task 2] Settings 模块测试覆盖补强

> 任务类型：测试补强 + 清理
> 优先级：P1
> 预计工时：3 天
> 验收人：主线程（Antigravity）

---

## 背景

`settings` 模块当前评分 **6.9/10（L3）**，最薄弱维度是：
- **D3 测试覆盖：6/10** — 共 15 个测试文件，但权限矩阵（roles-management）的核心 Actions 覆盖不足
- **D8 性能：6/10** — 权限矩阵页面渲染可能存在性能瓶颈
- **1 处 TODO** 需要清理

完成本任务后，D3 预期从 6 提升至 8，模块整体从 L3 升至 L4。

---

## 工作范围

**只修改** `src/features/settings/` 目录下的文件。

---

## 执行步骤

### Step 1：了解现有测试结构

```bash
# 查看现有测试文件
ls src/features/settings/__tests__/
ls src/features/settings/actions/__tests__/

# 查看 roles-management actions（主要补强目标）
cat src/features/settings/actions/roles-management.ts
```

### Step 2：清理 TODO

```bash
# 找到 TODO
grep -rn "TODO\|FIXME" src/features/settings \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="__tests__"
```

处理方式同 Task 1：已实现则删除，未实现则评估实现。

### Step 3：为 roles-management 补充测试（核心任务）

在 `src/features/settings/actions/__tests__/` 目录下，新建或补充测试文件，需覆盖以下 ≥ 6 个测试用例：

**必须覆盖的测试场景**：

```typescript
// 1. 创建角色 — 成功路径
it('should create a new role with permissions', async () => { ... })

// 2. 创建角色 — 重复名称应报错
it('should reject duplicate role names', async () => { ... })

// 3. 更新角色权限 — 成功路径
it('should update role permissions', async () => { ... })

// 4. 删除角色 — 成功路径（无关联用户）
it('should delete role with no assigned users', async () => { ... })

// 5. 删除角色 — 有关联用户时应拒绝或迁移
it('should reject deletion of role with assigned users', async () => { ... })

// 6. 权限矩阵保存 — 批量权限更新
it('should batch update permission matrix', async () => { ... })

// 7. （加分）权限变更应记录 AuditService
it('should log audit when permissions are changed', async () => { ... })
```

**测试编写规范**：
- 使用 `vi.mock` 模拟 `db`、`auth`、`AuditService`
- 参考同模块已有的测试文件编写风格（查看 `split-rules-actions.test.ts`）
- 每个测试要有明确的 `expect` 断言，不要只测"不报错"

### Step 4：验证

```bash
cd c:\Users\bigey\Documents\Antigravity\L2C

# 类型检查
npx tsc --noEmit

# 运行 settings 模块测试（必须全部通过）
npx vitest run src/features/settings

# 确认新增测试数量
npx vitest run src/features/settings --reporter=verbose 2>&1 | grep -E "✓|×|Tests"
```

---

## 验收标准

| 检查项 | 目标 |
|:---|:---|
| 新增测试用例数 | **≥ 6 个** roles-management 测试 |
| TODO 数量 | **0** |
| `npx tsc --noEmit` | 零错误 |
| `npx vitest run src/features/settings` | **全部通过** |

---

## 返回报告格式

```
[Agent 2 - Settings]

## 清理情况
- TODO：1 → 0（描述处理方式）

## 新增测试
- 文件：src/features/settings/actions/__tests__/xxx.test.ts
- 新增用例：X 个（列出用例名称）

## 验证结果
- tsc --noEmit：✅ / ❌
- vitest settings：✅ X/X 通过 / ❌

## 需要主线程注意的问题
```
