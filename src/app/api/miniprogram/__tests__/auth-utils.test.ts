/**
 * auth-utils 认证工具单元测试
 *
 * 覆盖：JWT Token 生成/验证、开发环境 Mock、注册令牌全流程
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock jose 模块，避免依赖真实密钥
vi.mock('jose', () => {
    // 使用 function 而非箭头函数，使其支持 new 调用
    const MockSignJWT = vi.fn().mockImplementation(function () {
        return {
            setProtectedHeader: vi.fn().mockReturnThis(),
            setIssuedAt: vi.fn().mockReturnThis(),
            setExpirationTime: vi.fn().mockReturnThis(),
            sign: vi.fn().mockResolvedValue('mock-signed-token'),
        };
    });
    return {
        jwtVerify: vi.fn(),
        SignJWT: MockSignJWT,
    };
});

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
    getMiniprogramUser,
    generateMiniprogramToken,
    generateRegisterToken,
    verifyRegisterToken,
} from '../auth-utils';
import { jwtVerify } from 'jose';

describe('auth-utils 认证工具模块', () => {
    const ORIGINAL_ENV = process.env;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...ORIGINAL_ENV, AUTH_SECRET: 'test-secret-key-32chars-minimum!!' };
    });

    afterEach(() => {
        process.env = ORIGINAL_ENV;
    });

    // ===================== getMiniprogramUser =====================

    describe('getMiniprogramUser - 身份验证', () => {
        it('缺少 Authorization 头应返回 null', async () => {
            const req = new NextRequest('http://localhost/api/test');
            const result = await getMiniprogramUser(req);
            expect(result).toBeNull();
        });

        it('非 Bearer 开头的 Token 应返回 null', async () => {
            const req = new NextRequest('http://localhost/api/test', {
                headers: { authorization: 'Basic invalid-token' },
            });
            const result = await getMiniprogramUser(req);
            expect(result).toBeNull();
        });

        it('有效 Token 应成功解析用户信息', async () => {
            vi.mocked(jwtVerify).mockResolvedValue({
                payload: { userId: 'user-123', tenantId: 'tenant-456', role: 'admin' },
                protectedHeader: { alg: 'HS256' },
            } as never);

            const req = new NextRequest('http://localhost/api/test', {
                headers: { authorization: 'Bearer valid-jwt-token' },
            });
            const result = await getMiniprogramUser(req);

            expect(result).toEqual({
                id: 'user-123',
                tenantId: 'tenant-456',
                role: 'admin',
            });
        });

        it('Token 缺少 userId 应返回 null', async () => {
            vi.mocked(jwtVerify).mockResolvedValue({
                payload: { tenantId: 'tenant-456' },
                protectedHeader: { alg: 'HS256' },
            } as never);

            const req = new NextRequest('http://localhost/api/test', {
                headers: { authorization: 'Bearer incomplete-token' },
            });
            const result = await getMiniprogramUser(req);
            expect(result).toBeNull();
        });

        it('Token 缺少 tenantId 应返回 null', async () => {
            vi.mocked(jwtVerify).mockResolvedValue({
                payload: { userId: 'user-123' },
                protectedHeader: { alg: 'HS256' },
            } as never);

            const req = new NextRequest('http://localhost/api/test', {
                headers: { authorization: 'Bearer no-tenant-token' },
            });
            const result = await getMiniprogramUser(req);
            expect(result).toBeNull();
        });

        it('Token 验证失败（签名无效/过期）应返回 null', async () => {
            vi.mocked(jwtVerify).mockRejectedValue(new Error('JWTExpired'));

            const req = new NextRequest('http://localhost/api/test', {
                headers: { authorization: 'Bearer expired-token' },
            });
            const result = await getMiniprogramUser(req);
            expect(result).toBeNull();
        });

        it('开发环境下 dev-mock-token 应返回测试用户', async () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const req = new NextRequest('http://localhost/api/test', {
                headers: { authorization: 'Bearer dev-mock-token-test' },
            });
            const result = await getMiniprogramUser(req);

            expect(result).toEqual({
                id: 'test-user-00000000-0000-0000-0000-000000000001',
                tenantId: 'test-tenant-00000000-0000-0000-0000-000000000001',
                role: 'admin',
            });

            process.env.NODE_ENV = originalNodeEnv;
        });

        it('无 role 的 Token 应返回 role 为 undefined', async () => {
            vi.mocked(jwtVerify).mockResolvedValue({
                payload: { userId: 'user-123', tenantId: 'tenant-456' },
                protectedHeader: { alg: 'HS256' },
            } as never);

            const req = new NextRequest('http://localhost/api/test', {
                headers: { authorization: 'Bearer no-role-token' },
            });
            const result = await getMiniprogramUser(req);

            expect(result).toEqual({
                id: 'user-123',
                tenantId: 'tenant-456',
                role: undefined,
            });
        });
    });

    // ===================== generateMiniprogramToken =====================

    describe('generateMiniprogramToken - Token 签发', () => {
        it('应成功生成包含 userId 和 tenantId 的 Token', async () => {
            const token = await generateMiniprogramToken('user-1', 'tenant-1');
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
        });

        it('应支持自定义 type 和 expiresIn 选项', async () => {
            const token = await generateMiniprogramToken('user-1', 'tenant-1', {
                type: 'refresh',
                expiresIn: '30d',
            });
            expect(token).toBeDefined();
        });

        it('默认参数应使用 miniprogram 类型和 7d 过期时间', async () => {
            await generateMiniprogramToken('user-1', 'tenant-1');
            // 验证 Token 是否被签发（通过 SignJWT mock）
            const { SignJWT } = await import('jose');
            expect(SignJWT).toHaveBeenCalledWith({
                userId: 'user-1',
                tenantId: 'tenant-1',
                type: 'miniprogram',
            });
        });
    });

    // ===================== generateRegisterToken =====================

    describe('generateRegisterToken - 注册临时令牌', () => {
        it('应成功生成包含 openId 的注册令牌', async () => {
            const token = await generateRegisterToken('openid-abc');
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
        });

        it('应支持可选的 unionId 参数', async () => {
            const token = await generateRegisterToken('openid-abc', 'unionid-xyz');
            expect(token).toBeDefined();
        });
    });

    // ===================== verifyRegisterToken =====================

    describe('verifyRegisterToken - 注册令牌验证', () => {
        it('有效的注册令牌应正确解析 openId', async () => {
            vi.mocked(jwtVerify).mockResolvedValue({
                payload: { type: 'REGISTER', openId: 'verified-openid' },
                protectedHeader: { alg: 'HS256' },
            } as never);

            const result = await verifyRegisterToken('valid-register-token');
            expect(result).toEqual({ openId: 'verified-openid', unionId: undefined });
        });

        it('含 unionId 的注册令牌应同时解析', async () => {
            vi.mocked(jwtVerify).mockResolvedValue({
                payload: { type: 'REGISTER', openId: 'openid-1', unionId: 'unionid-1' },
                protectedHeader: { alg: 'HS256' },
            } as never);

            const result = await verifyRegisterToken('with-union-token');
            expect(result).toEqual({ openId: 'openid-1', unionId: 'unionid-1' });
        });

        it('非 REGISTER 类型的令牌应返回 null', async () => {
            vi.mocked(jwtVerify).mockResolvedValue({
                payload: { type: 'miniprogram', openId: 'openid-1' },
                protectedHeader: { alg: 'HS256' },
            } as never);

            const result = await verifyRegisterToken('wrong-type-token');
            expect(result).toBeNull();
        });

        it('缺少 openId 的令牌应返回 null', async () => {
            vi.mocked(jwtVerify).mockResolvedValue({
                payload: { type: 'REGISTER' },
                protectedHeader: { alg: 'HS256' },
            } as never);

            const result = await verifyRegisterToken('no-openid-token');
            expect(result).toBeNull();
        });

        it('过期或伪造的令牌应返回 null', async () => {
            vi.mocked(jwtVerify).mockRejectedValue(new Error('JWTExpired'));
            const result = await verifyRegisterToken('expired-token');
            expect(result).toBeNull();
        });
    });
});
