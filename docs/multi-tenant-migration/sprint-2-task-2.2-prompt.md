# Sprint 2 — 任务 2.2：新增切换租户 API

## 你的身份

你是一个实现子代理 (Implementer Subagent)，正在执行 L2C 多租户改造方案。

**前置条件**：任务 2.1 已完成。PC 端登录已改造为从 tenant_members 加载成员资格。

## 任务描述

创建 PC 端的「切换租户」API，允许拥有多个租户成员资格的用户在运行时切换工作上下文。

## 具体工作

### 创建 `src/app/api/auth/switch-tenant/route.ts`

```typescript
/**
 * 切换租户 API
 *
 * POST /api/auth/switch-tenant
 * Body: { targetTenantId: string }
 *
 * 功能：
 * 1. 验证用户在目标租户中有有效的成员资格
 * 2. 更新 users.lastActiveTenantId
 * 3. 返回新的租户信息（前端需刷新 session）
 *
 * 参考模型：Clerk switchOrganization / WorkOS setActiveOrg
 */

import { NextRequest } from 'next/server';
import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema/infrastructure';
import { tenantMembers } from '@/shared/api/schema/tenant-members';
import { tenants } from '@/shared/api/schema/infrastructure';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const SwitchTenantSchema = z.object({
  targetTenantId: z.string().uuid('无效的租户 ID'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = SwitchTenantSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { targetTenantId } = parsed.data;

    // 1. 验证该用户在目标租户中有有效成员资格
    const membership = await db.query.tenantMembers.findFirst({
      where: and(
        eq(tenantMembers.userId, session.user.id),
        eq(tenantMembers.tenantId, targetTenantId),
        eq(tenantMembers.isActive, true)
      ),
      with: { tenant: true },
    });

    if (!membership) {
      return Response.json({ error: '您不是该企业的成员' }, { status: 403 });
    }

    // 2. 更新 lastActiveTenantId
    await db
      .update(users)
      .set({ lastActiveTenantId: targetTenantId })
      .where(eq(users.id, session.user.id));

    // 3. 返回新的租户信息
    // 注意：前端需要在收到成功响应后调用 signOut + signIn 刷新 JWT Session
    // 因为 NextAuth 的 JWT 是不可变的，只能重新登录来更新 tenantId
    return Response.json({
      success: true,
      tenant: {
        id: membership.tenantId,
        name: membership.tenant.name,
        role: membership.role,
        roles: membership.roles,
      },
      message: '切换成功，请重新登录以刷新会话',
    });
  } catch (error) {
    console.error('[SwitchTenant] 切换租户失败:', error);
    return Response.json({ error: '切换企业失败，请稍后再试' }, { status: 500 });
  }
}

/**
 * GET /api/auth/switch-tenant
 * 获取当前用户可切换的所有租户列表
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '未登录' }, { status: 401 });
    }

    const memberships = await db.query.tenantMembers.findMany({
      where: and(eq(tenantMembers.userId, session.user.id), eq(tenantMembers.isActive, true)),
      with: { tenant: true },
    });

    return Response.json({
      currentTenantId: session.user.tenantId,
      tenants: memberships.map((m) => ({
        id: m.tenantId,
        name: m.tenant.name,
        role: m.role,
        roles: m.roles,
        isCurrent: m.tenantId === session.user.tenantId,
      })),
    });
  } catch (error) {
    console.error('[SwitchTenant] 获取租户列表失败:', error);
    return Response.json({ error: '获取企业列表失败' }, { status: 500 });
  }
}
```

## 注意事项

1. NextAuth 的 JWT 是不可变的（在同一 session 内无法动态更新 tenantId）。切换租户后需要前端调用 `signOut()` 再 `signIn()` 来触发 JWT 重新签发。GET 端点返回租户列表，POST 端点更新 lastActiveTenantId，这样下次 signIn 时 auth.ts 的 authorize 会自动选中新租户。
2. 所有代码注释必须使用**中文**
3. 工作目录：`c:\Users\bigey\Documents\Antigravity\L2C`

## 验证方式

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

## 完成后报告

请报告创建了哪些文件、编译是否通过。
