# Task 19 返工：Auth 模块 AuditService 和 Logger 完全未完成

> **验收结果**：❌ AuditService=0（期望≥5）❌ logger=6（期望≥12）
> **测试通过情况**：待确认（先补代码，测试最后跑）
> **本次返工范围**：仅补充 AuditService 和 logger，**绝对不要修改任何测试文件**

---

## ❌ 精确缺口

| 验收项 | 期望 | 实测 | 状态 |
|:---|:---:|:---:|:---:|
| AuditService 生产引用数 | ≥ 5 | **0** | ❌ 完全未接入 |
| logger 调用数 | ≥ 12 | **6** | ❌ 还差 6 个 |

---

## 🔧 修复步骤

### Step 1：找到所有生产代码文件
```powershell
Get-ChildItem src\features\auth -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-Object Name, @{N="行数";E={(Get-Content $_.FullName).Count}}
```

### Step 2：加入必要导入（在每个需要修改的文件顶部）
```typescript
import { AuditService } from '@/shared/services/audit-service';
import { logger } from '@/shared/lib/logger';
```
> 先查看 `src/features/leads/actions/` 中任意 action 文件的导入方式，保持完全一致。

---

### 接入点 1：登录成功时（最高优先级）

找到魔法链接验证、密码登录等处理 session 创建的函数，在**用户成功认证后**添加：

```typescript
// 登录成功审计
await AuditService.log({
    action: 'LOGIN',
    entityType: 'user_session',
    entityId: validatedUser.id,
    tenantId: validatedUser.tenantId,
    userId: validatedUser.id,
    metadata: {
        loginMethod: 'magic-link', // 根据实际方式填写：'magic-link' / 'password' / 'oauth'
    },
});

// 同时补充 logger
logger.info('[Auth] 用户登录成功', {
    userId: validatedUser.id,
    tenantId: validatedUser.tenantId,
    loginMethod: 'magic-link',
});
```

### 接入点 2：登录失败时

```typescript
logger.warn('[Auth] 用户认证失败', {
    reason: 'invalid_or_expired_token',
    // 不记录 email 明文，可记录脱敏版
});

await AuditService.log({
    action: 'LOGIN_FAILED',
    entityType: 'user_session',
    entityId: 'unknown',
    tenantId: 'unknown',
    userId: 'unknown',
    metadata: { reason: 'invalid_or_expired_token' },
});
```

### 接入点 3：密码重置请求发送时

```typescript
logger.info('[Auth] 密码重置邮件已发送', { userId });

await AuditService.log({
    action: 'PASSWORD_RESET_REQUESTED',
    entityType: 'user_account',
    entityId: userId,
    tenantId,
    userId,
});
```

### 接入点 4：密码重置完成时

```typescript
logger.info('[Auth] 用户密码已重置', { userId, tenantId });

await AuditService.log({
    action: 'UPDATE',
    entityType: 'user_password',
    entityId: userId,
    tenantId,
    userId,
    metadata: { operation: 'password_reset_completed' },
});
```

### 接入点 5：Token 验证失败时

```typescript
logger.warn('[Auth] Token 验证失败', {
    reason: 'expired_or_invalid',
    tokenType: 'magic-link',
});

await AuditService.log({
    action: 'ACCESS_DENIED',
    entityType: 'user_session',
    entityId: 'unknown',
    tenantId: 'unknown',
    userId: 'unknown',
    metadata: { reason: 'token_invalid_or_expired' },
});
```

### 补充更多 logger 达到 ≥ 12

除以上 5 个 AuditService（共创建 5+ 处）外，确保在以下位置也有 logger：

```typescript
// 6. 收到认证请求时（请求入口）
logger.info('[Auth] 收到认证请求', { type: 'magic-link' });

// 7. Token 过期检测
logger.info('[Auth] 检测 Token 有效期', { expiresAt, isExpired });

// 8. Session 创建
logger.info('[Auth] 新 Session 已创建', { userId, tenantId });

// 9. 登出操作
logger.info('[Auth] 用户已登出', { userId });

// 10. 请求速率限制触发
logger.warn('[Auth] 登录尝试频率超限', { userId });

// 11. 无效邮箱格式
logger.warn('[Auth] 无效的邮箱格式被拒绝');

// 12. 系统级异常
logger.error('[Auth] 认证流程发生异常', { error: err.message });
```

---

## ⚠️ 安全红线（必须遵守）

- **绝对不能**在 logger 或 AuditService 中记录密码原文
- **绝对不能**在 logger 或 AuditService 中记录 magic-link token 原文
- email 可以记录，但建议脱敏：`email.replace(/(?<=.{2}).+(?=@)/, '***')`

---

## ✅ 验收命令（主线程执行）

```powershell
# 1. AuditService 生产引用（必须 ≥ 5）
(Get-ChildItem src\features\auth -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "AuditService").Count

# 2. logger 调用数（必须 ≥ 12）
(Get-ChildItem src\features\auth -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "logger\.").Count

# 3. 密码明文安全检查（必须 = 0）
(Get-ChildItem src\features\auth -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "password.*logger\.|logger\..*password").Count

# 4. 测试全通过
npx vitest run src/features/auth

# 5. tsc 编译
npx tsc --noEmit 2>&1 | Select-String "auth"
# 期望：无输出
```

## 交付说明
完成后宣告"Task 19 返工完成"，逐项报告以上 5 条命令的**实际数字**。
