/**
 * 微信手机号解密与登录/注册 API
 *
 * POST /api/miniprogram/auth/decrypt-phone
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { users, tenantMembers } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { generateMiniprogramToken, generateTempLoginToken } from '../../auth-utils';
import { DecryptPhoneSchema } from '../../miniprogram-schemas';

/**
 * 获取微信 Access Token
 */
async function getAccessToken() {
  const appId = process.env.WX_APPID;
  const appSecret = process.env.WX_APPSECRET;
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.errcode) {
    logger.error('[DecryptPhone] 获取 AccessToken 失败', {
      route: 'decrypt-phone',
      errcode: data.errcode,
    });
    throw new Error('获取 AccessToken 失败');
  }
  return data.access_token;
}

/**
 * 解密手机号 (新版接口: getuserphonenumber)
 * @see https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/getPhoneNumber.html
 */
async function getPhoneNumber(code: string) {
  const accessToken = await getAccessToken();
  const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const data = await res.json();
  if (data.errcode) {
    logger.error('[DecryptPhone] 获取手机号失败', {
      route: 'decrypt-phone',
      errcode: data.errcode,
    });
    throw new Error('获取手机号失败');
  }
  return data.phone_info;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Zod 输入验证
    const parsed = DecryptPhoneSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { code, openId } = parsed.data;

    // 1. 解密手机号
    const phoneInfo = await getPhoneNumber(code);
    const phoneNumber = phoneInfo.phoneNumber || phoneInfo.purePhoneNumber;

    if (!phoneNumber) {
      return apiError('无法获取手机号', 400);
    }

    logger.info('[DecryptPhone] 手机号解密成功', { route: 'decrypt-phone' });

    // 2. 查找用户 by Phone
    const user = await db.query.users.findFirst({
      where: eq(users.phone, phoneNumber),
    });

    if (user) {
      // 用户存在 -> 登录

      // 如果 openId 不同，绑定
      if (openId && user.wechatOpenId !== openId) {
        await db.update(users).set({ wechatOpenId: openId }).where(eq(users.id, user.id));
      }

      // 查找该用户的所有有效 memberships
      const memberships = await db.query.tenantMembers.findMany({
        where: and(eq(tenantMembers.userId, user.id), eq(tenantMembers.isActive, true)),
        with: { tenant: true },
      });

      if (memberships.length === 0) {
        return apiError('您尚未加入任何企业', 403);
      }

      const { AuditService } = await import('@/shared/services/audit-service');

      // 如果只有一个成员资格，自动进入
      if (memberships.length === 1) {
        const m = memberships[0];
        const token = await generateMiniprogramToken(user.id, m.tenantId);

        // 3. 审计日志
        await AuditService.log(db, {
          tableName: 'users',
          recordId: user.id,
          action: 'LOGIN',
          userId: user.id,
          tenantId: m.tenantId,
          details: { method: 'PHONE_DECRYPT', phoneNumber },
        });

        logger.info('[DecryptPhone] 单租户用户通过手机号登录成功', {
          route: 'decrypt-phone',
          userId: user.id,
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

      // 多租户情况，需要用户选择要进入的企业
      // 返回一个临时 token 供后续 /select-tenant 接口使用
      const tempToken = await generateTempLoginToken(user.id);

      logger.info('[DecryptPhone] 多租户用户需选择企业', {
        route: 'decrypt-phone',
        userId: user.id,
        membershipCount: memberships.length,
      });

      return apiSuccess({
        needTenantSelection: true,
        tempToken,
        userId: user.id,
        tenants: memberships.map((m) => ({
          id: m.tenantId,
          name: m.tenant.name,
          role: m.role,
        })),
      });
    } else {
      // 用户不存在 -> 返回 USER_NOT_FOUND，前端引导注册
      return apiSuccess(
        {
          status: 'USER_NOT_FOUND',
          phone: phoneNumber,
        },
        '验证成功，请完成注册'
      );
    }
  } catch (error: unknown) {
    logger.error('[DecryptPhone] 手机号解密异常', { route: 'decrypt-phone', error });
    // 安全：不向客户端暴露技术细节
    return apiError('手机号验证服务异常', 500);
  }
}
