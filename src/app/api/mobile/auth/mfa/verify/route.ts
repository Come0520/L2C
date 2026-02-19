
import { NextRequest } from 'next/server';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('auth:mfa:verify');
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { verifyToken, generateAccessToken, generateRefreshToken } from '@/shared/lib/jwt';
import { VerificationCodeService } from '@/shared/services/verification-code.service';
import { withRateLimit, getRateLimitKey } from '@/shared/middleware/rate-limiter';

/**
 * MFA 验证接口
 * 
 * @description 验证 preAuthToken 和短信/验证码。验证成功后返回正式的 Access Token 和 Refresh Token。
 * 已集成速率限制：3 分钟内最多 5 次验证尝试。
 * 
 * @param {NextRequest} request - JSON body 需包含 preAuthToken 和 code
 * @returns {Promise<NextResponse>} 返回认证令牌
 */
async function mfaVerifyHandler(request: NextRequest) {
    try {
        const body = await request.json();
        const { preAuthToken, code } = body;

        if (!preAuthToken || !code) {
            return apiError('缺少必要参数', 400);
        }

        // 1. 验证 Pre-Auth Token
        const payload = await verifyToken(preAuthToken);
        if (!payload || payload.type !== 'pre-auth') {
            return apiError('会话已失效，请重新登录', 401);
        }

        // 2. 验证短信验证码
        const isValid = await VerificationCodeService.verify(payload.userId, code, 'LOGIN_MFA');
        if (!isValid) {
            return apiError('验证码错误或已过期', 400);
        }

        // 3. 生成正式 Token
        const accessToken = await generateAccessToken(
            payload.userId,
            payload.tenantId,
            payload.phone,
            payload.role
        );
        const refreshToken = await generateRefreshToken(
            payload.userId,
            payload.tenantId,
            payload.phone,
            payload.role
        );

        return apiSuccess({
            accessToken,
            refreshToken,
            expiresIn: 86400,
            user: {
                id: payload.userId,
                tenantId: payload.tenantId,
                name: undefined,
                phone: payload.phone,
                role: payload.role
            }
        }, '验证通过');

    } catch (error) {
        log.error('MFA 验证错误', { error: error instanceof Error ? error.message : String(error) }, error);
        return apiError('服务器内部错误', 500);
    }
}

// 应用速率限制：3 分钟内最多 5 次尝试
export const POST = withRateLimit(
    mfaVerifyHandler,
    { windowMs: 3 * 60 * 1000, maxAttempts: 5, message: '验证过于频繁，请 3 分钟后再试' },
    getRateLimitKey('auth:mfa')
);
