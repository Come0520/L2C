import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as rateLimitedLoginHandler } from '../login/route';
import { db } from '@/shared/api/db';
import { compare } from 'bcryptjs';
import { generateAccessToken, generateRefreshToken, generatePreAuthToken } from '@/shared/lib/jwt';
import { VerificationCodeService } from '@/shared/services/verification-code.service';

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            users: { findFirst: vi.fn() },
            tenants: { findFirst: vi.fn() },
        }
    }
}));

vi.mock('bcryptjs', () => ({
    compare: vi.fn()
}));

vi.mock('@/shared/lib/jwt', () => ({
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    generatePreAuthToken: vi.fn(),
}));

vi.mock('@/shared/services/verification-code.service', () => ({
    VerificationCodeService: {
        generateAndSend: vi.fn(),
    }
}));

vi.mock('@/shared/middleware/rate-limiter', () => ({
    withRateLimit: (fn: any) => fn, // 剥离速率限制中间件执行原始处理程序以专注业务逻辑
    getRateLimitKey: () => 'test-key',
}));

describe('移动端登录 API', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createReq = (body: any) => new NextRequest('http://localhost/api/login', {
        method: 'POST',
        body: JSON.stringify(body)
    });

    it('缺少 phone/password 应返回 400', async () => {
        const req = createReq({ phone: '13800000000' });
        const res = await rateLimitedLoginHandler(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('手机号或密码不能为空');
    });

    it('错误密码应返回 401 模糊错误', async () => {
        const req = createReq({ phone: '13800138000', password: 'wrong' });

        vi.mocked(db.query.users.findFirst).mockResolvedValue({
            id: 'u1',
            passwordHash: 'hashed',
        } as any);

        vi.mocked(compare).mockResolvedValue(false);

        const res = await rateLimitedLoginHandler(req);
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toBe('手机号或密码错误'); // 固定提示确保无法枚举
    });

    it('禁用账号应无法登录', async () => {
        const req = createReq({ phone: '13811112222', password: 'pwd' });

        // SQL where 中包含 isActive: true，如果是禁用账号 findFirst 会返回 null
        vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined as any);

        const res = await rateLimitedLoginHandler(req);
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toBe('手机号或密码错误');
    });

    it('MFA 开启时应返回 preAuthToken', async () => {
        const req = createReq({ phone: '13822223333', password: 'right' });

        vi.mocked(db.query.users.findFirst).mockResolvedValue({
            id: 'u1', phone: '13822223333', passwordHash: 'hashed', tenantId: 't1', role: 'WORKER'
        } as any);
        vi.mocked(compare).mockResolvedValue(true);

        vi.mocked(db.query.tenants.findFirst).mockResolvedValue({
            settings: { mfa: { enabled: true, roles: ['WORKER'] } }
        } as any);

        vi.mocked(generatePreAuthToken).mockResolvedValue('fake.pre.token');

        const res = await rateLimitedLoginHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.data.mfaRequired).toBe(true);
        expect(data.data.preAuthToken).toBe('fake.pre.token');
        expect(VerificationCodeService.generateAndSend).toHaveBeenCalledWith('u1', '13822223333', 'LOGIN_MFA');
    });

    it('正确凭证应返回 Token 对', async () => {
        const req = createReq({ phone: '13833334444', password: 'pwd' });

        vi.mocked(db.query.users.findFirst).mockResolvedValue({
            id: 'u1', phone: '13833334444', passwordHash: 'hashed', tenantId: 't1', role: 'SALES', name: 'Sales1'
        } as any);
        vi.mocked(compare).mockResolvedValue(true);
        vi.mocked(db.query.tenants.findFirst).mockResolvedValue(null as any); // no MFA

        vi.mocked(generateAccessToken).mockResolvedValue('access');
        vi.mocked(generateRefreshToken).mockResolvedValue('refresh');

        const res = await rateLimitedLoginHandler(req);
        expect(res.status).toBe(200);
        const data = await res.json();

        expect(data.data.mfaRequired).toBe(false);
        expect(data.data.accessToken).toBe('access');
        expect(data.data.refreshToken).toBe('refresh');
        expect(data.data.user.role).toBe('SALES'); // Role fallback resolve map mapping handled inside switch
    });
});
