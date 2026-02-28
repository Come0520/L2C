import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as generateInviteHandler } from '../invite/generate/route';
import { POST as acceptInviteHandler } from '../invite/accept/route';
import { db } from '@/shared/api/db';
import * as authUtils from '../auth-utils';
import { RolePermissionService } from '@/shared/lib/role-permission-service';

// Mock DB
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            users: { findFirst: vi.fn() },
            tenants: { findFirst: vi.fn() },
            invitations: { findFirst: vi.fn() },
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn().mockResolvedValue([{
                    id: 'new-user-id', name: '微信用户', phone: 'WX_test', role: 'SALES', tenantId: 't1'
                }]),
            })),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn().mockResolvedValue({}),
            })),
        })),
    }
}));

// Mock Auth Utils
vi.mock('../auth-utils', () => ({
    getMiniprogramUser: vi.fn(),
    generateMiniprogramToken: vi.fn().mockResolvedValue('mock-token'),
    verifyRegisterToken: vi.fn((token: string) => {
        if (token === 'mock.jwt.token') return Promise.resolve({ openId: 'test-open-id' });
        if (token === 'mock.jwt.token2') return Promise.resolve({ openId: 'new-open-id' });
        return Promise.resolve(null);
    })
}));

// Mock Audit Service
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue(undefined),
    }
}));

// Mock Security Service (RateLimiter)
vi.mock('@/shared/services/miniprogram/security.service', () => ({
    RateLimiter: {
        allow: vi.fn().mockReturnValue(true),
    }
}));

// Mock RolePermissionService
vi.mock('@/shared/lib/role-permission-service', () => ({
    RolePermissionService: {
        hasPermission: vi.fn(),
    }
}));

// Mock jose (避免真实 JWT 签名和验证)
vi.mock('jose', () => {
    class MockSignJWT {
        setProtectedHeader() { return this; }
        setIssuedAt() { return this; }
        setExpirationTime() { return this; }
        async sign() { return 'mock.jwt.token'; }
    }
    return {
        SignJWT: MockSignJWT,
        jwtVerify: vi.fn().mockResolvedValue({
            payload: { openId: 'test-open-id', type: 'REGISTER' }
        })
    };
});

// Mock nanoid
vi.mock('nanoid', () => ({
    customAlphabet: () => () => '123456',
}));

describe('小程序邀请模块测试', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.AUTH_SECRET = 'test-secret-key-for-jwt-signing-min-32-chars';
        process.env.AUTH_URL = 'https://test.example.com';
    });

    const createReq = (url: string, body: unknown) => new NextRequest(url, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer mock-token' },
        body: JSON.stringify(body)
    });

    describe('生成邀请码 (invite/generate)', () => {
        it('非管理员应被拒绝 (403)', async () => {
            vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue({
                id: 'u1', tenantId: 't1'
            });
            vi.mocked(db.query.users.findFirst).mockResolvedValue({
                role: 'SALES' // 非管理员
            } as never);
            vi.mocked(RolePermissionService.hasPermission).mockResolvedValue(false);

            const req = createReq('http://localhost/api/invite/generate', { role: 'SALES' });
            const res = await generateInviteHandler(req);

            expect(res.status).toBe(403);
        });

        it('管理员应成功生成邀请码', async () => {
            vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue({
                id: 'u1', tenantId: 't1'
            });
            vi.mocked(db.query.users.findFirst).mockResolvedValue({
                role: 'ADMIN'
            } as never);
            vi.mocked(db.query.tenants.findFirst).mockResolvedValue({
                id: 't1', status: 'active'
            } as never);
            vi.mocked(RolePermissionService.hasPermission).mockResolvedValue(true);

            const req = createReq('http://localhost/api/invite/generate', { role: 'SALES' });
            const res = await generateInviteHandler(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.data.inviteCode).toBe('123456');
        });

        it('非活跃租户无法生成邀请码 (403)', async () => {
            vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue({
                id: 'u1', tenantId: 't1'
            });
            vi.mocked(db.query.users.findFirst).mockResolvedValue({
                role: 'ADMIN'
            } as never);
            vi.mocked(db.query.tenants.findFirst).mockResolvedValue({
                id: 't1', status: 'pending' // 未激活
            } as never);
            vi.mocked(RolePermissionService.hasPermission).mockResolvedValue(true);

            const req = createReq('http://localhost/api/invite/generate', { role: 'SALES' });
            const res = await generateInviteHandler(req);

            expect(res.status).toBe(403);
        });
    });

    describe('接受邀请 (invite/accept)', () => {
        it('过期邀请码应返回 404', async () => {
            vi.mocked(db.query.invitations.findFirst).mockResolvedValue(undefined as never);

            const req = createReq('http://localhost/api/invite/accept', {
                code: '999999', registerToken: 'mock.jwt.token'
            });
            const res = await acceptInviteHandler(req);

            expect(res.status).toBe(404);
            const data = await res.json();
            expect(data.error).toContain('邀请码无效');
        });

        it('已加入其他租户的用户应被拦截 (409)', async () => {
            vi.mocked(db.query.invitations.findFirst).mockResolvedValue({
                id: 'inv1', code: '123456', tenantId: 't-new', role: 'SALES', isActive: true
            } as never);

            vi.mocked(db.query.users.findFirst).mockResolvedValue({
                id: 'u1', tenantId: 't-old', wechatOpenId: 'test-open-id'
            } as never);

            const req = createReq('http://localhost/api/invite/accept', {
                code: '123456', registerToken: 'mock.jwt.token'
            });
            const res = await acceptInviteHandler(req);

            expect(res.status).toBe(409);
        });

        it('新用户接受邀请应成功创建账号并返回 Token', async () => {
            vi.mocked(db.query.invitations.findFirst).mockResolvedValue({
                id: 'inv1', code: '123456', tenantId: 't1', role: 'SALES', isActive: true
            } as never);
            vi.mocked(db.query.users.findFirst).mockResolvedValue(null as never);
            vi.mocked(db.query.tenants.findFirst).mockResolvedValue({
                id: 't1', name: '测试企业', status: 'active'
            } as never);

            const req = createReq('http://localhost/api/invite/accept', {
                code: '123456', registerToken: 'mock.jwt.token'
            });
            const res = await acceptInviteHandler(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.data.token).toBe('mock-token');
            expect(data.data.user.tenantId).toBe('t1');
        });
    });
});
