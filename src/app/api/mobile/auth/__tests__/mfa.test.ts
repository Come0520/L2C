import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as mfaVerifyHandler } from '../mfa/verify/route';
import { verifyToken, generateAccessToken, generateRefreshToken } from '@/shared/lib/jwt';
import { VerificationCodeService } from '@/shared/services/verification-code.service';

vi.mock('@/shared/lib/jwt', () => ({
    verifyToken: vi.fn(),
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
}));

vi.mock('@/shared/services/verification-code.service', () => ({
    VerificationCodeService: {
        verify: vi.fn(),
    }
}));

vi.mock('@/shared/middleware/rate-limiter', () => ({
    withRateLimit: (fn: any) => fn,
    getRateLimitKey: () => 'test-key',
}));

describe('移动端 MFA 验证 API', () => {
    const createReq = (body: any) => new NextRequest('http://localhost/api/mobile/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('如果缺失 preAuthToken 或 code 应当返回 400', async () => {
        const req1 = createReq({ code: '123456' });
        const res1 = await mfaVerifyHandler(req1, {} as any);
        const data1 = await res1.json();
        expect(res1.status).toBe(400);
        expect(data1.error).toBe('缺少必要参数');

        const req2 = createReq({ preAuthToken: 'token' });
        const res2 = await mfaVerifyHandler(req2, {} as any);
        const data2 = await res2.json();
        expect(res2.status).toBe(400);
    });

    it('如果 preAuthToken 错误或已过期应当返回 401', async () => {
        vi.mocked(verifyToken).mockResolvedValue(null);

        const req = createReq({ preAuthToken: 'invalid', code: '123456' });
        const res = await mfaVerifyHandler(req, {} as any);
        const data = await res.json();

        expect(res.status).toBe(401);
        expect(data.error).toBe('会话已失效，请重新登录');
    });

    it('如果 token type 不是 pre-auth 应当返回 401', async () => {
        vi.mocked(verifyToken).mockResolvedValue({
            type: 'access',
            userId: 'user-1'
        } as any);

        const req = createReq({ preAuthToken: 'invalid-type', code: '123456' });
        const res = await mfaVerifyHandler(req, {} as any);
        const data = await res.json();

        expect(res.status).toBe(401);
        expect(data.error).toBe('会话已失效，请重新登录');
    });

    it('如果验证码错误或过期应当返回 400', async () => {
        vi.mocked(verifyToken).mockResolvedValue({
            type: 'pre-auth',
            userId: 'user-1'
        } as any);
        vi.mocked(VerificationCodeService.verify).mockResolvedValue(false);

        const req = createReq({ preAuthToken: 'valid-token', code: '000000' });
        const res = await mfaVerifyHandler(req, {} as any);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe('验证码错误或已过期');
        expect(VerificationCodeService.verify).toHaveBeenCalledWith('user-1', '000000', 'LOGIN_MFA');
    });

    it('如果所有信息正确应当生成最终的 Access/Refresh Token 并返回', async () => {
        vi.mocked(verifyToken).mockResolvedValue({
            type: 'pre-auth',
            userId: 'user-1',
            tenantId: 'tenant-1',
            phone: '13812345678',
            role: 'ADMIN'
        } as any);
        vi.mocked(VerificationCodeService.verify).mockResolvedValue(true);
        vi.mocked(generateAccessToken).mockResolvedValue('final-access');
        vi.mocked(generateRefreshToken).mockResolvedValue('final-refresh');

        const req = createReq({ preAuthToken: 'valid-token', code: '123456' });
        const res = await mfaVerifyHandler(req, {} as any);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.data.accessToken).toBe('final-access');
        expect(data.data.refreshToken).toBe('final-refresh');
        expect(data.data.user.id).toBe('user-1');

        expect(generateAccessToken).toHaveBeenCalledWith('user-1', 'tenant-1', '13812345678', 'ADMIN');
    });
});
