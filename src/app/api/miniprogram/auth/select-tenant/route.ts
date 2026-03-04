/**
 * 小程序端多租户选择 API
 *
 * POST /api/miniprogram/auth/select-tenant
 * 当用户拥有多个租户成员资格时，在前端选择一个租户后调用此接口获取正式 token
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { users, tenantMembers } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import {
  apiSuccess,
  apiBadRequest,
  apiServerError,
  apiForbidden,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { generateMiniprogramToken, verifyTempLoginToken } from '../../auth-utils';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';

const SelectTenantSchema = z.object({
  tempToken: z.string().min(1, '临时登录凭证不能为空'),
  tenantId: z.string().uuid('无效的租户 ID'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = SelectTenantSchema.safeParse(body);
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0].message);
    }

    const { tempToken, tenantId } = parsed.data;

    // 1. 验证临时登录 Token
    const userId = await verifyTempLoginToken(tempToken);
    if (!userId) {
      return apiUnauthorized('登录已超时，请重新登录');
    }

    // 2. 查找用户
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || (!user.isActive && !user.isPlatformAdmin)) {
      return apiForbidden('用户不存在或已失效');
    }

    // 3. 验证选择的租户是否合法
    const membership = await db.query.tenantMembers.findFirst({
      where: and(
        eq(tenantMembers.userId, userId),
        eq(tenantMembers.tenantId, tenantId),
        eq(tenantMembers.isActive, true)
      ),
      with: { tenant: true },
    });

    if (!membership) {
      return apiForbidden('您不是该企业的有效成员');
    }

    // 4. 更新上次活跃的租户
    await db.update(users).set({ lastActiveTenantId: tenantId }).where(eq(users.id, userId));

    // 5. 签发正式 token
    const token = await generateMiniprogramToken(user.id, tenantId);

    // 6. 审计日志
    await AuditService.log(db, {
      tableName: 'users',
      recordId: user.id,
      action: 'LOGIN',
      userId: user.id,
      tenantId,
      details: { method: 'SELECT_TENANT' },
    });

    logger.info('[SelectTenant] 小程序多租户用户选择企业并登录成功', {
      route: 'select-tenant',
      userId: user.id,
      tenantId,
    });

    return apiSuccess({
      token,
      tenantStatus: membership.tenant.status,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: membership.role,
        tenantId,
        tenantName: membership.tenant.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: unknown) {
    logger.error('[SelectTenant] 选择企业异常', { route: 'select-tenant', error });
    return apiServerError('选择企业服务异常');
  }
}
