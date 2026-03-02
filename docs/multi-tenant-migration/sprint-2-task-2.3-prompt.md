# Sprint 2 — 任务 2.3：小程序端微信登录改造

## 你的身份

你是一个实现子代理 (Implementer Subagent)，正在执行 L2C 多租户改造方案。

**前置条件**：Sprint 1 已完成，任务 2.1/2.2 已完成。

## 任务描述

改造小程序端的两个认证路由（微信登录 + 手机号解密登录），使其支持多租户。新增「选择租户」API 供多租户用户选择进入哪个企业。

## 具体工作

### 1. 改造 `src/app/api/miniprogram/auth/wx-login/route.ts`

在通过 `wechatOpenId` 找到 `existingUser` 之后（约第 70 行），替换现有的单租户登录逻辑：

```typescript
// 导入新增依赖（文件顶部）
import { tenantMembers } from '@/shared/api/schema';

// === 改造后的登录逻辑（替换原第 70-109 行）===

if (existingUser) {
  // 查询用户的所有有效租户成员资格
  const memberships = await db.query.tenantMembers.findMany({
    where: and(eq(tenantMembers.userId, existingUser.id), eq(tenantMembers.isActive, true)),
    with: { tenant: true },
  });

  if (memberships.length === 0) {
    // 有 user 记录但没有任何成员资格（异常情况）
    logger.warn('[WxLogin] 用户无任何租户成员资格', { userId: existingUser.id });
    return apiError('您尚未加入任何企业，请联系管理员', 403);
  }

  if (memberships.length === 1) {
    // 单租户：自动进入
    const m = memberships[0];
    const token = await generateMiniprogramToken(existingUser.id, m.tenantId);

    await AuditService.log(db, {
      tableName: 'users',
      recordId: existingUser.id,
      action: 'LOGIN',
      userId: existingUser.id,
      tenantId: m.tenantId,
      details: { method: 'WECHAT', openId },
    });

    return apiSuccess({
      openId,
      unionId,
      user: {
        id: existingUser.id,
        name: existingUser.name,
        phone: existingUser.phone,
        email: existingUser.email,
        role: m.role,
        tenantId: m.tenantId,
        tenantName: m.tenant.name,
        avatarUrl: existingUser.avatarUrl,
      },
      tenantStatus: m.tenant.status,
      token,
    });
  }

  // 多租户：返回租户列表供选择
  logger.info('[WxLogin] 用户有多个租户，返回选择列表', {
    userId: existingUser.id,
    tenantCount: memberships.length,
  });

  return apiSuccess({
    needTenantSelection: true,
    openId,
    unionId,
    userId: existingUser.id,
    tenants: memberships.map((m) => ({
      id: m.tenantId,
      name: m.tenant.name,
      role: m.role,
      status: m.tenant.status,
    })),
  });
}
```

### 2. 改造 `src/app/api/miniprogram/auth/decrypt-phone/route.ts`

类似的逻辑。在通过 `phone` 找到 `user` 之后（约第 87 行），改为查 `tenant_members`：

```typescript
// 导入新增依赖（文件顶部）
import { tenantMembers } from '@/shared/api/schema';

// === 改造后的登录逻辑（替换原第 87-129 行）===

if (user) {
  // 绑定 openId（保持原有逻辑）
  if (openId && user.wechatOpenId !== openId) {
    await db.update(users).set({ wechatOpenId: openId }).where(eq(users.id, user.id));
  }

  // 查询所有有效成员资格
  const memberships = await db.query.tenantMembers.findMany({
    where: and(eq(tenantMembers.userId, user.id), eq(tenantMembers.isActive, true)),
    with: { tenant: true },
  });

  if (memberships.length === 0) {
    return apiError('您尚未加入任何企业，请联系管理员', 403);
  }

  if (memberships.length === 1) {
    const m = memberships[0];
    const token = await generateMiniprogramToken(user.id, m.tenantId);

    const { AuditService } = await import('@/shared/services/audit-service');
    await AuditService.log(db, {
      tableName: 'users',
      recordId: user.id,
      action: 'LOGIN',
      userId: user.id,
      tenantId: m.tenantId,
      details: { method: 'PHONE_DECRYPT', phoneNumber },
    });

    return apiSuccess({
      token,
      tenantStatus: m.tenant.status,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: m.role,
        tenantId: m.tenantId,
        tenantName: m.tenant.name,
        avatarUrl: user.avatarUrl,
      },
    });
  }

  // 多租户：返回选择列表
  return apiSuccess({
    needTenantSelection: true,
    userId: user.id,
    phone: phoneNumber,
    tenants: memberships.map((m) => ({
      id: m.tenantId,
      name: m.tenant.name,
      role: m.role,
      status: m.tenant.status,
    })),
  });
}
```

### 3. 新增 `src/app/api/miniprogram/auth/select-tenant/route.ts`

```typescript
/**
 * 小程序端 — 选择租户 API
 *
 * POST /api/miniprogram/auth/select-tenant
 * Body: { userId: string, tenantId: string, openId?: string }
 *
 * 当用户属于多个租户时，前端展示选择页，
 * 用户选择后调用此 API 获取正式 JWT Token。
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema/infrastructure';
import { tenantMembers } from '@/shared/api/schema/tenant-members';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { generateMiniprogramToken } from '../../auth-utils';
import { z } from 'zod';

const SelectTenantSchema = z.object({
  userId: z.string().uuid('无效的用户 ID'),
  tenantId: z.string().uuid('无效的租户 ID'),
  openId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SelectTenantSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { userId, tenantId, openId } = parsed.data;

    // 1. 验证成员资格
    const membership = await db.query.tenantMembers.findFirst({
      where: and(
        eq(tenantMembers.userId, userId),
        eq(tenantMembers.tenantId, tenantId),
        eq(tenantMembers.isActive, true)
      ),
      with: { tenant: true },
    });

    if (!membership) {
      return apiError('您不是该企业的成员', 403);
    }

    // 2. 获取用户信息
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return apiError('用户不存在', 404);
    }

    // 3. 更新 lastActiveTenantId
    await db.update(users).set({ lastActiveTenantId: tenantId }).where(eq(users.id, userId));

    // 4. 签发 Token
    const token = await generateMiniprogramToken(userId, tenantId);

    logger.info('[SelectTenant] 小程序用户选择租户成功', {
      userId,
      tenantId,
      tenantName: membership.tenant.name,
    });

    return apiSuccess({
      token,
      tenantStatus: membership.tenant.status,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: membership.role,
        tenantId: membership.tenantId,
        tenantName: membership.tenant.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    logger.error('[SelectTenant] 选择租户失败', { error });
    return apiError('选择企业失败，请稍后再试', 500);
  }
}
```

## 注意事项

1. 别忘了在 `wx-login/route.ts` 和 `decrypt-phone/route.ts` 文件顶部添加 `tenantMembers` 的 import
2. 需要同时 import `and` 从 `drizzle-orm`（如果尚未导入的话）
3. 所有代码注释必须使用**中文**
4. 工作目录：`c:\Users\bigey\Documents\Antigravity\L2C`

## 验证方式

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

## 完成后报告

请报告创建/修改了哪些文件、编译是否通过。
