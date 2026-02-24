import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// 1. Mock 所有的中间件和依赖，必须在导入 GET 之前
vi.mock('@/shared/middleware/api-timing', () => ({
    withTiming: (fn: any) => fn,
}));

vi.mock('@/shared/middleware/mobile-auth', () => ({
    authenticateMobile: vi.fn(),
    requireWorker: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            measureTasks: { findMany: vi.fn() },
            installTasks: { findMany: vi.fn() },
        },
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => Promise.resolve([{ count: 0 }])),
    },
    sql: vi.fn((s: any) => s),
}));

// 2. 导入被测函数
import { GET } from '../route';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';
import { db } from '@/shared/api/db';

describe('移动端任务 API (Tasks API)', () => {
    const mockSession = { userId: 'w1', tenantId: 't1', role: 'WORKER' };

    beforeEach(() => {
        vi.clearAllMocks();
        // 确保 Mock 返回值具有 status 属性
        vi.mocked(authenticateMobile).mockResolvedValue({ success: true, session: mockSession } as any);
        vi.mocked(requireWorker).mockReturnValue({ allowed: true } as any);
    });

    it('应正常查询并合并两类任务数据', async () => {
        const req = new NextRequest('http://localhost/api/mobile/tasks');

        vi.mocked(db.query.measureTasks.findMany).mockResolvedValue([
            { id: 'm1', measureNo: 'M001', status: 'PENDING', scheduledAt: new Date('2024-01-02'), customer: { name: 'M-Cust' } }
        ] as any);

        vi.mocked(db.query.installTasks.findMany).mockResolvedValue([
            { id: 'i1', taskNo: 'T001', status: 'PENDING_VISIT', scheduledDate: new Date('2024-01-01'), customer: { name: 'I-Cust' }, address: 'Address 1' }
        ] as any);

        const res = await GET(req);
        expect(res.status).toBe(200);
        const body = await res.json();

        expect(body.data.items).toHaveLength(2);
        // 按 scheduledAt 降序
        expect(body.data.items[0].type).toBe('measure');
        expect(body.data.items[1].type).toBe('install');
    });

    it('权限不足应被拦截并返回 403', async () => {
        vi.mocked(requireWorker).mockReturnValue({
            allowed: false,
            response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
        } as any);

        const req = new NextRequest('http://localhost/api/mobile/tasks');
        const res = await GET(req);

        expect(res.status).toBe(403);
    });
});
