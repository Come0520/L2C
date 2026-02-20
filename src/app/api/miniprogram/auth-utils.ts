import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

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

    // 开发环境 Mock 登录支持
    if (process.env.NODE_ENV === 'development' && token.startsWith('dev-mock-token-')) {
        return {
            id: '00aa5bea-a8d9-41e6-a8e3-7ae72d998b64', // Real User ID (Worker)
            tenantId: 'e772e5f7-95fe-4b27-9949-fc69de11d647', // Real Tenant ID
            role: 'admin', // Force admin for testing
        };
    }

    try {
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
        const { payload } = await jwtVerify(token, secret);

        // 确保关键字段存在
        const userId = payload.userId as string | undefined;
        const tenantId = payload.tenantId as string | undefined;

        if (!userId || !tenantId) return null;

        return {
            id: userId,
            tenantId,
            role: (payload.role as string) || undefined,
        };
    } catch {
        return null;
    }
}
