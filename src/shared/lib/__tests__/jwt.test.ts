/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { SignJWT } from 'jose';
import {
    generateAccessToken,
    generateRefreshToken,
    generatePreAuthToken,
    verifyToken,
    extractAndVerifyToken,
} from '../jwt';

// 设置统一的秘钥和颁发者进行测试
const TEST_SECRET = 'test-secret-key-1234567890123456';
vi.stubEnv('AUTH_SECRET', TEST_SECRET);
vi.stubEnv('JWT_ISSUER', 'l2c-mobile'); // 跟文件默认配置保持一致

vi.mock('@/shared/config/env', () => ({
    env: {
        AUTH_SECRET: 'test-secret-key-1234567890123456',
    },
}));

describe('JWT Token', () => {
    beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    });

    afterAll(() => {
        vi.useRealTimers();
        vi.unstubAllEnvs();
    });

    describe('Access Token', () => {
        it('应生成有效的 JWT 并包含正确的 payload', async () => {
            const token = await generateAccessToken('user-1', 'tenant-1', '13800138000', 'WORKER');
            const payload = await verifyToken(token);

            expect(payload).not.toBeNull();
            expect(payload).toMatchObject({
                type: 'access',
                userId: 'user-1',
                tenantId: 'tenant-1',
                phone: '13800138000',
                role: 'WORKER',
            });
        });

        it('应在 24 小时后过期', async () => {
            const token = await generateAccessToken('user-1', 'tenant-1', '13800138000', 'WORKER');

            // 快进 24 小时零 1 秒
            vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1000);

            const payload = await verifyToken(token);
            expect(payload).toBeNull(); // 已过期
        });

        it('issuer 应为 l2c-mobile', async () => {
            const token = await generateAccessToken('user-1', 'tenant-1', '13800138000', 'WORKER');
            const payload = await verifyToken(token);
            expect(payload?.iss).toBe('l2c-mobile');
        });
    });

    describe('Refresh Token', () => {
        it('应在 7 天后过期', async () => {
            const token = await generateRefreshToken('user-1', 'tenant-1', '13800138000', 'WORKER');

            // 快进 7 天零 1 秒
            vi.advanceTimersByTime(7 * 24 * 60 * 60 * 1000 + 1000);

            const payload = await verifyToken(token);
            expect(payload).toBeNull();
        });

        it('type 应为 refresh', async () => {
            const token = await generateRefreshToken('user-1', 'tenant-1', '13800138000', 'WORKER');
            const payload = await verifyToken(token);
            expect(payload?.type).toBe('refresh');
        });
    });

    describe('Pre-Auth Token (MFA)', () => {
        it('应在 5 分钟后过期', async () => {
            const token = await generatePreAuthToken('user-1', 'tenant-1', '13800138000', 'WORKER');

            // 快进 5 分钟零 1 秒
            vi.advanceTimersByTime(5 * 60 * 1000 + 1000);

            const payload = await verifyToken(token);
            expect(payload).toBeNull();
        });

        it('type 应为 pre-auth', async () => {
            const token = await generatePreAuthToken('user-1', 'tenant-1', '13800138000', 'WORKER');
            const payload = await verifyToken(token);
            expect(payload?.type).toBe('pre-auth');
        });
    });

    describe('verifyToken', () => {
        it('有效 Token 应返回 payload', async () => {
            const token = await generateAccessToken('u-1', 't-1', '123', 'WORKER');
            const res = await verifyToken(token);
            expect(res?.userId).toBe('u-1');
        });

        it('伪造 Token 应返回 null', async () => {
            const res = await verifyToken('invalid.token.string');
            expect(res).toBeNull();
        });

        it('issuer 不匹配应返回 null', async () => {
            const hackerToken = await new SignJWT({ userId: 'u-1' })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuer('hacker-inc')
                .sign(new TextEncoder().encode(TEST_SECRET));

            const res = await verifyToken(hackerToken);
            expect(res).toBeNull();
        });
    });

    describe('extractAndVerifyToken', () => {
        it('正确的 Bearer 格式应提取并验证', async () => {
            const token = await generateAccessToken('u-1', 't-1', '123', 'WORKER');
            const res = await extractAndVerifyToken(`Bearer ${token}`);
            expect(res?.type).toBe('access');
        });

        it('缺少 Bearer 前缀应返回 null', async () => {
            const token = await generateAccessToken('u-1', 't-1', '123', 'WORKER');
            const res = await extractAndVerifyToken(`${token}`);
            expect(res).toBeNull();
        });

        it('null 或空 header 应返回 null', async () => {
            const res1 = await extractAndVerifyToken(null);
            const res2 = await extractAndVerifyToken('');
            expect(res1).toBeNull();
            expect(res2).toBeNull();
        });
    });
});
