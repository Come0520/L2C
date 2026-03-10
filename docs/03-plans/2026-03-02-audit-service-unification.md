# AuditService 统一化 (Unification) 实施方案

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将项目中两个并存的 AuditService 合并为单一实现，彻底消除 `lib/audit-service` 与 `services/audit-service` 双路径带来的维护混乱。

**Architecture:**

- 保留 `@/shared/services/audit-service`（新版，更完善，含 HTTP headers 元数据、traceId 等）作为唯一实现
- 在新版中增加向后兼容的 `record()` 和 `recordFromSession()` 方法（内部委托给 `log()`）
- 同时保留 `logAuditEvent()` 独立导出函数的兼容接口
- 将 35 个生产文件 + 88 处测试 mock 的 import 路径从 lib 迁移到 services
- 删除 `@/shared/lib/audit-service.ts`

**Tech Stack:** TypeScript, Vitest, PowerShell (pwsh 7+)

---

## 任务 1：扩展 services/audit-service.ts 以支持旧版 API

**文件：**

- 修改：`src/shared/services/audit-service.ts`

**背景：** lib 版有 `record(params, tx?)` 和 `recordFromSession(session, tableName, recordId, action, diff?, tx?)` 两个方法；必须在 services 版中添加这两个方法，使旧调用点不需要改逻辑、只改 import。

**步骤 1：在 AuditService class 中追加兼容方法**

在 `services/audit-service.ts` 的 `AuditService` class 内部、`logBatch` 方法之后添加：

```typescript
/**
 * 向后兼容方法：直接传参形式记录审计日志（委托给 log）
 * 对应旧版 lib/audit-service.ts 的 AuditService.record()
 */
static async record(
    params: {
        tenantId: string;
        userId?: string;
        tableName: string;
        recordId: string;
        action: string;
        changedFields?: Record<string, unknown>;
        oldValues?: Record<string, unknown>;
        newValues?: Record<string, unknown>;
    },
    tx?: DB | DbTransaction
): Promise<void> {
    const runner = tx ?? db;
    await AuditService.log(runner, params);
}

/**
 * 向后兼容方法：从 Session 中便捷记录（委托给 log）
 * 对应旧版 lib/audit-service.ts 的 AuditService.recordFromSession()
 */
static async recordFromSession(
    session: { user?: { tenantId?: string; id?: string } } | null,
    tableName: string,
    recordId: string,
    action: string,
    diff?: {
        old?: Record<string, unknown>;
        new?: Record<string, unknown>;
        changed?: Record<string, unknown>;
    },
    tx?: DB | DbTransaction
): Promise<void> {
    if (!session?.user?.tenantId) return;
    const runner = tx ?? db;
    await AuditService.log(runner, {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        tableName,
        recordId,
        action,
        oldValues: diff?.old,
        newValues: diff?.new,
        changedFields: diff?.changed,
    });
}
```

**步骤 2：在文件末尾追加 logAuditEvent 兼容导出**

在 class 定义之后追加：

```typescript
/**
 * 向后兼容：独立函数形式的审计日志（对应旧版 lib/audit-service.ts 的 logAuditEvent）
 */
export async function logAuditEvent(
  txOrDb: DB | DbTransaction,
  params: {
    tenantId: string;
    userId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    tableName?: string;
    details?: Record<string, unknown>;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
  }
): Promise<void> {
  await AuditService.log(txOrDb, {
    tenantId: params.tenantId,
    userId: params.userId,
    tableName: params.tableName ?? params.resourceType ?? 'unknown',
    recordId: params.resourceId ?? 'unknown',
    action: params.action,
    newValues: params.details ?? params.newValues,
    oldValues: params.oldValues,
  });
}
```

**步骤 3：确认类型检查通过**

```powershell
pnpm run type-check 2>&1 | Select-String "error TS" | Select-Object -First 10
```

期望：无输出（零错误）

---

## 任务 2：批量替换 35 个生产文件的 import 路径

**文件：** 35 个引用 `lib/audit-service` 的生产代码文件（通过 PowerShell 批量处理）

**背景：** 这些文件只需要改一行 import，不需要改调用代码（因为任务 1 已添加了兼容方法）。

**步骤 1：执行批量替换**

```powershell
# 只替换生产代码中的 lib/audit-service import（不改测试文件）
Get-ChildItem -Path src -Recurse -Include "*.ts","*.tsx" |
  Where-Object { $_.FullName -notmatch "\.test\." -and $_.FullName -notmatch "__tests__" } |
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match "from '@/shared/lib/audit-service'") {
        $newContent = $content -replace "from '@/shared/lib/audit-service'", "from '@/shared/services/audit-service'"
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "已更新: $($_.Name)"
    }
  }
```

**步骤 2：确认无遗漏**

```powershell
Get-ChildItem -Path src -Recurse -Include "*.ts","*.tsx" |
  Where-Object { $_.Name -notmatch "\.test\." } |
  Select-String "from '@/shared/lib/audit-service'"
```

期望：**无输出**（零遗漏）

**步骤 3：类型检查**

```powershell
pnpm run type-check 2>&1 | Select-String "error TS" | Select-Object -First 10
```

期望：无错误

---

## 任务 3：批量替换测试文件的 mock 路径

**背景：** 88 处测试文件 mock 了 `@/shared/lib/audit-service`，同样需要改为 `@/shared/services/audit-service`。由于新版 services 包含了所有旧版方法（record/recordFromSession/log/logBatch），测试的 mock 实现不需要改，只改路径。

**步骤 1：执行批量替换（仅测试文件）**

```powershell
Get-ChildItem -Path src -Recurse -Filter "*.test.ts" |
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match "'@/shared/lib/audit-service'") {
        $newContent = $content -replace "'@/shared/lib/audit-service'", "'@/shared/services/audit-service'"
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "已更新: $($_.Name)"
    }
  }
```

**步骤 2：确认无遗漏**

```powershell
(Get-ChildItem -Path src -Recurse -Filter "*.test.ts" | Select-String "lib/audit-service").Count
```

期望：**0**

**步骤 3：运行全量单测**

```powershell
pnpm run test:run 2>&1 | Select-String "(Test Files|Tests\s)" | Select-Object -Last 3
```

期望：`Test Files  NNN passed (NNN)` 且 Exit code: 0

---

## 任务 4：删除旧版 lib/audit-service.ts

**步骤 1：最终确认无引用**

```powershell
Get-ChildItem -Path src -Recurse -Include "*.ts","*.tsx","*.test.ts" |
  Select-String "lib/audit-service"
```

期望：**无输出**

**步骤 2：删除文件**

```powershell
Remove-Item src/shared/lib/audit-service.ts
Write-Host "已删除 lib/audit-service.ts"
```

**步骤 3：最终全量验证**

```powershell
# 类型检查
pnpm run type-check 2>&1 | Select-String "error TS" | Select-Object -First 5

# 全量单测
pnpm run test:run 2>&1 | Select-String "(Test Files|Tests\s|Exit code)" | Select-Object -Last 5
```

期望：class型检查零错误，测试全部通过。

---

## 验证清单

- [ ] `src/shared/services/audit-service.ts` 包含 `record()`、`recordFromSession()`、`logAuditEvent()` 兼容方法
- [ ] 生产代码零处引用 `lib/audit-service`
- [ ] 测试文件零处 mock `lib/audit-service`
- [ ] `lib/audit-service.ts` 已删除
- [ ] TypeScript `type-check` 零错误
- [ ] 全量 `pnpm run test:run` 零失败
