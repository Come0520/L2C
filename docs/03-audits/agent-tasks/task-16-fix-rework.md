# Task 16 返工：Monitoring 模块两项核心任务均未完成

> **原任务**：清除 @ts-ignore + 接入 AuditService
> **验收结果**：❌ @ts-ignore 仍为 1，❌ AuditService 仍为 0
> **本文档**：精确定位问题 + 给出具体修复方案

---

## ❌ 验收失败详情

| 验收项 | 期望 | 实测 | 状态 |
|:---|:---:|:---:|:---:|
| `@ts-ignore` 数量 | 0 | **1** | ❌ 未完成 |
| `AuditService` 引用数 | ≥ 3 | **0** | ❌ 未完成 |

---

## 问题 1：@ts-ignore 精确位置

**文件**：`src/features/monitoring/__tests__/monitoring-actions.test.ts`
**行号**：第 15 行

```typescript
import { auth, checkPermission } from '@/shared/lib/auth';
// @ts-ignore          ← 第 15 行
import { _setFailUpdate } from '@/shared/api/db';
```

**根因**：`_setFailUpdate` 是 `vi.mock('@/shared/api/db')` 内部用于测试的辅助函数，被从 mock 中导出，但 TypeScript 认为这个导出不存在于类型定义中，所以加了 `@ts-ignore`。

**修复方案**：删除 `@ts-ignore`，同时用 `vi.mocked` 或直接引用 module mock 对象替代：

```typescript
// ❌ 删除这两行：
// @ts-ignore
import { _setFailUpdate } from '@/shared/api/db';

// ✅ 改为：在测试文件中直接通过 mock 模块访问控制变量
// 在 vi.mock('@/shared/api/db', ...) 的 factory 中暴露一个函数，
// 然后用下面的方式获取它（无需 @ts-ignore）：
import * as dbModule from '@/shared/api/db';
const setFailUpdate = (val: boolean) => {
    (dbModule as unknown as { _setFailUpdate: (v: boolean) => void })._setFailUpdate(val);
};
```

**或者更简单的方案**：直接在用到 `_setFailUpdate` 的测试用例里，通过 mock 的 `db.update` 控制行为，完全删除 `_setFailUpdate` 的导入。

查找文件中 `_setFailUpdate` 的所有使用位置：
```powershell
Select-String -Path "src\features\monitoring\__tests__\monitoring-actions.test.ts" -Pattern "_setFailUpdate"
```
→ 如果搜索结果为空（该文件 475 行内无 `_setFailUpdate` 调用），则**直接删除第 15-16 两行**即可，@ts-ignore 及其对应 import 均无用，删除后编译即通过。

---

## 问题 2：AuditService 生产代码完全未接入（=0）

**背景**：测试文件中已有 `AuditService` 的 mock（`monitoring-actions.test.ts` 第 105 行），但**生产代码从未调用 AuditService**，因此 mock 形同虚设。

**需要修改的文件**：`src/features/monitoring/actions/alert-rules.ts`（以及其他包含写操作的 action 文件）

**找出所有写操作（需要接入审计的地方）**：
```powershell
Get-ChildItem src\features\monitoring -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "await db\.(insert|update|delete)"
```

**在每个写操作成功后添加 AuditService 调用**（参考 products 模块的写法，它有 36 处）：

```typescript
import { AuditService } from '@/shared/services/audit-service';

// 示例：在 createAlertRule 成功后：
const [newRule] = await db.insert(riskAlerts).values({...}).returning();

// ✅ 在这里添加：
await AuditService.log({
    action: 'CREATE',
    entityType: 'alert_rule',
    entityId: newRule.id,
    tenantId: session.user.tenantId,
    userId: session.user.id,
    newValue: newRule,
});
```

需要接入的最低 3 个写操作：
1. `createAlertRule` → `AuditService.log({ action: 'CREATE' })`
2. `updateAlertRule` → `AuditService.log({ action: 'UPDATE' })`  
3. `deleteAlertRule` → `AuditService.log({ action: 'DELETE' })`

---

## ✅ 返工验收命令（主线程执行）

```powershell
# 1. @ts-ignore 最终结果（必须为 0）
(Get-ChildItem src\features\monitoring -r -Include "*.ts","*.tsx" | Select-String "@ts-ignore").Count

# 2. AuditService 接入数（必须 ≥ 3）
(Get-ChildItem src\features\monitoring -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "AuditService").Count

# 3. 测试全通过
npx vitest run src/features/monitoring

# 4. tsc 零错误
npx tsc --noEmit 2>&1 | Select-String "monitoring"
```

## 交付说明
返工完成后宣告"Task 16 返工完成"，逐项报告以上 4 条命令的**实际数字输出**。
