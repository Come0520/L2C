/**
 * 小程序端认证工具
 *
 * 所有 Miniprogram API 路由应使用此模块进行认证和 Token 管理，
 * 禁止在路由文件中内联 JWT 解析或 Token 生成代码。
 */
import { NextRequest } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { logger } from '@/shared/lib/logger';

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

    // 开发环境 Mock 登录支持（使用独立测试 ID，禁止使用生产数据）
    if (process.env.NODE_ENV === 'development' && token.startsWith('dev-mock-token-')) {
        return {
            id: 'test-user-00000000-0000-0000-0000-000000000001',
            tenantId: 'test-tenant-00000000-0000-0000-0000-000000000001',
            role: 'admin',
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

/**
 * 统一 JWT Token 生成
 *
 * 所有小程序端 Token 签发必须通过此函数，确保一致的过期时间和 payload 格式。
 *
 * @param userId 用户 ID
 * @param tenantId 租户 ID
 * @param options 可选配置
 * @returns 签名后的 JWT Token
 */
export async function generateMiniprogramToken(
    userId: string,
    tenantId: string,
    options?: {
        /** Token 类型标识，默认 'miniprogram' */
        type?: string;
        /** 过期时间，默认 '7d' */
        expiresIn?: string;
    }
): Promise<string> {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const type = options?.type ?? 'miniprogram';
    const expiresIn = options?.expiresIn ?? '7d';

    const token = await new SignJWT({
        userId,
        tenantId,
        type,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(secret);
    logger.info('[Auth] Token 已签发', {
        route: 'auth-utils',
        userId,
        tenantId,
        type,
        expiresIn,
    });

    return token;
}

/**
 * 签发供新用户注册或绑定使用的临时凭证（含加密保管的 openId）
 * 有效期极短（10分钟），避免前端篡改提交假 OpenID 越权
 *
 * @param openId 从微信验证后获取的真实 OpenID
 * @param unionId 可选，微信生态跨应用唯一标识
 */
export async function generateRegisterToken(openId: string, unionId?: string): Promise<string> {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

    return new SignJWT({
        openId,
        unionId,
        type: 'REGISTER',
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('10m') // 10分钟后过期
        .sign(secret);
}

/**
 * 解析并验证临时注册 Token，安全提取 OpenID
 *
 * @param token 前端传入的寄存态 Register Token
 * @returns 验证通过的 openId 字典，若失效或伪造则返回 null
 */
export async function verifyRegisterToken(token: string): Promise<{ openId: string; unionId?: string } | null> {
    try {
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
        const { payload } = await jwtVerify(token, secret);

        if (payload.type !== 'REGISTER' || !payload.openId) {
            return null;
        }

        return {
            openId: payload.openId as string,
            unionId: payload.unionId as string | undefined,
        };
    } catch {
        return null; // 过期或签名无效
    }
}
