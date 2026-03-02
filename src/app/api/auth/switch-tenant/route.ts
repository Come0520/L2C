/**
 * 切换租户 API
 *
 * POST /api/auth/switch-tenant — 执行租户切换
 * GET  /api/auth/switch-tenant — 获取可切换的租户列表
 *
 * 参考模型：Clerk switchOrganization / WorkOS setActiveOrg
 */
import { NextRequest } from 'next/server';
import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { users, tenantMembers } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const SwitchTenantSchema = z.object({
  targetTenantId: z.string().uuid('无效的租户 ID'),
});

/**
 * POST — 切换到指定租户
 *
 * 更新 lastActiveTenantId 后，前端需调用 signOut + signIn 刷新 JWT
 */
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

    // 验证该用户在目标租户中有有效成员资格
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

    // 更新 lastActiveTenantId
    await db
      .update(users)
      .set({ lastActiveTenantId: targetTenantId })
      .where(eq(users.id, session.user.id));

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
 * GET — 获取当前用户可切换的所有租户列表
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
