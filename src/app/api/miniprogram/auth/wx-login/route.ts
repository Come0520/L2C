/**
 * 微信小程序登录 API
 *
 * POST /api/miniprogram/auth/wx-login
 * 用 code 换取 openId，并检查是否已绑定用户
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { users, tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { generateMiniprogramToken, generateRegisterToken } from '../../auth-utils';
import { WxLoginSchema } from '../../miniprogram-schemas';
import { AuditService } from '@/shared/services/audit-service';

/**
 * 调用微信 jscode2session 接口获取 OpenID
 */
async function code2Session(code: string) {
  const appId = process.env.WX_APPID;
  const appSecret = process.env.WX_APPSECRET;

  if (!appId || !appSecret) {
    logger.error('[WxLogin] 微信小程序配置缺失', { route: 'wx-login' });
    throw new Error('微信小程序配置缺失');
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

  const startTime = Date.now();
  const res = await fetch(url);
  const duration = Date.now() - startTime;

  const data = await res.json();
  logger.info('[WxLogin] 微信 API 响应', { route: 'wx-login', duration: `${duration}ms` });

  if (data.errcode) {
    logger.error('[WxLogin] 微信登录失败', { route: 'wx-login', errcode: data.errcode });
    throw new Error('微信登录失败');
  }

  return {
    openId: data.openid,
    sessionKey: data.session_key,
    unionId: data.unionid,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Zod 输入验证
    const parsed = WxLoginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { code } = parsed.data;

    // 1. 获取 openId
    const { openId, unionId } = await code2Session(code);

    // 2. 查找用户
    const existingUser = await db.query.users.findFirst({
      where: eq(users.wechatOpenId, openId),
    });

    if (existingUser) {
      // 用户已存在，获取租户状态
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, existingUser.tenantId),
      });

      const token = await generateMiniprogramToken(existingUser.id, existingUser.tenantId);

      // 3. 审计日志
      await AuditService.log(db, {
        tableName: 'users',
        recordId: existingUser.id,
        action: 'LOGIN',
        userId: existingUser.id,
        tenantId: existingUser.tenantId,
        details: { method: 'WECHAT', openId }
      });

      logger.info('[WxLogin] 已有用户微信登录成功', {
        route: 'wx-login',
        userId: existingUser.id,
        tenantId: existingUser.tenantId,
      });

      return apiSuccess({
        openId,
        unionId,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          phone: existingUser.phone,
          email: existingUser.email,
          role: existingUser.role,
          tenantId: existingUser.tenantId,
          tenantName: tenant?.name,
          avatarUrl: existingUser.avatarUrl,
        },
        tenantStatus: tenant?.status,
        token,
      });
    }

    // 用户不存在，返回签名加密的 registerToken 供后续注册使用
    const registerToken = await generateRegisterToken(openId, unionId);
    logger.info('[WxLogin] 新用户，返回 registerToken 待注册', { route: 'wx-login' });

    return apiSuccess({
      registerToken,
      user: null,
    });
  } catch (error: unknown) {
    logger.error('[WxLogin] 微信登录异常', { route: 'wx-login', error });
    // 安全：不向客户端暴露任何技术细节
    return apiError('微信登录服务异常', 500);
  }
}
