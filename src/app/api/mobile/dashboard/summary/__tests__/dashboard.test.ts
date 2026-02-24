import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// 1. Mock 依赖
vi.mock('@/shared/middleware/api-timing', () => ({
    withTiming: (fn: any) => fn,
}));

vi.mock('@/shared/middleware/mobile-auth', () => ({
    authenticateMobile: vi.fn(),
    requireBoss: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => Promise.resolve([{ count: 0, total: '0' }])),
    },
    sql: vi.fn((s: any) => s),
}));

vi.mock('@/shared/lib/cache-utils', () => ({
    dashboardCache: {
        get: vi.fn(),
        set: vi.fn(),
    }
}));

// 2. 导入
import { GET } from '../route';
import { authenticateMobile, requireBoss } from '@/shared/middleware/mobile-auth';
import { db } from '@/shared/api/db';
import { dashboardCache } from '@/shared/lib/cache-utils';

describe('移动端仪表盘 API (Dashboard API)', () => {
    const mockSession = { userId: 'b1', tenantId: 't1', role: 'BOSS' };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(authenticateMobile).mockResolvedValue({ success: true, session: mockSession } as any);
        vi.mocked(requireBoss).mockReturnValue({ allowed: true } as any);
        vi.mocked(dashboardCache.get).mockReturnValue(null);
    });

    it('应从缓存读取数据（如果存在）', async () => {
        const cached = { orders: { today: 10 } };
        vi.mocked(dashboardCache.get).mockReturnValue(cached);
        const req = new NextRequest('http://localhost/api/mobile/dashboard/summary');

        const res = await GET(req);
        const body = await res.json();
        expect(body.data.orders.today).toBe(10);
        expect(db.select).not.toHaveBeenCalled();
    });

    it('应正确计算数据指标', async () => {
        const req = new NextRequest('http://localhost/api/mobile/dashboard/summary');
        vi.mocked(db.where).mockResolvedValueOnce([{ count: 5 }]) // today orders
            .mockResolvedValueOnce([{ count: 3 }]) // yesterday orders
            .mockResolvedValueOnce([{ total: '100.00' }]) // today payments
            .mockResolvedValueOnce([{ total: '50.00' }]) // yesterday payments
            .mockResolvedValueOnce([{ count: 2 }]) // today leads
            .mockResolvedValueOnce([{ count: 1 }]); // yesterday leads

        const res = await GET(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data.orders.today).toBe(5);
    });
});
