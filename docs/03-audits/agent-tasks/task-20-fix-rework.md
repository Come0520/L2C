# Task 20 返工：Search 模块 AuditService 和 Logger 完全未完成

> **验收结果**：❌ AuditService=0（期望≥3）❌ logger=3（期望≥10）
> **测试通过情况**：✅（44 用例全通过，这部分无需改动）
> **本次返工范围**：仅补充 AuditService 接入 + logger，**绝对不要修改任何测试文件**

---

## ❌ 精确缺口

| 验收项 | 期望 | 实测 | 状态 |
|:---|:---:|:---:|:---:|
| AuditService 生产引用数 | ≥ 3 | **0** | ❌ |
| logger 调用数 | ≥ 10 | **3** | ❌ |
| 测试用例 | 全通过 | 44/44 | ✅ 无需改动 |

---

## 🔧 修复步骤

### Step 1：找到生产代码文件
```powershell
# 执行此命令找出所有非测试的 ts 文件
Get-ChildItem src\features\search -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-Object Name
```

### Step 2：在每个 action 文件顶部添加必要导入
```typescript
import { AuditService } from '@/shared/services/audit-service';
import { logger } from '@/shared/lib/logger';
```
> **提示**：先查看其他已集成的模块（如 `src/features/leads/actions/`）的导入路径，保持完全一致。

### Step 3：在 globalSearch（全局搜索）action 中添加

找到执行搜索的主函数，在**成功返回结果之前**添加：

```typescript
// 记录搜索操作
logger.info('[Search] 全局搜索请求', {
    tenantId: session.user.tenantId,
    userId: session.user.id,
    keyword: keyword?.slice(0, 30) ?? '',
    scope: scope ?? 'all',
});

// ... 执行搜索逻辑 ...

logger.info('[Search] 搜索完成', {
    resultCount: totalCount,
    tenantId: session.user.tenantId,
});

// AuditService（记录搜索行为）
await AuditService.log({
    action: 'SEARCH',
    entityType: 'global_search',
    entityId: session.user.id,
    tenantId: session.user.tenantId,
    userId: session.user.id,
    metadata: { keyword: keyword?.slice(0, 50), scope, resultCount: totalCount },
});
```

### Step 4：在无权限/无 session 的分支添加 logger.warn
```typescript
if (!session) {
    logger.warn('[Search] 未认证的搜索请求被拒绝');
    return { success: false, error: '请先登录' };
}

if (session.user.tenantId !== requestedTenantId) {
    logger.warn('[Search] 拒绝跨租户搜索', {
        userId: session.user.id,
        requestedTenantId,
    });
}
```

### Step 5：错误分支添加 logger.error
```typescript
try {
    // ... 搜索逻辑
} catch (err) {
    logger.error('[Search] 搜索执行异常', {
        error: err instanceof Error ? err.message : String(err),
        tenantId: session?.user?.tenantId,
    });
    return { success: false, error: '搜索服务暂时不可用' };
}
```

### Step 6：补充更多 logger 直到达到 ≥ 10 个
根据实际代码结构，继续在以下位置加日志：
- 空关键词快速返回时：`logger.info('[Search] 空关键词，返回空结果')`
- 超长关键词截断时：`logger.warn('[Search] 关键词过长，已截断', { originalLength })`
- 分页参数异常时：`logger.warn('[Search] 无效的分页参数')`

---

## ✅ 验收命令（主线程执行）

```powershell
# 1. AuditService 生产引用（必须 ≥ 3）
(Get-ChildItem src\features\search -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "AuditService").Count

# 2. logger 调用数（必须 ≥ 10）
(Get-ChildItem src\features\search -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "logger\.").Count

# 3. 测试仍然全通过（禁止改测试）
npx vitest run src/features/search
# 期望：44 个用例全通过

# 4. tsc 编译
npx tsc --noEmit 2>&1 | Select-String "search"
# 期望：无输出
```

## 交付说明
完成后宣告"Task 20 返工完成"，逐项报告以上 4 条命令的**实际数字**。
