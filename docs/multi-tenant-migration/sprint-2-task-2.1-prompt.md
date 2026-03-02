# Sprint 2 — 任务 2.1：PC 端 NextAuth 认证改造

## 你的身份

你是一个实现子代理 (Implementer Subagent)，正在执行 L2C 多租户改造方案的认证层改造。

**前置条件**：Sprint 1 已完成。`tenant_members` 表已创建，`users` 表新增了 `lastActiveTenantId` 字段，数据已迁移。

## 业务背景

L2C 是窗帘行业 B2B SaaS 系统。当前登录后用户直接绑定到唯一租户，现在需要支持一个人（同一手机号）在多个窗帘公司工作。超管只做平台管理，不参与任何租户业务。

## 任务描述

改造 `src/shared/lib/auth.ts` 中的 NextAuth `authorize` 函数和相关回调，使 PC 端登录支持多租户。

## 具体工作

### 1. 修改 `src/shared/lib/auth.ts`

**a) 在文件顶部新增 import：**

```typescript
import { tenantMembers } from '@/shared/api/schema';
```

**b) 改造 `authorize` 函数（约第 35-128 行）：**

密码验证逻辑保持不变（现有的 `findMany` + 逐个 `compare` 方式很好）。

**关键改动**：在密码验证成功找到 `user` 之后（约第 83 行之后），替换原来直接返回 `user.tenantId` / `user.role` 的逻辑：

```typescript
// ===== 新逻辑：查 tenant_members 获取用户的所有租户成员资格 =====

// 超管直接进入平台管理，不需要选择租户
if (user.isPlatformAdmin) {
  logger.info('[Auth] 平台超管登录', { userId: user.id });
  resetLoginRateLimit(username);
  await AuditService.log(db, {
    tableName: 'auth_login',
    recordId: user.id,
    action: 'LOGIN_SUCCESS',
    userId: user.id,
    tenantId: '__PLATFORM__',
    details: { method: 'credentials', platform: 'pc', type: 'platform_admin' },
  });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.avatarUrl,
    tenantId: '__PLATFORM__',
    role: 'PLATFORM_ADMIN',
    roles: ['PLATFORM_ADMIN'],
    isPlatformAdmin: true,
  };
}

// 查询该用户在 tenant_members 中的所有有效成员资格
const memberships = await db.query.tenantMembers.findMany({
  where: and(eq(tenantMembers.userId, user.id), eq(tenantMembers.isActive, true)),
  with: { tenant: true },
});

if (memberships.length === 0) {
  logger.warn('[Auth] 用户无任何租户成员资格', { userId: user.id });
  return null;
}

// 确定要进入的租户
let activeMembership = memberships[0]; // 默认第一个

// 优先使用上次活跃的租户
if (user.lastActiveTenantId) {
  const lastActive = memberships.find((m) => m.tenantId === user.lastActiveTenantId);
  if (lastActive) {
    activeMembership = lastActive;
  }
}

const memberRoles =
  (activeMembership.roles as string[])?.length > 0
    ? (activeMembership.roles as string[])
    : [activeMembership.role || 'USER'];

logger.info('[Auth] PC 端登录成功', {
  userId: user.id,
  tenantId: activeMembership.tenantId,
  membershipCount: memberships.length,
});

await AuditService.log(db, {
  tableName: 'auth_login',
  recordId: user.id,
  action: 'LOGIN_SUCCESS',
  userId: user.id,
  tenantId: activeMembership.tenantId,
  details: { method: 'credentials', platform: 'pc' },
});

resetLoginRateLimit(username);

return {
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.avatarUrl,
  role: activeMembership.role || 'USER',
  roles: memberRoles,
  tenantId: activeMembership.tenantId,
  isPlatformAdmin: false,
};
```

**c) JWT 和 Session 回调不需要改动**
现有的 `jwt` 和 `session` 回调已经正确传递 `tenantId`、`role`、`roles`、`isPlatformAdmin`，无需修改。

### 2. 类型定义 `src/types/next-auth.d.ts`

**不需要修改！** 现有的 Session 类型接口字段保持不变（`tenantId`, `role`, `roles`, `isPlatformAdmin`）。这是设计的关键 — 下游 50+ 个文件无需改动。

## 注意事项

1. **一定保留现有的密码验证逻辑**（findMany + 逐个比较），那是修复过的正确逻辑
2. 超管 `tenantId` 使用特殊值 `'__PLATFORM__'`，而非 `null` 或空字符串
3. 所有代码注释必须使用**中文**
4. 工作目录：`c:\Users\bigey\Documents\Antigravity\L2C`

## 验证方式

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

## 完成后报告

请报告修改了哪些文件、编译是否通过、有无任何问题。
