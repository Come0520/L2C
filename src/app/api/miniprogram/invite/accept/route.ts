/**
 * 接受邀请 API
 *
 * POST /api/miniprogram/invite/accept
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { invitations, users, tenants } from '@/shared/api/schema';
import { eq, and, gt } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { generateMiniprogramToken, verifyRegisterToken } from '../../auth-utils';
import { InviteAcceptSchema } from '../../miniprogram-schemas';
import { RateLimiter } from '@/shared/services/miniprogram/security.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 频控：防暴力撞库邀请码 5 秒 2 次
    if (!RateLimiter.allow(`accept_invite_${request.headers.get('x-forwarded-for') || 'anon'}`, 2, 5000)) {
      return apiError('尝试次数过多，请稍后再试', 429);
    }

    // Zod 输入验证
    const parsed = InviteAcceptSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { code, registerToken } = parsed.data;

    // 解析并验证安全注册 Token
    const registerPayload = await verifyRegisterToken(registerToken);
    if (!registerPayload) {
      logger.error('[InviteAccept] 注册临时 Token 无效或过期', { route: 'invite/accept' });
      return apiError('授权凭证已过期或无效，请重新登录微信', 403);
    }
    const { openId } = registerPayload;

    // 1. 查找邀请码
    const invite = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.code, code),
        eq(invitations.isActive, true),
        gt(invitations.expiresAt, new Date())
      ),
    });

    if (!invite) {
      return apiError('邀请码无效或已过期', 404);
    }

    // 2. 查找或创建用户
    let user = await db.query.users.findFirst({
      where: eq(users.wechatOpenId, openId),
    });

    if (user) {
      // 用户已存在，检查是否已加入其他租户
      if (user.tenantId && user.tenantId !== invite.tenantId) {
        return apiError('您已加入其他企业，请先联系管理员退出', 409);
      }

      await db
        .update(users)
        .set({
          tenantId: invite.tenantId,
          role: invite.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // 重新获取更新后的 user
      const updatedUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });
      if (updatedUser) user = updatedUser;
    } else {
      // 新用户创建
      const [newUser] = await db
        .insert(users)
        .values({
          email: null,
          phone: `WX_${openId.slice(0, 15)}`,
          tenantId: invite.tenantId,
          role: invite.role,
          wechatOpenId: openId,
          name: '微信用户',
          isActive: true,
        })
        .returning();
      user = newUser;
    }

    // 3. 获取租户信息
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, invite.tenantId),
    });

    // 4. 生成正式 Token（统一 7d 有效期）
    const token = await generateMiniprogramToken(user!.id, invite.tenantId);

    logger.info('[InviteAccept] 用户接受邀请', {
      route: 'invite/accept',
      userId: user!.id,
      tenantId: invite.tenantId,
      inviteCode: code,
    });

    // 5. 审计日志
    const { AuditService } = await import('@/shared/services/audit-service');
    await AuditService.log(db, {
      tableName: 'invitations',
      recordId: invite.id,
      action: 'ACCEPT_INVITE',
      userId: user!.id,
      tenantId: invite.tenantId,
      details: { code, role: invite.role }
    });

    return apiSuccess({
      user: {
        id: user!.id,
        name: user!.name,
        phone: user!.phone,
        role: user!.role,
        tenantId: invite.tenantId,
        tenantName: tenant?.name,
      },
      token,
      tenantStatus: tenant?.status,
    });
  } catch (error) {
    logger.error('[InviteAccept] 接受邀请异常', { route: 'invite/accept', error });
    return apiError('接受邀请失败', 500);
  }
}
