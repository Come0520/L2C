'use server';

import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { env } from '@/shared/config/env';
import { SystemRoleType } from '@/shared/types/roles';
import { logger } from '@/shared/lib/logger';

/**
 * JWT Token 有效期配置
 */
const ACCESS_TOKEN_EXPIRY = '24h'; // 访问令牌：24小时
const REFRESH_TOKEN_EXPIRY = '7d'; // 刷新令牌：7天

/**
 * 移动端/小程序端 通用 Token 载荷接口
 */
export interface AppTokenPayload extends JWTPayload {
  userId?: string;
  tenantId?: string;
  phone?: string;
  role?: SystemRoleType | string;
  type: string; // 'access' | 'refresh' | 'pre-auth' | 'miniprogram' | 'REGISTER' | 'TEMP_LOGIN'
  openId?: string;
  unionId?: string;
}

/**
 * 获取 JWT 密钥
 *
 * @throws 如果 AUTH_SECRET 未设置或长度不足 32 字符
 */
function getSecretKey(): Uint8Array {
  const secret = env.AUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      '安全配置错误: AUTH_SECRET 环境变量未设置或长度不足 32 字符。' +
        '请在 .env 文件中设置有效的 AUTH_SECRET。'
    );
  }
  return new TextEncoder().encode(secret);
}

// ==========================================
// 移动端专用 Token (Issuer: l2c-mobile)
// ==========================================

export async function generatePreAuthToken(
  userId: string,
  tenantId: string,
  phone: string,
  role: string
): Promise<string> {
  return await new SignJWT({
    userId,
    tenantId,
    phone,
    role,
    type: 'pre-auth',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .setIssuer('l2c-mobile')
    .sign(getSecretKey());
}

export async function generateAccessToken(
  userId: string,
  tenantId: string,
  phone: string,
  role: string
): Promise<string> {
  return await new SignJWT({
    userId,
    tenantId,
    phone,
    role,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer('l2c-mobile')
    .sign(getSecretKey());
}

export async function generateRefreshToken(
  userId: string,
  tenantId: string,
  phone: string,
  role: string
): Promise<string> {
  return await new SignJWT({
    userId,
    tenantId,
    phone,
    role,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuer('l2c-mobile')
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<AppTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'l2c-mobile',
    });
    return payload as AppTokenPayload;
  } catch {
    return null;
  }
}

export async function extractAndVerifyToken(
  authHeader: string | null
): Promise<AppTokenPayload | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyToken(token);
}

// ==========================================
// 小程序端专用 Token (Issuer: l2c-miniprogram)
// ==========================================

export async function generateMiniprogramToken(
  userId: string,
  tenantId: string,
  role?: string,
  options?: {
    type?: string;
    expiresIn?: string;
    phone?: string;
  }
): Promise<string> {
  const type = options?.type ?? 'miniprogram';
  const expiresIn = options?.expiresIn ?? '7d';

  const token = await new SignJWT({
    userId,
    tenantId,
    role,
    type,
    phone: options?.phone,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setIssuer('l2c-miniprogram')
    .sign(getSecretKey());

  logger.info('[Auth] Miniprogram Token 已签发', {
    route: 'shared/lib/jwt',
    userId,
    tenantId,
    type,
    role,
    expiresIn,
  });

  return token;
}

export async function verifyMiniprogramToken(token: string): Promise<AppTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'l2c-miniprogram',
    });
    return payload as AppTokenPayload;
  } catch {
    return null;
  }
}

export async function generateRegisterToken(openId: string, unionId?: string): Promise<string> {
  return new SignJWT({ openId, unionId, type: 'REGISTER' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .setIssuer('l2c-miniprogram') // 明确 Issuer，防止跨平台 Token 混用
    .sign(getSecretKey());
}

export async function verifyRegisterToken(
  token: string
): Promise<{ openId: string; unionId?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'l2c-miniprogram', // 验证 Issuer，防止 Token 混用攻击
    });
    if (payload.type !== 'REGISTER' || !payload.openId) return null;
    return {
      openId: payload.openId as string,
      unionId: payload.unionId as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function generateTempLoginToken(userId: string): Promise<string> {
  return new SignJWT({ userId, type: 'TEMP_LOGIN' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .setIssuer('l2c-web') // 明确 Issuer，仅允许 Web 端使用
    .sign(getSecretKey());
}

export async function verifyTempLoginToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'l2c-web', // 验证 Issuer，防止其他平台 Token 被复用
    });
    if (payload.type !== 'TEMP_LOGIN' || !payload.userId) return null;
    return payload.userId as string;
  } catch {
    return null;
  }
}
