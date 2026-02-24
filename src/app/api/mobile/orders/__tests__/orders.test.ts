import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// 1. Mock 依赖
vi.mock('@/shared/middleware/api-timing', () => ({
    withTiming: (fn: any) => fn,
}));

vi.mock('@/shared/middleware/mobile-auth', () => ({
    authenticateMobile: vi.fn(),
    requireCustomer: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            customers: { findFirst: vi.fn() },
            orders: { findMany: vi.fn() },
        },
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => Promise.resolve([{ count: 0 }])),
    },
    sql: vi.fn((s: any) => s),
}));

// 2. 导入
import { GET } from '../route';
import { authenticateMobile, requireCustomer } from '@/shared/middleware/mobile-auth';
import { db } from '@/shared/api/db';

describe('移动端订单 API (Orders API)', () => {
    const mockSession = { userId: 'u1', tenantId: 't1', phone: '13800000000', role: 'CUSTOMER' };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(authenticateMobile).mockResolvedValue({ success: true, session: mockSession } as any);
        vi.mocked(requireCustomer).mockReturnValue({ allowed: true } as any);
    });

    it('正常返回订单分页数据', async () => {
        const req = new NextRequest('http://localhost/api/mobile/orders?page=1&pageSize=10');

        vi.mocked(db.query.customers.findFirst).mockResolvedValue({ id: 'c1' } as any);
        vi.mocked(db.query.orders.findMany).mockResolvedValue([
            { id: 'o1', orderNo: 'ORD001', status: 'PAID', totalAmount: '100.50', createdAt: new Date() }
        ] as any);

        // Mock count query
        vi.mocked(db.where).mockResolvedValue([{ count: 1 }] as any);

        const res = await GET(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data.items).toHaveLength(1);
    });
});
