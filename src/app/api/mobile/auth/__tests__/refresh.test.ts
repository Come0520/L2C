import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as rateLimitedRefreshHandler } from '../refresh/route';
import { db } from '@/shared/api/db';
import { verifyToken, generateAccessToken, generateRefreshToken } from '@/shared/lib/jwt';

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            users: { findFirst: vi.fn() },
            customers: { findFirst: vi.fn() },
        }
    }
}));

vi.mock('@/shared/lib/jwt', () => ({
    verifyToken: vi.fn(),
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
}));

vi.mock('@/shared/middleware/rate-limiter', () => ({
    withRateLimit: (fn: any) => fn, // 剥离速率限制中间件执行原始处理程序以专注业务逻辑
    getRateLimitKey: () => 'test-key',
}));

describe('移动端 Token 刷新 API', () => {
    const createReq = (body: any) => new NextRequest('http://localhost/api/refresh', {
        method: 'POST',
        body: JSON.stringify(body)
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('如果缺失 refreshToken 应当返回 400', async () => {
        const req = createReq({});
        const res = await rateLimitedRefreshHandler(req, {} as any);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.error).toBe('refreshToken 不能为空');
    });

    it('如果 token 无效应当返回 401', async () => {
        vi.mocked(verifyToken).mockResolvedValue(null);
        const req = createReq({ refreshToken: 'invalid-token' });
        const res = await rateLimitedRefreshHandler(req, {} as any);
        const data = await res.json();
        expect(res.status).toBe(401);
        expect(data.error).toBe('Token 无效或已过期');
    });

    it('如果 token 类型不是 refresh 应当返回 401', async () => {
        vi.mocked(verifyToken).mockResolvedValue({
            type: 'access',
            userId: 'user-1',
            tenantId: 'tenant-1',
            role: 'ADMIN'
        } as any);
        const req = createReq({ refreshToken: 'access-token' });
        const res = await rateLimitedRefreshHandler(req, {} as any);
        const data = await res.json();
        expect(res.status).toBe(401);
        expect(data.error).toBe('无效的 Token 类型');
    });

    it('如果用户已被禁用或失效应当返回 401 (内部人员)', async () => {
        vi.mocked(verifyToken).mockResolvedValue({
            type: 'refresh',
            userId: 'user-1',
            tenantId: 'tenant-1',
            role: 'ADMIN'
        } as any);
        vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

        const req = createReq({ refreshToken: 'valid-token' });
        const res = await rateLimitedRefreshHandler(req, {} as any);
        const data = await res.json();
        expect(res.status).toBe(401);
        expect(data.error).toBe('账户已失效或被禁用');
    });

    it('如果客户已失效应当返回 401 (CUSTOMER)', async () => {
        vi.mocked(verifyToken).mockResolvedValue({
            type: 'refresh',
            userId: 'user-1',
            tenantId: 'tenant-1',
            role: 'CUSTOMER'
        } as any);
        vi.mocked(db.query.customers.findFirst).mockResolvedValue(undefined);

        const req = createReq({ refreshToken: 'valid-token' });
        const res = await rateLimitedRefreshHandler(req, {} as any);
        const data = await res.json();
        expect(res.status).toBe(401);
        expect(data.error).toBe('账户已失效');
    });

    it('如果一切正常应当签发新的 Access 和 Refresh Token', async () => {
        vi.mocked(verifyToken).mockResolvedValue({
            type: 'refresh',
            userId: 'user-1',
            tenantId: 'tenant-1',
            role: 'ADMIN',
            phone: '13812345678'
        } as any);
        vi.mocked(db.query.users.findFirst).mockResolvedValue({
            id: 'user-1',
            isActive: true
        } as any);
        vi.mocked(generateAccessToken).mockResolvedValue('new-access-token');
        vi.mocked(generateRefreshToken).mockResolvedValue('new-refresh-token');

        const req = createReq({ refreshToken: 'valid-token' });
        const res = await rateLimitedRefreshHandler(req, {} as any);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.data.accessToken).toBe('new-access-token');
        expect(data.data.refreshToken).toBe('new-refresh-token');
        expect(data.data.expiresIn).toBe(86400);

        expect(generateAccessToken).toHaveBeenCalledWith('user-1', 'tenant-1', '13812345678', 'ADMIN');
        expect(generateRefreshToken).toHaveBeenCalledWith('user-1', 'tenant-1', '13812345678', 'ADMIN');
    });
});
