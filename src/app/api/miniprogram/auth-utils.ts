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

    try {
        const token = authHeader.slice(7);
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
