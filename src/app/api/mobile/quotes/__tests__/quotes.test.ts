import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// 1. Mock 依赖
vi.mock('@/shared/middleware/api-timing', () => ({
    withTiming: (fn: any) => fn,
}));

vi.mock('@/shared/middleware/mobile-auth', () => ({
    authenticateMobile: vi.fn(),
    requireSales: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            quotes: { findMany: vi.fn() },
        },
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => Promise.resolve([{ count: 0 }])),
    },
    sql: vi.fn((s: any) => s),
}));

// 2. 导入
import { GET } from '../route';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { db } from '@/shared/api/db';

describe('移动端报价 API (Quotes API)', () => {
    const mockSession = { userId: 'u1', tenantId: 't1', role: 'SALES' };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(authenticateMobile).mockResolvedValue({ success: true, session: mockSession } as any);
        vi.mocked(requireSales).mockReturnValue({ allowed: true } as any);
    });

    it('应正常返回报价分页列表', async () => {
        const req = new NextRequest('http://localhost/api/mobile/quotes?page=1&pageSize=10');

        vi.mocked(db.query.quotes.findMany).mockResolvedValue([
            { id: 'q1', quoteNo: 'Q001', title: 'Test Quote', totalAmount: '1000.00', status: 'DRAFT', createdAt: new Date(), customer: { name: 'Customer A', phone: '138...' } }
        ] as any);

        vi.mocked(db.where).mockResolvedValue([{ count: 1 }] as any);

        const res = await GET(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data.items).toHaveLength(1);
        expect(body.data.items[0].quoteNo).toBe('Q001');
    });
});
