import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginHandler } from '../auth/login/route';
import { POST as wxLoginHandler } from '../auth/wx-login/route';
import { POST as decryptPhoneHandler } from '../auth/decrypt-phone/route';
import { db } from '@/shared/api/db';
import { compare } from 'bcryptjs';
import * as authUtils from '../auth-utils';
import { AuditService } from '@/shared/services/audit-service';

// Mock DB
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            users: { findFirst: vi.fn() },
            tenants: { findFirst: vi.fn() },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn().mockResolvedValue({}),
            })),
        })),
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
            })),
        })),
    }
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
    compare: vi.fn()
}));

// Mock Auth Utils
vi.mock('../auth-utils', async () => {
    const actual = await vi.importActual('../auth-utils');
    return {
        ...(actual as Record<string, unknown>),
        generateMiniprogramToken: vi.fn().mockResolvedValue('mock-token'),
        generateRegisterToken: vi.fn().mockResolvedValue('mock-register-token'),
    };
});

// Mock Audit Service
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue(undefined),
    }
}));

// Mock global fetch
global.fetch = vi.fn();

describe('小程序认证模块', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.WX_APPID = 'test-appid';
        process.env.WX_APPSECRET = 'test-secret';
    });

    const createReq = (url: string, body: unknown) => new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify(body)
    });

    describe('密码登录 (auth/login)', () => {
        it('登录成功应返回 Token 和用户信息', async () => {
            const req = createReq('http://localhost/api/auth/login', {
                account: '13800138000',
                password: 'password123'
            });

            vi.mocked(db.query.users.findFirst).mockResolvedValue({
                id: 'u1',
                name: '测试用户',
                phone: '13800138000',
                passwordHash: 'hashed_pwd',
                tenantId: 't1',
                role: 'WORKER'
            } as never);

            vi.mocked(compare).mockResolvedValue(true as never);

            vi.mocked(db.query.tenants.findFirst).mockResolvedValue({
                id: 't1',
                name: '测试租户',
                status: 'active'
            } as never);

            const res = await loginHandler(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.data.token).toBe('mock-token');
            expect(data.data.user.id).toBe('u1');
            expect(AuditService.log).toHaveBeenCalled();
        });

        it('账号或密码错误应返回 401', async () => {
            const req = createReq('http://localhost/api/auth/login', {
                account: '13800138000',
                password: 'wrong-password'
            });

            vi.mocked(db.query.users.findFirst).mockResolvedValue({
                id: 'u1',
                passwordHash: 'hashed_pwd',
            } as never);

            vi.mocked(compare).mockResolvedValue(false as never);

            const res = await loginHandler(req);
            expect(res.status).toBe(401);
            const data = await res.json();
            expect(data.error).toBe('账号或密码错误');
        });

        it('Zod 验证不通过应返回 400', async () => {
            const req = createReq('http://localhost/api/auth/login', {
                account: '', // 必填
                password: '123'
            });

            const res = await loginHandler(req);
            expect(res.status).toBe(400);
        });
    });

    describe('微信登录 (auth/wx-login)', () => {
        it('已有用户登录应返回 Token', async () => {
            const req = createReq('http://localhost/api/auth/wx-login', {
                code: 'valid-code'
            });

            vi.mocked(fetch).mockResolvedValue({
                json: async () => ({ openid: 'o1', session_key: 's1' })
            } as never);

            vi.mocked(db.query.users.findFirst).mockResolvedValue({
                id: 'u1',
                wechatOpenId: 'o1',
                tenantId: 't1'
            } as never);

            vi.mocked(db.query.tenants.findFirst).mockResolvedValue({
                id: 't1',
                name: '测试租户'
            } as never);

            const res = await wxLoginHandler(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.data.token).toBe('mock-token');
            expect(data.data.openId).toBe('o1');
        });

        it('新用户应返回 openId 且 user 为 null', async () => {
            const req = createReq('http://localhost/api/auth/wx-login', {
                code: 'new-user-code'
            });

            vi.mocked(fetch).mockResolvedValue({
                json: async () => ({ openid: 'o_new', session_key: 's_new' })
            } as never);

            vi.mocked(db.query.users.findFirst).mockResolvedValue(null as never);

            const res = await wxLoginHandler(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.data.user).toBeNull();
            expect(data.data.registerToken).toBeDefined();
            expect(data.data.openId).toBeUndefined();
        });
    });

    describe('手机号解密登录 (auth/decrypt-phone)', () => {
        it('手机号已注册应直接登录', async () => {
            const req = createReq('http://localhost/api/auth/decrypt-phone', {
                code: 'phone-code',
                openId: 'o1'
            });

            // Mock getAccessToken 和 getPhoneNumber (fetch calls)
            vi.mocked(fetch)
                .mockResolvedValueOnce({ // Access Token
                    json: async () => ({ access_token: 'at1' })
                } as never)
                .mockResolvedValueOnce({ // Phone Info
                    json: async () => ({ errcode: 0, phone_info: { phoneNumber: '13812345678' } })
                } as never);

            vi.mocked(db.query.users.findFirst).mockResolvedValue({
                id: 'u1',
                phone: '13812345678',
                tenantId: 't1'
            } as never);

            vi.mocked(db.query.tenants.findFirst).mockResolvedValue({
                id: 't1',
                name: '测试租户'
            } as never);

            const res = await decryptPhoneHandler(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.data.token).toBe('mock-token');
            expect(data.data.user.phone).toBe('13812345678');
        });

        it('手机号未注册应返回 USER_NOT_FOUND', async () => {
            const req = createReq('http://localhost/api/auth/decrypt-phone', {
                code: 'new-phone-code'
            });

            vi.mocked(fetch)
                .mockResolvedValueOnce({ json: async () => ({ access_token: 'at1' }) } as never)
                .mockResolvedValueOnce({ json: async () => ({ errcode: 0, phone_info: { phoneNumber: '13912345678' } }) } as never);

            vi.mocked(db.query.users.findFirst).mockResolvedValue(null as never);

            const res = await decryptPhoneHandler(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.data.status).toBe('USER_NOT_FOUND');
            expect(data.data.phone).toBe('13912345678');
        });
    });

    describe('认证边界场景', () => {
        it('未设置密码的微信用户尝试密码登录应返回 401', async () => {
            const req = createReq('http://localhost/api/auth/login', {
                account: '13800138000', password: 'any-password'
            });

            vi.mocked(db.query.users.findFirst).mockResolvedValue({
                id: 'u1', phone: '13800138000', passwordHash: null, tenantId: 't1'
            } as never);

            const res = await loginHandler(req);
            expect(res.status).toBe(401);
            const data = await res.json();
            expect(data.error).toContain('未设置密码');
        });

        it('用户不存在应返回模糊错误（防枚举）', async () => {
            const req = createReq('http://localhost/api/auth/login', {
                account: 'nonexistent@test.com', password: 'password'
            });

            vi.mocked(db.query.users.findFirst).mockResolvedValue(null as never);

            const res = await loginHandler(req);
            expect(res.status).toBe(401);
            const data = await res.json();
            expect(data.error).toBe('账号或密码错误'); // 不能暴露"用户不存在"
        });

        it('微信 API 异常应优雅降级返回 500', async () => {
            const req = createReq('http://localhost/api/auth/wx-login', { code: 'bad-code' });

            vi.mocked(fetch).mockResolvedValue({
                json: async () => ({ errcode: 40029, errmsg: 'invalid code' })
            } as never);

            const res = await wxLoginHandler(req);
            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data.error).not.toContain('40029'); // 不泄露微信错误码
        });

        it('租户不存在应返回 500', async () => {
            const req = createReq('http://localhost/api/auth/login', {
                account: '13800138000', password: 'password123'
            });

            vi.mocked(db.query.users.findFirst).mockResolvedValue({
                id: 'u1', passwordHash: 'hashed', tenantId: 't-missing'
            } as never);
            vi.mocked(compare).mockResolvedValue(true as never);
            vi.mocked(db.query.tenants.findFirst).mockResolvedValue(null as never);

            const res = await loginHandler(req);
            expect(res.status).toBe(500);
        });

        it('wx-login 空 code 应被 Zod 拒绝', async () => {
            const req = createReq('http://localhost/api/auth/wx-login', { code: '' });

            const res = await wxLoginHandler(req);
            expect(res.status).toBe(400);
        });
    });
});
