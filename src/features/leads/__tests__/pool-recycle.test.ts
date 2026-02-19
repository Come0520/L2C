
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
        (db.query.tenants.findMany as any).mockResolvedValue([tenantData]);
        (db.query.tenants.findFirst as any).mockResolvedValue(tenantData);

        const results = await executePoolRecycleJob();
        expect(results).toHaveLength(0);
        expect(db.query.leads.findMany).not.toHaveBeenCalled();
    });

    it('should recycle no-contact leads', async () => {
        (db.query.tenants.findMany as any).mockResolvedValue([{ id: 't1', settings: {} }]); // Default enabled
        (db.query.tenants.findFirst as any).mockResolvedValue({ settings: {} });

        // Mock 1 lead to recycle
        (db.query.leads.findMany as any).mockResolvedValueOnce([{ id: 'l1', status: 'PENDING_FOLLOWUP' }]); // no-contact
        (db.query.leads.findMany as any).mockResolvedValueOnce([]); // no-deal

        const results = await executePoolRecycleJob();

        expect(results[0].noContactRecycled).toBe(1);
        expect(db.transaction).toHaveBeenCalled();
    });
});
