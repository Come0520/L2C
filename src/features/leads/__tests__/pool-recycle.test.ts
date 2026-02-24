
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executePoolRecycleJob } from '@/features/leads/logic/pool-recycle-job';
import { db } from '@/shared/api/db';

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            tenants: { findMany: vi.fn(), findFirst: vi.fn() },
            leads: { findMany: vi.fn() }
        },
        transaction: vi.fn((cb) => cb({
            update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
            insert: vi.fn(() => ({ values: vi.fn() }))
        }))
    }
}));

describe('Pool Recycle Job', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should skip tenants with auto-recycle disabled', async () => {
        const tenantData = { id: 't1', settings: { leadSla: { autoRecycleEnabled: false } } };
        vi.mocked(db.query.tenants.findMany).mockResolvedValue([tenantData]);
        vi.mocked(db.query.tenants.findFirst).mockResolvedValue(tenantData);

        const results = await executePoolRecycleJob();
        expect(results.totalProcessed).toBe(0);
        expect(db.query.leads.findMany).not.toHaveBeenCalled();
    });

    it('应当回收超期未联系的线索 (Status: PENDING_FOLLOWUP)', async () => {
        const tenantId = 't1';
        vi.mocked(db.query.tenants.findMany).mockResolvedValue([{ id: tenantId, isActive: true, settings: { leadSla: { autoRecycleEnabled: true, noContactDays: 3 } } }] as any);

        // 模拟 1 条超期线索（第一轮查询：未联系）
        vi.mocked(db.query.leads.findMany).mockResolvedValueOnce([{ id: 'l1', status: 'PENDING_FOLLOWUP', assignedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000) }] as any);
        // 第二轮查询（未成交）：返回空
        vi.mocked(db.query.leads.findMany).mockResolvedValueOnce([]);

        const results = await executePoolRecycleJob();

        expect(results.totalProcessed).toBe(1);
        expect(results.recycledNoContact).toBe(1);
        expect(db.transaction).toHaveBeenCalled();
    });

    it('应当回收超期未成交的线索 (Status: FOLLOWING_UP)', async () => {
        const tenantId = 't2';
        vi.mocked(db.query.tenants.findMany).mockResolvedValue([{ id: tenantId, isActive: true, settings: { leadSla: { autoRecycleEnabled: true, noDealDays: 7 } } }] as any);

        // 第一轮查询（未联系）：返回空
        vi.mocked(db.query.leads.findMany).mockResolvedValueOnce([]);
        // 第二轮查询（未成交）：返回 1 条超期
        vi.mocked(db.query.leads.findMany).mockResolvedValueOnce([{ id: 'l2', status: 'FOLLOWING_UP', assignedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000) }] as any);

        const results = await executePoolRecycleJob();

        expect(results.totalProcessed).toBe(1);
        expect(results.recycledNoDeal).toBe(1);
    });

    it('不应当回收在 SLA 期限内的线索', async () => {
        const tenantId = 't3';
        vi.mocked(db.query.tenants.findMany).mockResolvedValue([{ id: tenantId, isActive: true, settings: { leadSla: { autoRecycleEnabled: true, noContactDays: 3 } } }] as any);

        // 由于代码中 findMany 是带 filter 的，如果 lead 在期限内，DB 实际上会返回空（在单元测试中我们需要模拟这个行为）
        vi.mocked(db.query.leads.findMany).mockResolvedValue([]);

        const results = await executePoolRecycleJob();

        expect(results.totalProcessed).toBe(0);
        expect(results.recycledNoContact).toBe(0);
    });
});
