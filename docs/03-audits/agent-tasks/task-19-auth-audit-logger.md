# Task 19: Auth 模块 AuditService 接入 + 可运维性补强

> **任务性质**：代码改进（编程任务）
> **目标**：Auth 模块 AuditService=0 → ≥5，logger=6 → ≥12，达到 L4 标准
> **模块路径**：`src/features/auth/`
> **评估人**：主线程 AI（不参与编程，只做验收）

---

## 🔍 实测发现的核心问题

| 指标 | 当前值 | 目标 | 状态 |
|:---|:---:|:---:|:---:|
| `AuditService` 引用（生产代码） | **0** | ≥ 5 | 🔴 最严重 |
| `logger.` 调用 | 6 | ≥ 12 | 🟡 偏少 |
| 测试文件数 | 5 | ≥ 5 | ✅ 已达标 |
| `any` 类型 | 0 | 0 | ✅ |
| `@ts-ignore` | 0 | 0 | ✅ |

**核心矛盾**：认证模块是安全的核心入口，每一次登录、每一次权限变更都应该留下审计记录，但当前 AuditService 调用为 0，完全无记录。

---

## 📋 必须完成的具体任务

### 任务一：接入 AuditService 审计日志（最高优先级）

**第一步：定位所有写操作**
```powershell
# 找出所有包含写操作的 action 文件
Get-ChildItem src\features\auth -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "await db\.(insert|update|delete)|signIn|signOut|createUser|updatePassword|resetPassword"
```

**需要接入的操作（按优先级）**：

#### 1. 用户登录事件审计（最高优先级）
在登录成功的 action 中添加：
```typescript
import { AuditService } from '@/shared/services/audit-service';

// 登录成功后：
await AuditService.log({
    action: 'LOGIN',
    entityType: 'user_session',
    entityId: session.user.id,
    tenantId: session.user.tenantId,
    userId: session.user.id,
    metadata: {
        loginMethod: 'password', // 或 'magic-link' / 'oauth'
        userAgent: headers().get('user-agent'),
        ip: 'server-side', // 记录来源
    },
});
```

#### 2. 密码重置/修改的审计
```typescript
// 密码修改成功后：
await AuditService.log({
    action: 'UPDATE',
    entityType: 'user_password',
    entityId: userId,
    tenantId,
    userId: operatorId,
    metadata: { operation: 'password_reset' },
});
```

#### 3. 登录失败的审计（安全合规要求）
```typescript
// 登录失败时：
await AuditService.log({
    action: 'LOGIN_FAILED',
    entityType: 'user_session',
    entityId: 'unknown',
    tenantId: 'unknown',
    userId: 'unknown',
    metadata: { reason: 'invalid_credentials', attemptedEmail: email },
});
```

#### 4. 其他写操作（CREATE/UPDATE/DELETE 用户信息时）

**最低要求**：至少在 **5 个不同的关键操作**中接入 AuditService。

**导入路径说明**：先查看 `src/features/leads/actions/` 下任意 action 文件中 AuditService 的导入路径，完全一致地使用相同路径。

---

### 任务二：补充运营日志（D7 加固）

当前 `logger` 调用只有 6 处，认证模块需要更细致的日志以便生产排障。

**在以下位置补充日志**：
```typescript
// 每次认证请求开始时：
logger.info('[Auth] 收到登录请求', { email: masked_email, method });

// 认证成功时：
logger.info('[Auth] 用户认证成功', { userId, tenantId, method });

// 认证失败时（不记录密码）：
logger.warn('[Auth] 认证失败', { email: masked_email, reason, attempt });

// Token 验证失败：
logger.warn('[Auth] Token 验证失败', { reason, tokenType });

// Session 过期：
logger.info('[Auth] Session 已过期，用户需要重新登录', { userId });
```

**目标**：logger 调用从 6 个增加到 ≥ 12 个。

---

### 任务三：禁止事项检查

在完成上述任务后，检查并确保：
1. **绝对不记录密码明文**（Password, secret 等敏感字段）
2. **邮箱可以记录但推荐脱敏**（如 `te***@example.com`）
3. 不修改任何现有测试逻辑

---

## ✅ 最终验收清单

```powershell
# 1. AuditService 生产引用数
(Get-ChildItem src\features\auth -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "AuditService").Count
# 期望：≥ 5

# 2. logger 调用数
(Get-ChildItem src\features\auth -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "logger\.").Count
# 期望：≥ 12

# 3. 不应有密码明文记录（安全检查）
Get-ChildItem src\features\auth -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "password.*logger|logger.*password"
# 期望：无输出（零密码泄漏风险）

# 4. 测试全通过
npx vitest run src/features/auth
# 期望：Exit code 0，0 个失败

# 5. TypeScript 编译
npx tsc --noEmit 2>&1 | Select-String "auth"
# 期望：无输出
```

## 交付说明
完成后宣告"Task 19 完成"，逐项报告每条验收命令的**实际数字**。
