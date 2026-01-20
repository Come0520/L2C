'use server';

import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { env } from '@/shared/config/env';

/**
 * JWT Token 有效期配置
 */
const ACCESS_TOKEN_EXPIRY = '24h';  // 访问令牌：24小时
const REFRESH_TOKEN_EXPIRY = '7d';  // 刷新令牌：7天

/**
 * 移动端 Token 载荷接口
 */
export interface MobileTokenPayload extends JWTPayload {
    userId: string;
    tenantId: string;
    phone: string;
    type: 'access' | 'refresh';
}

/**
 * 获取 JWT 密钥
 * 
 * @throws 如果 AUTH_SECRET 未设置或长度不足 32 字符
 */
function getSecretKey(): Uint8Array {
    const secret = env.AUTH_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error(
            '安全配置错误: AUTH_SECRET 环境变量未设置或长度不足 32 字符。' +
            '请在 .env 文件中设置有效的 AUTH_SECRET。'
        );
    }
    return new TextEncoder().encode(secret);
}

/**
 * 生成访问令牌 (Access Token)
 * @param userId 用户ID
 * @param tenantId 租户ID
 * @param phone 手机号
 */
export async function generateAccessToken(
    userId: string,
    tenantId: string,
    phone: string
): Promise<string> {
    const token = await new SignJWT({
        userId,
        tenantId,
        phone,
        type: 'access',
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .setIssuer('l2c-mobile')
        .sign(getSecretKey());

    return token;
}

/**
 * 生成刷新令牌 (Refresh Token)
 * @param userId 用户ID
 * @param tenantId 租户ID
 * @param phone 手机号
 */
export async function generateRefreshToken(
    userId: string,
    tenantId: string,
    phone: string
): Promise<string> {
    const token = await new SignJWT({
        userId,
        tenantId,
        phone,
        type: 'refresh',
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_EXPIRY)
        .setIssuer('l2c-mobile')
        .sign(getSecretKey());

    return token;
}

/**
 * 验证并解析 Token
 * @param token JWT Token
 * @returns 解析后的载荷，失败返回 null
 */
export async function verifyToken(token: string): Promise<MobileTokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecretKey(), {
            issuer: 'l2c-mobile',
        });

        return payload as MobileTokenPayload;
    } catch {
        return null;
    }
}

/**
 * 从 Authorization Header 提取并验证 Token
 * @param authHeader Authorization 请求头
 * @returns 解析后的载荷，失败返回 null
 */
export async function extractAndVerifyToken(
    authHeader: string | null
): Promise<MobileTokenPayload | null> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7); // 移除 "Bearer " 前缀
    return verifyToken(token);
}
