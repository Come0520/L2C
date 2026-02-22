/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
    authenticateMobile,
    requireWorker,
    requireInternal,
} from '../mobile-auth';
import * as jwtHelpers from '@/shared/lib/jwt';
import { SignJWT, jwtVerify } from 'jose';

// Helper to generate a real token for integrated tests
const secretString = 'test-secret-key-1234567890123456';
const secretKey = new TextEncoder().encode(secretString);

const generateRealToken = async (payload: any, expiresIn: string | number = '1h') => {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('l2c-mobile')
        .setExpirationTime(expiresIn)
        .sign(secretKey);
};

vi.mock('@/shared/config/env', () => ({
    env: {
        AUTH_SECRET: 'test-secret-key-1234567890123456',
    },
}));

vi.mock('@/shared/lib/logger', () => ({
    createLogger: () => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
    })
}));

describe('Mobile Auth 中间件 & JWT 集成', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('AUTH_SECRET', 'test-secret-key-1234567890123456');
    });

    describe('JWT 签发与生命周期提取端测试', () => {
        it('1. 完整真实 JWT Token 签发与解析链路测试', async () => {
            const payloadInfo = {
                userId: 'u111',
                tenantId: 't222',
                phone: '13800138000',
                role: 'BOSS' as any,
                type: 'access'
            };

            // 使用 shared/lib/jwt 的逻辑生成真实 Token
            const token = await jwtHelpers.generateAccessToken(
                payloadInfo.userId,
                payloadInfo.tenantId,
                payloadInfo.phone,
                payloadInfo.role
            );

            // 使用中间件包装的 extract 逻辑验证
            const req = new NextRequest('http://localhost/api', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await authenticateMobile(req);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.session.userId).toBe('u111');
                expect(result.session.role).toBe('BOSS');
                expect(result.session.tenantId).toBe('t222');
            }
        });

        it('2. 验证过期的 Token 将被拒绝 (Expired Token)', async () => {
            // 故意生成一个立刻过期（模拟过去）的 Token
            const nowInSecs = Math.floor(Date.now() / 1000);
            const expiredToken = await generateRealToken({
                userId: 'u2', tenantId: 't2', phone: '123', role: 'WORKER'
            }, nowInSecs - 60); // 过期一分钟

            // 等1毫秒确保过期
            await new Promise(r => setTimeout(r, 10));

            const req = new NextRequest('http://localhost/api', {
                headers: { Authorization: `Bearer ${expiredToken}` }
            });

            const result = await authenticateMobile(req);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.response.status).toBe(401);
            }
        });

        it('3. JwtVerify 被篡改的 Signature 将被果断拒接', async () => {
            const token = await generateRealToken({
                userId: 'u2', tenantId: 't2', phone: '123', role: 'WORKER'
            });

            // 篡改最后一位签名字符
            const fakeToken = token.slice(0, -5) + 'fake1';

            const req = new NextRequest('http://localhost/api', {
                headers: { Authorization: `Bearer ${fakeToken}` }
            });

            const result = await authenticateMobile(req);
            expect(result.success).toBe(false);
        });
    });

    describe('原authenticateMobile拦截测试', () => {
        it('无 Authorization header 应返回 401', async () => {
            const req = new NextRequest('http://localhost/api');
            const result = await authenticateMobile(req);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.response.status).toBe(401);
            }
        });

        it('有效 Token 头但携带奇怪前缀而非 Bearer 应返回 401拦截', async () => {
            const req = new NextRequest('http://localhost/api', {
                headers: { Authorization: 'Basic xxx' }
            });
            const result = await authenticateMobile(req);
            expect(result.success).toBe(false);
        });

        it('有效 Token 且缺少 traceId 时中间件将自动补充回传', async () => {
            const token = await jwtHelpers.generateAccessToken('u1', 't1', '123', 'SALES');

            const req = new NextRequest('http://localhost/api', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const result = await authenticateMobile(req);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.session.traceId).toBeDefined(); // 中间件 fallback 为 random UUID
                expect(result.session.traceId.length).toBeGreaterThan(10);
            }
        });
    });

    describe('角色边界拦截', () => {
        const mockSession = (role: string) => ({
            userId: 'u1', tenantId: 't1', phone: '123', role: role as any, traceId: '1'
        });

        it('requireWorker 边界断言', () => {
            expect(requireWorker(mockSession('WORKER')).allowed).toBe(true);
            expect(requireWorker(mockSession('SALES')).allowed).toBe(false);
        });

        it('requireInternal 边界断言', () => {
            expect(requireInternal(mockSession('WORKER')).allowed).toBe(true);
            expect(requireInternal(mockSession('SALES')).allowed).toBe(true);
            expect(requireInternal(mockSession('BOSS')).allowed).toBe(true);
            expect(requireInternal(mockSession('PURCHASER')).allowed).toBe(true);
            expect(requireInternal(mockSession('CUSTOMER')).allowed).toBe(false);
            expect(requireInternal(mockSession('GUEST' as any)).allowed).toBe(false);
        });

    });
});
