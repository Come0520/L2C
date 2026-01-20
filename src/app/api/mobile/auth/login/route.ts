
import { db } from '@/shared/api/db';
import { users, tenants } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { generateAccessToken, generateRefreshToken, generatePreAuthToken } from '@/shared/lib/jwt';
import { VerificationCodeService } from '@/shared/services/verification-code.service';
import { compare } from 'bcryptjs';

/**
 * 移动端登录接口
 * POST /api/mobile/auth/login
 * 
 * @body { phone: string, password: string }
 * @returns { success: boolean, data: { accessToken, refreshToken, user } }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, password } = body;

        // 参数校验
        if (!phone || !password) {
            return apiError('手机号或密码不能为空', 400);
        }

        // 查找用户
        const user = await db.query.users.findFirst({
            where: and(
                eq(users.phone, phone),
                eq(users.isActive, true)
            )
        });

        // 安全修复：统一返回模糊错误信息，防止用户枚举攻击
        if (!user || !user.passwordHash) {
            return apiError('手机号或密码错误', 401);
        }

        // 安全修复：验证密码哈希
        const passwordsMatch = await compare(password, user.passwordHash);
        if (!passwordsMatch) {
            return apiError('手机号或密码错误', 401);
        }

        // 角色映射 logic
        let mobileRole = 'WORKER'; // Default fallback
        const dbRole = user.role || '';

        // Simple mapping based on known enums
        // 'ADMIN', 'SALES', 'MANAGER', 'WORKER', 'FINANCE', 'SUPPLY'
        switch (dbRole) {
            case 'ADMIN':
            case 'MANAGER':
                mobileRole = 'BOSS';
                break;
            case 'SALES':
                mobileRole = 'SALES';
                break;
            case 'WORKER':
                mobileRole = 'WORKER';
                break;
            case 'SUPPLY':
                mobileRole = 'PURCHASER';
                break;
            default:
                mobileRole = 'WORKER';
        }

        // ... existing user check ...

        // 7. MFA Check
        // Fetch tenant settings
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, user.tenantId),
            columns: {
                settings: true
            }
        });

        const settings = tenant?.settings as any; // Cast generic jsonb
        const mfaConfig = settings?.mfa;

        let mfaRequired = false;
        if (mfaConfig?.enabled && mfaConfig?.roles?.includes(mobileRole)) {
            mfaRequired = true;
        }

        if (mfaRequired) {
            // Generate SMS Code
            const userPhone = user.phone || phone;
            await VerificationCodeService.generateAndSend(user.id, userPhone, 'LOGIN_MFA');

            // Generate Pre-Auth Token
            const preAuthToken = await generatePreAuthToken(
                user.id,
                user.tenantId,
                userPhone,
                mobileRole
            );

            return apiSuccess({
                mfaRequired: true,
                preAuthToken,
                maskPhone: userPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') // Simple mask
            });
        }

        // 生成 JWT Token (Normal Flow)
        const userPhone = user.phone || phone; // 使用登录时的手机号作为备用
        const accessToken = await generateAccessToken(user.id, user.tenantId, userPhone, mobileRole);
        const refreshToken = await generateRefreshToken(user.id, user.tenantId, userPhone, mobileRole);

        return apiSuccess({
            mfaRequired: false,
            accessToken,
            refreshToken,
            expiresIn: 86400, // 24小时（秒）
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                avatar: user.avatarUrl,
                tenantId: user.tenantId,
                role: mobileRole // Return mapped role to client
            }
        });

    } catch (error) {
        console.error('移动端登录错误:', error);
        return apiError('服务器内部错误', 500);
    }
}

