import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as wechatHandler } from '../wechat/route';
import { db } from '@/shared/api/db';
import { env } from '@/shared/config/env';
import { AuditService } from '@/shared/services/audit-service';
import { generateAccessToken, generateRefreshToken } from '@/shared/lib/jwt';

// Mock DB
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            customers: { findFirst: vi.fn() },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn()
            }))
        }))
    }
}));

// Mock env
vi.mock('@/shared/config/env', () => ({
    env: {
        WX_APPID: 'test-appid',
        WX_APPSECRET: 'test-appsecret',
    }
}));

// Mock AuditService
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn()
    }
}));

// Mock JWT
vi.mock('@/shared/lib/jwt', () => ({
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('微信小程序登录 API', () => {
    const createReq = (body: any) => new NextRequest('http://localhost/api/mobile/auth/wechat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    beforeEach(() => {
        vi.clearAllMocks();
        // 重置 env
        env.WX_APPID = 'test-appid';
        env.WX_APPSECRET = 'test-appsecret';
    });

    it('如果缺失 code 应当返回 400', async () => {
        const req = createReq({ phone: '13800138000' });
        const res = await wechatHandler(req);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.error).toBe('缺少 code 参数');
    });

    it('如果微信环境变量未配置应当返回 500', async () => {
        env.WX_APPID = '';
        const req = createReq({ code: 'valid-code' });
        const res = await wechatHandler(req);
        const data = await res.json();
        expect(res.status).toBe(500);
        expect(data.error).toBe('微信小程序未配置');
    });

    it('如果微信接口返回 errcode 应当返回 400', async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ errcode: 40029, errmsg: 'invalid code' })
        });
        const req = createReq({ code: 'invalid-code' });
        const res = await wechatHandler(req);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.error).toBe('微信登录失败: invalid code');
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('js_code=invalid-code'));
    });

    it('如果新用户登录（无手机号匹配）应当返回需要绑定状态并打标', async () => {
        const testOpenId = 'oX99999999999999999999999999';
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ openid: testOpenId })
        });
        vi.mocked(db.query.customers.findFirst).mockResolvedValue(undefined);

        const req = createReq({ code: 'valid-code' });
        const res = await wechatHandler(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.data.needBinding).toBe(true);
        expect(data.data.openid).toContain('****');
        expect(data.data.openid).not.toBe(testOpenId); // 确认已脱敏

        // 验证审计日志
        expect(AuditService.log).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ action: 'LOGIN_FAILED', details: expect.objectContaining({ reason: 'need_binding' }) })
        );
    });

    it('如果是已绑定客户（openid 匹配）应当生成 token 并放行', async () => {
        const testOpenId = 'oX1234567890';
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ openid: testOpenId })
        });

        // Mock 查询成功
        vi.mocked(db.query.customers.findFirst).mockResolvedValue({
            id: 'cus-1',
            name: '张三',
            phone: '13800000000',
            tenantId: 'tenant-1'
        } as any);

        vi.mocked(generateAccessToken).mockResolvedValue('test-access-token');
        vi.mocked(generateRefreshToken).mockResolvedValue('test-refresh-token');

        const req = createReq({ code: 'valid-code' });
        const res = await wechatHandler(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.data.needBinding).toBe(false);
        expect(data.data.accessToken).toBe('test-access-token');
        expect(data.data.refreshToken).toBe('test-refresh-token');
        expect(data.data.user.id).toBe('cus-1');

        expect(AuditService.log).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ action: 'LOGIN_SUCCESS', recordId: 'cus-1' })
        );
    });

    it('如果 openid 未绑定但手机号匹配匹配，应当自动绑定并放行', async () => {
        const testOpenId = 'oX1234567890';
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ openid: testOpenId })
        });

        // 第一次按 openid 找不到
        vi.mocked(db.query.customers.findFirst).mockResolvedValueOnce(undefined);
        // 第二次按 phone 找到
        vi.mocked(db.query.customers.findFirst).mockResolvedValueOnce({
            id: 'cus-2',
            name: '李四',
            phone: '13900000000',
            tenantId: 'tenant-1'
        } as any);

        const updateWhereMock = vi.fn();
        const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
        vi.mocked(db.update).mockReturnValue({ set: updateSetMock } as any);

        const req = createReq({ code: 'valid-code', phone: '13900000000' });
        const res = await wechatHandler(req);
        const data = await res.json();

        // 验证自动绑定操作被触发
        expect(db.update).toHaveBeenCalled();
        expect(updateSetMock).toHaveBeenCalledWith(expect.objectContaining({ wechatOpenId: testOpenId }));

        expect(res.status).toBe(200);
        expect(data.data.needBinding).toBe(false);
        expect(data.data.user.id).toBe('cus-2');
    });
});
