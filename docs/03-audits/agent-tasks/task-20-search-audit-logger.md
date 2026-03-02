# Task 20: Search 模块 AuditService 接入 + Logger 全面补强

> **任务性质**：代码改进（编程任务）
> **目标**：Search 模块 AuditService=0 → ≥3，logger=3 → ≥10
> **模块路径**：`src/features/search/`
> **评估人**：主线程 AI（不参与编程，只做验收）

---

## 🔍 实测发现的核心问题

| 指标 | 当前值 | 目标 | 状态 |
|:---|:---:|:---:|:---:|
| `AuditService` 引用（生产代码） | **0** | ≥ 3 | 🔴 |
| `logger.` 调用 | **3** | ≥ 10 | 🔴 极度偏少 |
| 测试文件数 | 4 | ≥ 4 | ✅ 已达标 |
| `any` 类型 | 0 | 0 | ✅ |

---

## 📋 必须完成的具体任务

### 任务一：接入 AuditService 审计日志

**背景**：搜索操作属于数据访问行为，在企业合规场景中需要记录"谁在什么时候搜索了什么内容"，尤其是带敏感关键词的搜索。

**第一步：查看当前 action 文件**
```powershell
Get-ChildItem src\features\search -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-Object Name
```

**需要接入的 AuditService 场景**：

#### 1. 全局搜索操作记录
在 `globalSearch` action 中，搜索执行后添加：
```typescript
// 注意：只记录有结果的搜索，避免日志膨胀
if (results.total > 0) {
    await AuditService.log({
        action: 'SEARCH',
        entityType: 'global_search',
        entityId: 'search_log',
        tenantId: session.user.tenantId,
        userId: session.user.id,
        metadata: {
            keyword: keyword.slice(0, 50), // 限制关键词长度
            scope: scope ?? 'all',
            resultCount: results.total,
        },
    });
}
```

#### 2. 搜索配置修改（如果有相关 action）
```typescript
// 修改搜索配置后：
await AuditService.log({
    action: 'UPDATE',
    entityType: 'search_config',
    entityId: configId,
    tenantId: session.user.tenantId,
    userId: session.user.id,
});
```

**最低要求**：至少 3 处 AuditService 调用。

---

### 任务二：大幅补充运营日志

当前 `logger` 只有 3 处调用，远低于其他核心模块（leads: 56, sales: 41）。

**必须添加的日志场景**：

```typescript
// 1. 搜索请求开始（含基本参数）
logger.info('[Search] 全局搜索请求', {
    tenantId: session.user.tenantId,
    userId: session.user.id,
    keyword: keyword.slice(0, 30),
    scope,
});

// 2. 搜索完成（含耗时和结果数量）
const startTime = Date.now();
// ... 搜索逻辑 ...
logger.info('[Search] 搜索完成', {
    durationMs: Date.now() - startTime,
    resultCount: totalResults,
    scope,
});

// 3. 超时或慢查询警告（超过 1000ms）
if (Date.now() - startTime > 1000) {
    logger.warn('[Search] 搜索响应慢', {
        durationMs: Date.now() - startTime,
        keyword: keyword.slice(0, 30),
        threshold: 1000,
    });
}

// 4. 空结果记录（有助于分析搜索质量）
if (totalResults === 0) {
    logger.info('[Search] 搜索无结果', {
        keyword: keyword.slice(0, 30),
        scope,
    });
}

// 5. 错误情况记录
logger.error('[Search] 搜索执行异常', {
    error: err.message,
    keyword: keyword.slice(0, 30),
});

// 6. 跨域访问拒绝记录
logger.warn('[Search] 拒绝跨租户搜索请求', { userId, tenantId });

// 7. 无权限请求
logger.warn('[Search] 未认证的搜索请求被拒绝');
```

**目标**：logger 调用从 3 个增加到 ≥ 10 个。

---

## ✅ 最终验收清单

```powershell
# 1. AuditService 生产引用数
(Get-ChildItem src\features\search -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "AuditService").Count
# 期望：≥ 3

# 2. logger 调用数
(Get-ChildItem src\features\search -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "logger\.").Count
# 期望：≥ 10

# 3. 测试全通过（包含之前修复的用例）
npx vitest run src/features/search
# 期望：Exit code 0，0 个失败

# 4. TypeScript 编译
npx tsc --noEmit 2>&1 | Select-String "search"
# 期望：无输出
```

## 交付说明
完成后宣告"Task 20 完成"，逐项报告每条验收命令的**实际数字**。
