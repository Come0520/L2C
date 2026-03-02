# Task 21: Upload 模块 AuditService 接入 + UI 三态补强

> **任务性质**：代码改进（编程任务）
> **目标**：Upload 模块 AuditService=0 → ≥3，Skeleton/loading=0 → ≥3（UI 三态）
> **模块路径**：`src/features/upload/`
> **评估人**：主线程 AI（不参与编程，只做验收）

---

## 🔍 实测发现的核心问题

| 指标 | 当前值 | 目标 | 状态 |
|:---|:---:|:---:|:---:|
| `AuditService` 引用（生产代码） | **0** | ≥ 3 | 🔴 |
| `Skeleton/loading`（UI 三态） | **0** | ≥ 3 | 🔴 无加载状态 |
| `logger.` 调用 | 5 | ≥ 8 | 🟡 |
| 测试文件数 | 4 | ≥ 4 | ✅ |
| `any` 类型 | 0 | 0 | ✅ |

---

## 📋 必须完成的具体任务

### 前置步骤：了解模块结构

**先执行以下命令了解 Upload 模块的文件结构**：
```powershell
Get-ChildItem src\features\upload -r | Select-Object Name, PSIsContainer
```

---

### 任务一：接入 AuditService 审计日志（优先级最高）

**背景**：文件上传属于重要的数据变更操作，每次上传、删除文件都需要留下审计记录（合规要求）。

**需要接入的操作**：

#### 1. 文件上传成功后
```typescript
import { AuditService } from '@/shared/services/audit-service';

// 文件上传成功后：
await AuditService.log({
    action: 'CREATE',
    entityType: 'uploaded_file',
    entityId: savedFile.id, // 上传后的文件 ID 或 URL
    tenantId: session.user.tenantId,
    userId: session.user.id,
    metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        destination: savedFile.url, // 文件存储位置
    },
});
```

#### 2. 文件删除时
```typescript
// 文件删除后：
await AuditService.log({
    action: 'DELETE',
    entityType: 'uploaded_file',
    entityId: fileId,
    tenantId: session.user.tenantId,
    userId: session.user.id,
    metadata: { fileName: oldFile.name },
});
```

#### 3. 文件访问权限验证失败（安全审计）
```typescript
// 尝试访问他人文件时：
await AuditService.log({
    action: 'ACCESS_DENIED',
    entityType: 'uploaded_file',
    entityId: fileId,
    tenantId: session.user.tenantId,
    userId: session.user.id,
    metadata: { reason: 'cross_tenant_access_attempt' },
});
```

**最低要求**：至少 3 处 AuditService 调用。

---

### 任务二：补充 UI 加载状态（D5 提升）

**背景**：upload 模块的 `Skeleton/loading` 引用为 0，即上传过程中没有任何视觉反馈，用户体验很差。

**第一步：找到 upload 的 UI 组件文件**：
```powershell
Get-ChildItem src\features\upload -r -Include "*.tsx" | Select-Object Name
```

**如果存在组件文件**，在以下位置添加 Loading 状态：

#### 文件列表加载时：
```tsx
// 如果使用 Skeleton：
import { Skeleton } from '@/components/ui/skeleton';

// 加载中显示骨架屏：
if (isLoading) {
    return (
        <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-3/4" />
        </div>
    );
}
```

#### 上传进行中：
```tsx
// 显示上传进度或 loading 状态：
{isUploading && (
    <div className="flex items-center gap-2">
        <Loader2 className="animate-spin h-4 w-4" />
        <span>正在上传...</span>
    </div>
)}
```

#### 错误状态：
```tsx
// 上传失败时显示错误：
{uploadError && (
    <Alert variant="destructive">
        <AlertDescription>{uploadError}</AlertDescription>
    </Alert>
)}
```

**如果没有 tsx 组件**：如果 upload 模块是纯 server actions，UI 三态项可以豁免，但请在验收报告中说明"该模块无 tsx 组件，UI 三态不适用"。

---

### 任务三：补充 logger 日志

在文件上传 action 中补充以下日志（目标 ≥ 8 个 logger 调用）：

```typescript
// 上传请求开始：
logger.info('[Upload] 接收文件上传请求', { userId, tenantId, fileName, fileSize });

// 文件类型校验结果：
logger.info('[Upload] 文件类型验证通过', { fileName, fileType });

// 上传成功：
logger.info('[Upload] 文件上传成功', { fileId: savedFile.id, fileName, tenantId });

// 上传失败：
logger.error('[Upload] 文件上传失败', { error: err.message, fileName });

// 文件大小超限：
logger.warn('[Upload] 文件大小超出限制', { fileSize, maxSize, fileName });

// 无效文件类型拒绝：
logger.warn('[Upload] 文件类型不允许被拒绝', { fileType, fileName });
```

---

## ✅ 最终验收清单

```powershell
# 1. AuditService 生产引用数
(Get-ChildItem src\features\upload -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "AuditService").Count
# 期望：≥ 3

# 2. logger 调用数
(Get-ChildItem src\features\upload -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "logger\.").Count
# 期望：≥ 8

# 3. Skeleton/loading UI 状态（如有 tsx 文件）
(Get-ChildItem src\features\upload -r -Include "*.tsx" | Select-String "Skeleton|loading|spinner|animate-spin").Count
# 期望：≥ 3（如无 tsx 文件则此项豁免，需说明）

# 4. tsx 文件数量（用于判断 UI 三态是否适用）
(Get-ChildItem src\features\upload -r -Include "*.tsx").Count

# 5. 测试全通过
npx vitest run src/features/upload
# 期望：Exit code 0，0 个失败

# 6. TypeScript 编译
npx tsc --noEmit 2>&1 | Select-String "upload"
# 期望：无输出
```

## 交付说明
完成后宣告"Task 21 完成"，逐项报告每条验收命令的**实际数字**，并说明 UI 三态是否适用（是否有 tsx 文件）。
