# Task 20/21 紧急修复：AuditService.log 参数错误（tsc 编译失败）

> **问题**：Task 20 (Search) 和 Task 21 (Upload) 引入的 `AuditService.log` 调用签名错误，导致全项目 `tsc --noEmit` 失败
> **紧急级别**：🔴 最高（编译错误会阻断部署）
> **范围**：仅修改 `AuditService.log(...)` 的调用格式，不改任何其他逻辑

---

## ❌ 错误原因

`AuditService.log` 的真实签名需要**两个参数**：
```typescript
// ✅ 正确签名（项目实际定义）
AuditService.log(db, { tableName, recordId, action, ... })

// ❌ 你们写的（缺第一个参数）
AuditService.log({ tableName, recordId, action, ... })
```

---

## 🔧 修复方法

### Search 修复：`src/features/search/actions.ts`

**tsc 报告的错误行**：第 485 行（共 4 处错误，均在同一文件）

1. **在文件顶部找到 db 的导入**（应该已有）：
   ```typescript
   import { db } from '@/lib/db';
   ```

2. **将所有 `AuditService.log({` 改为 `AuditService.log(db, {`**：
   ```typescript
   // ❌ 当前错误写法
   await AuditService.log({
       tableName: 'search_log',
       ...
   });

   // ✅ 修复后
   await AuditService.log(db, {
       tableName: 'search_log',
       ...
   });
   ```

3. **检查 params 字段名**（必须使用以下字段名）：
   - `tableName`（字符串，必填）
   - `recordId`（字符串，必填）
   - `action`（字符串，必填）
   - `userId`（可选）
   - `tenantId`（可选）
   - `details`（可选，`Record<string, unknown>`）
   - `oldValues`（可选）
   - `newValues`（可选）
   - ⚠️ **不存在** `entityType`、`entityId`、`metadata`、`newValue`（这些是错误字段名！）

### Upload 修复：`src/features/upload/actions/upload.ts`

**tsc 报告的错误行**：第 152 行 和 第 223 行

同样修复：
1. `AuditService.log({` → `AuditService.log(db, {`
2. 同时修正字段名（如有 `entityType`/`entityId`/`metadata` 需要改为正确字段）

---

## 📖 正确调用示例（从 leads 模块复制）

```typescript
await AuditService.log(db, {
    tableName: 'search_logs',      // 对应数据库表名
    recordId: session.user.id,     // 被操作记录的 ID
    action: 'SEARCH',              // 操作类型
    userId: session.user.id,
    tenantId: session.user.tenantId,
    details: {
        keyword: keyword.slice(0, 50),
        scope,
        resultCount: totalCount,
    },
});
```

---

## ✅ 验收命令

```powershell
# 修复后运行（必须 0 错误）
npx tsc --noEmit 2>&1 | Select-String "search|upload"
# 期望：无输出

# 测试仍然通过
npx vitest run src/features/search src/features/upload
# 期望：44 用例全通过
```

## 交付说明
完成后宣告"tsc 修复完成"，报告 `npx tsc --noEmit 2>&1 | Select-String "search|upload"` 的输出结果（必须为空）。
