import { SignJWT } from 'jose';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const TEST_SECRET = 'test-secret-key-must-be-at-least-32-chars-long';

// 预定义测试使用的 ID，对应本地开发库中的真实记录，避免审计日志外键约束失败 (500)
const VALID_TENANT_ID = 'e772e5f7-95fe-4b27-9949-fc69de11d647';
const VALID_WORKER_ID = '00aa5bea-a8d9-41e6-a8e3-7ae72d998b64';

/**
 * Generate a JWT token for testing mobile API
 */
export async function generateTestMobileToken(
    userId: string = VALID_WORKER_ID,
    role: string = 'WORKER'
): Promise<string> {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || TEST_SECRET);

    const payload = {
        userId: userId,
        tenantId: VALID_TENANT_ID,
        role: role,
        phone: '13800000000',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
    };
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .setIssuer('l2c-mobile')
        .sign(secret);
}
