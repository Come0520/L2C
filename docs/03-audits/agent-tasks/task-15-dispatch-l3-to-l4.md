# Task 15: Dispatch 模块 L3 → L4 升级

> **任务性质**：代码改进（编程任务）
> **目标成熟度**：L3 → L4（当前综合 6.8，目标 7.5+）
> **模块路径**：`src/features/dispatch/`
> **评估人**：主线程 AI（不参与编程，只做验收）

---

## 🔍 实测发现的核心问题

经主线程代码扫描，Dispatch 模块当前状态如下：

| 指标 | 当前值 | 目标 | 状态 |
|:---|:---:|:---:|:---:|
| 测试文件数 | 3 | ≥ 5 | ⚠️ 偏少 |
| `any` 类型 | 1 | 0 | ⚠️ |
| `logger.` 调用（运营日志） | **0** | ≥ 10 | 🔴 最严重 |
| `AuditService` 引用 | 6 | ≥ 10 | ⚠️ 偏低 |
| `tenantId` 过滤 | 21 | 已足够 | ✅ |
| `createSafeAction` 使用 | 到位 | — | ✅ |
| TODO 数 | 0 | 0 | ✅ |

**最大短板：运营日志（logger）完全缺失（= 0 处）**。这是 D7【可运维性】评分极低的直接原因。生产环境如果调度出问题，完全无法通过日志定位。

---

## 📋 必须完成的具体任务

### 任务一：全面补充运营日志（最高优先级，D7 提升）

**背景**：检查 `src/features/dispatch/actions/` 下所有 server action 文件。当前 `logger` 引用数 = 0，必须补充。

**要求**：
1. 在每个关键写操作（创建/分配/更新/完成任务等）的 action 中，添加结构化日志：
   ```typescript
   import { logger } from '@/lib/logger'; // 使用项目已有的 logger
   
   // 操作开始时记录：
   logger.info('[Dispatch] 开始分配调度任务', { taskId: data.id, tenantId, operatorId: session.user.id });
   
   // 操作成功时记录：
   logger.info('[Dispatch] 调度任务分配成功', { taskId: result.id, assigneeId: data.assigneeId });
   
   // 操作失败/异常时记录：
   logger.warn('[Dispatch] 调度任务不存在或无权操作', { taskId: data.id, tenantId });
   ```

2. **每个写操作至少 2 条日志**（开始 + 结果）
3. 错误分支必须有 `logger.warn` 或 `logger.error`
4. 不要使用 `console.log`，只用 `logger`

**验收命令**：
```powershell
(Get-ChildItem src\features\dispatch -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "logger\.").Count
# 目标：≥ 10
```

---

### 任务二：清除 any 类型（D2 提升）

**要求**：搜索 `src/features/dispatch/` 下非测试文件中的 `: any`，逐一替换为明确类型或 `unknown` + 类型收窄。

**验收命令**：
```powershell
(Get-ChildItem src\features\dispatch -r -Include "*.ts","*.tsx" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String ": any\b").Count
# 目标：0
```

---

### 任务三：扩充测试覆盖（D3 提升）

**背景**：当前 3 个测试文件（安全集成测试已很完善），需要补充**业务逻辑单元测试**。

**要求**：在 `src/features/dispatch/__tests__/` 或 `src/features/dispatch/actions/__tests__/` 下新增至少 **2 个**测试文件，每个测试文件至少 **5 个用例**：

**建议新增的测试场景**：
- **场景 A：任务分配流程测试** (`task-assignment.test.ts`)
  - 正常分配一个调度任务（断言返回更新后的任务状态）
  - 分配给不存在的用户时的错误处理
  - 租户 A 的用户无法分配租户 B 的任务（跨租户防护）
  - 已完成的任务不能被重新分配

- **场景 B：任务状态流转测试** (`task-status.test.ts`)
  - 任务从未分配 → 进行中 → 已完成的状态流转
  - 非法状态跳转的错误处理（如直接从未分配跳到完成）
  - 完成任务时必须提供完成备注

**注意**：测试必须**使用 mock 数据库**（和 dispatch 模块内现有的测试文件写法保持一致），不要真实查询数据库。参考 `src/features/dispatch/actions/__tests__/security.integration.test.ts` 的 mock 模式编写。

**验收命令**：
```powershell
(Get-ChildItem src\features\dispatch -r -Include "*.test.ts","*.test.tsx").Count
# 目标：≥ 5
```

---

### 任务四：补充 UI Loading/Error 三态（D5 提升）

**背景**：检查 `src/features/dispatch/components/`（若存在）或相关页面组件，确保：
1. 数据加载时有 `Skeleton` 或 `loading` 状态显示
2. 发生错误时有 `ErrorBoundary` 或明确的错误信息展示
3. 无数据时有 `Empty` 空状态显示

**验收命令**：
```powershell
(Get-ChildItem src\features\dispatch -r -Include "*.tsx" | Select-String "Skeleton|loading|skeleton").Count
# 目标：≥ 3
```

---

## ⚠️ 禁止事项
- **禁止删除或修改**已有的安全相关代码（tenantId 硬隔离是本模块的最重要资产）
- **禁止修改**任何已通过的测试用例
- 只能在现有测试通过的基础上**新增**测试

---

## ✅ 最终验收清单（主线程将逐一执行以下命令）

```powershell
# 1. 运营日志数量
(Get-ChildItem src\features\dispatch -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "logger\.").Count
# 期望：≥ 10

# 2. any 类型清零
(Get-ChildItem src\features\dispatch -r -Include "*.ts","*.tsx" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String ": any\b").Count
# 期望：0

# 3. 测试文件数
(Get-ChildItem src\features\dispatch -r -Include "*.test.ts","*.test.tsx").Count
# 期望：≥ 5

# 4. 所有测试通过
npx vitest run src/features/dispatch
# 期望：Exit code 0，0 个失败

# 5. TypeScript 编译
npx tsc --noEmit 2>&1 | Select-String "dispatch"
# 期望：无输出（零错误）
```

## 交付说明
完成后宣告"Task 15 完成"，**逐项**报告每条验收标准的实际结果数字。
