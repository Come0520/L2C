/**
 * 小程序端认证工具
 *
 * 所有 Miniprogram API 路由应使用此模块进行认证和 Token 管理，
 * 禁止在路由文件中内联 JWT 解析或 Token 生成代码。
 */
import { NextRequest } from 'next/server';
import { apiError, apiForbidden, apiUnauthorized } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { verifyMiniprogramToken } from '@/shared/lib/jwt';

export {
  generateMiniprogramToken,
  generateRegisterToken,
  verifyRegisterToken,
  generateTempLoginToken,
  verifyTempLoginToken,
} from '@/shared/lib/jwt';

/**
 * Miniprogram 用户身份信息
 */
export interface AuthUser {
  /** 用户 ID */
  id: string;
  /** 租户 ID */
  tenantId: string;
  /** 用户角色 */
  role?: string;
  /** 用户手机号 */
  phone?: string;
}

export type MiniprogramRole = 'ADMIN' | 'MANAGER' | 'SALES' | 'WORKER' | 'CUSTOMER' | 'USER';

/**
 * 校验小程序用户是否具备指定角色
 * @param user 从 getMiniprogramUser 解析的用户
 * @param allowedRoles 允许的角色列表
 * @returns 是否通过校验
 */
export function checkMiniprogramRole(user: AuthUser, allowedRoles: MiniprogramRole[]): boolean {
  if (!user.role) return false;
  return allowedRoles.includes(user.role.toUpperCase() as MiniprogramRole);
}

import { headers } from 'next/headers';

/**
 * 高阶包装器：统一认证 + 角色校验
 * @param handler 原始路由处理函数，第二个参数注入 AuthUser，第三个参数为 context
 * @param allowedRoles 允许的角色列表（留空表示仅需认证、不限角色）
 */
export function withMiniprogramAuth(
  handler: (request: NextRequest, user: AuthUser, context?: any) => Promise<Response | any>,
  allowedRoles?: MiniprogramRole[]
) {
  return async (request: NextRequest, context?: any) => {
    // 强制调用 Next.js 动态 API，跳过构建时静态生成环境的预渲染 (重要！)
    // 这解决了因预渲染带有数据库连接的 API 路由引发的 Native 依赖错误（如 rimraf）
    await headers();

    const user = await getMiniprogramUser(request);
    if (!user) return apiUnauthorized('请先登录');
    if (!user.tenantId) return apiUnauthorized('无效租户');

    if (allowedRoles?.length && !checkMiniprogramRole(user, allowedRoles)) {
      return apiForbidden(`该功能仅限 ${allowedRoles.join('/')} 角色使用`);
    }

    return handler(request, user, context);
  };
}
/**
 * 统一获取并验证 Miniprogram 用户身份
 *
 * 所有 Miniprogram API 路由应使用此函数进行认证，
 * 禁止在路由文件中内联 JWT 解析代码。
 *
 * @param request NextRequest
 * @returns 解析后的用户信息，失败返回 null
 */
export async function getMiniprogramUser(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);

  // 开发环境 Mock 登录支持（使用独立测试 ID，禁止使用生产数据）
  const isLocalhost =
    request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1';
  if (
    process.env.NODE_ENV === 'development' &&
    isLocalhost &&
    !process.env.VERCEL &&
    token.startsWith('dev-mock-token-')
  ) {
    return {
      id: 'test-user-00000000-0000-0000-0000-000000000001',
      tenantId: 'test-tenant-00000000-0000-0000-0000-000000000001',
      role: 'admin',
    };
  }

  try {
    const payload = await verifyMiniprogramToken(token);

    // 确保关键字段存在
    const userId = payload?.userId as string | undefined;
    const tenantId = payload?.tenantId as string | undefined;

    if (!userId || !tenantId) return null;

    return {
      id: userId,
      tenantId,
      role: (payload?.role as string) || undefined,
    };
  } catch {
    return null;
  }
}
