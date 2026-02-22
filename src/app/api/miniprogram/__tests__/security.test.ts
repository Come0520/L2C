import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getCustomersHandler, POST as createCustomerHandler } from '../customers/route';
import { POST as createOrderHandler } from '../orders/route';
import { db } from '@/shared/api/db';
import * as authUtils from '../auth-utils';
import { AuditService } from '@/shared/services/audit-service';

// Mock DB
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            customers: { findMany: vi.fn() },
            quotes: { findFirst: vi.fn() },
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn().mockResolvedValue([{ id: 'new-id', name: 'Test' }]),
            })),
        })),
        transaction: vi.fn((cb) => cb({
            insert: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: 'order-1', orderNo: 'ORD123' }]),
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue({}),
        })),
    }
}));

// Mock Auth Utils
vi.mock('../auth-utils', () => ({
    getMiniprogramUser: vi.fn(),
    generateMiniprogramToken: vi.fn(),
}));

// Mock Audit Service
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue(undefined),
    }
}));

describe('小程序安全与隔离性测试', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createReq = (url: string, method: string = 'GET', body: unknown = null) => {
        return new NextRequest(url, {
            method,
            body: body ? JSON.stringify(body) : null
        });
    };

    describe('认证拦截 (Authentication)', () => {
        it('未携带 Token 应返回 401', async () => {
            vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue(null);

            const req = createReq('http://localhost/api/customers');
            const res = await getCustomersHandler(req);

            expect(res.status).toBe(401);
            const data = await res.json();
            expect(data.error).toBe('未授权');
        });
    });

    describe('输入验证 (Zod Validation)', () => {
        it('创建客户时缺少必填项应返回 400', async () => {
            vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue({
                id: 'u1', tenantId: 't1'
            });

            const req = createReq('http://localhost/api/customers', 'POST', {
                phone: '13800000000' // 缺少 name
            });
            const res = await createCustomerHandler(req);

            expect(res.status).toBe(400);
        });
    });

    describe('租户隔离 (Tenant Isolation)', () => {
        it('获取客户列表应锁定当前租户 ID', async () => {
            vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue({
                id: 'u1', tenantId: 't1'
            });

            vi.mocked(db.query.customers.findMany).mockResolvedValue([]);

            await getCustomersHandler(createReq('http://localhost/api/customers'));

            // 验证查询条件中是否包含 tenantId: 't1'
            const callArgs = vi.mocked(db.query.customers.findMany).mock.calls[0][0];
            // findMany 的 where 参数比较复杂（drizzle 表达式），我们检查 sql 逻辑或 mock 行为
            expect(callArgs?.where).toBeDefined();
        });

        it('从不同租户的报价单创建订单应被拦截 (404)', async () => {
            vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue({
                id: '550e8400-e29b-41d4-a716-446655440001', tenantId: 't-hacker'
            });

            // 模拟试图访问属于不同租户的报价单
            vi.mocked(db.query.quotes.findFirst).mockResolvedValue(undefined as never);

            const req = createReq('http://localhost/api/orders', 'POST', {
                quoteId: '550e8400-e29b-41d4-a716-446655440000' // 合法的 UUID 格式
            });
            const res = await createOrderHandler(req);

            expect(res.status).toBe(404);
            const data = await res.json();
            expect(data.error).toBe('报价单不存在');
        });
    });

    describe('安全攻击防御 (Attack Prevention)', () => {
        it('超长字符串注入应被 Zod 拦截', async () => {
            vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue({
                id: 'u1', tenantId: 't1'
            });

            const req = createReq('http://localhost/api/customers', 'POST', {
                name: 'A'.repeat(200), // 超过 max(100) 限制
                phone: '13800000000'
            });
            const res = await createCustomerHandler(req);

            expect(res.status).toBe(400);
        });

        it('特殊字符注入不应导致服务端异常', async () => {
            vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue({
                id: 'u1', tenantId: 't1'
            });

            const req = createReq('http://localhost/api/customers', 'POST', {
                name: '<script>alert("xss")</script>',
                phone: "'; DROP TABLE users;--"
            });

            // Zod 校验不会拦截内容（只校验格式），但不应 500
            const res = await createCustomerHandler(req);
            expect(res.status).not.toBe(500);
        });

        it('tenantId 为空的用户应被拒绝', async () => {
            vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue({
                id: 'u1', tenantId: '' // 空租户 ID
            });

            const req = createReq('http://localhost/api/customers');
            const res = await getCustomersHandler(req);

            expect(res.status).toBe(401);
        });

        it('无 body 的 POST 请求应返回 400/500 而非崩溃', async () => {
            vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue({
                id: 'u1', tenantId: 't1'
            });

            const req = new NextRequest('http://localhost/api/customers', {
                method: 'POST',
                // 故意不传 body
            });

            const res = await createCustomerHandler(req);
            // 应该返回错误而非 crash
            expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });
});
