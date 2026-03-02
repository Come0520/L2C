# Task 21 返工：Upload 模块 AuditService 和 Logger 完全未完成

> **验收结果**：❌ AuditService=0（期望≥3）❌ logger=5（期望≥8）
> **测试通过情况**：✅（44 用例全通过，无需改动）
> **Skeleton 豁免**：Upload 无 tsx 组件文件（纯 server actions），UI 三态项已豁免
> **本次返工范围**：仅补充 AuditService 接入 + logger，**绝对不要修改任何测试文件**

---

## ❌ 精确缺口

| 验收项 | 期望 | 实测 | 状态 |
|:---|:---:|:---:|:---:|
| AuditService 生产引用数 | ≥ 3 | **0** | ❌ |
| logger 调用数 | ≥ 8 | **5** | ❌ 还差 3 个 |
| Skeleton/loading | ≥ 3 | — | ✅ 豁免（无 tsx） |
| 测试用例 | 全通过 | 44/44 | ✅ 无需改动 |

---

## 🔧 修复步骤

### Step 1：找到生产代码文件
```powershell
Get-ChildItem src\features\upload -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-Object Name
```

### Step 2：在 action 文件顶部添加必要导入
```typescript
import { AuditService } from '@/shared/services/audit-service';
import { logger } from '@/shared/lib/logger';
```
> **提示**：确认导入路径和其他模块完全一致（如 leads、products 模块）。

### Step 3：在文件上传 action 中添加 AuditService

找到处理文件上传的主函数，在**上传成功后**添加：

```typescript
// 上传成功后记录审计
await AuditService.log({
    action: 'CREATE',
    entityType: 'uploaded_file',
    entityId: savedFile.id ?? savedFile.url ?? 'unknown',
    tenantId: session.user.tenantId,
    userId: session.user.id,
    metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
    },
});
```

### Step 4：在文件删除 action 中添加 AuditService
```typescript
// 删除前先保存旧值，删除后记录
await AuditService.log({
    action: 'DELETE',
    entityType: 'uploaded_file',
    entityId: fileId,
    tenantId: session.user.tenantId,
    userId: session.user.id,
    metadata: { fileName: deletedFile.name ?? fileId },
});
```

### Step 5：在访问控制拒绝处添加 AuditService（第 3 处）
```typescript
// 租户隔离失败时也记录
await AuditService.log({
    action: 'ACCESS_DENIED',
    entityType: 'uploaded_file',
    entityId: fileId,
    tenantId: session.user.tenantId,
    userId: session.user.id,
    metadata: { reason: 'cross_tenant_access_attempt' },
});
```

### Step 6：补充缺少的 logger（当前 5 个，需要达到 ≥ 8）

在以下位置新增 3 个以上 logger 调用：

```typescript
// 上传请求开始
logger.info('[Upload] 接收文件上传请求', {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    fileName: file.name,
    fileSize: file.size,
});

// 文件类型或大小检查失败
logger.warn('[Upload] 文件验证失败', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    reason: '文件类型不允许或超过大小限制',
});

// 上传成功
logger.info('[Upload] 文件上传成功', {
    fileId: savedFile.id,
    tenantId: session.user.tenantId,
    userId: session.user.id,
});

// 上传失败
logger.error('[Upload] 文件上传失败', {
    error: err instanceof Error ? err.message : String(err),
    fileName: file.name,
});
```

---

## ✅ 验收命令（主线程执行）

```powershell
# 1. AuditService 生产引用（必须 ≥ 3）
(Get-ChildItem src\features\upload -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "AuditService").Count

# 2. logger 调用数（必须 ≥ 8）
(Get-ChildItem src\features\upload -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "logger\.").Count

# 3. 测试仍然全通过（禁止改测试）
npx vitest run src/features/upload

# 4. tsc 编译
npx tsc --noEmit 2>&1 | Select-String "upload"
# 期望：无输出
```

## 交付说明
完成后宣告"Task 21 返工完成"，逐项报告以上 4 条命令的**实际数字**。
