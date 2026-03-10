import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/shared/api/db';
import * as schema from '@/shared/api/schema';
import { auth } from '@/shared/lib/auth';
import { getDashboardStats } from '@/features/dashboard/actions';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

describe('Dashboard Integration Tests', () => {
    const tenant1 = `TEST_T1_${Date.now()}`;
    const tenant2 = `TEST_T2_${Date.now()}`;

    let adminT1_Id: string;
    let adminT2_Id: string;
    let workerT1_A_Id: string;
    let workerT1_B_Id: string;

    beforeEach(async () => {
        vi.clearAllMocks();

        const [u1] = await db.insert(schema.users).values({
            tenantId: tenant1,
            email: `t1_admin_${Date.now()}@test.com`,
            name: 'Admin T1',
            role: 'ADMIN',
            isActive: true,
        }).returning();
        adminT1_Id = u1.id;

        const [u2] = await db.insert(schema.users).values({
            tenantId: tenant2,
            email: `t2_admin_${Date.now()}@test.com`,
            name: 'Admin T2',
            role: 'ADMIN',
            isActive: true,
        }).returning();
        adminT2_Id = u2.id;

        const [u3] = await db.insert(schema.users).values({
            tenantId: tenant1,
            email: `t1_wA_${Date.now()}@test.com`,
            name: 'Worker T1 A',
            role: 'WORKER',
            isActive: true,
        }).returning();
        workerT1_A_Id = u3.id;

        const [u4] = await db.insert(schema.users).values({
            tenantId: tenant1,
            email: `t1_wB_${Date.now()}@test.com`,
            name: 'Worker T1 B',
            role: 'WORKER',
            isActive: true,
        }).returning();
        workerT1_B_Id = u4.id;

        // Insert isolated data

        // T1 - 2 leads
        await db.insert(schema.leads).values({ tenantId: tenant1, leadNo: `L_T1_1_${Date.now()}`, customerName: 'T1 Lead 1' });
        await db.insert(schema.leads).values({ tenantId: tenant1, leadNo: `L_T1_2_${Date.now()}`, customerName: 'T1 Lead 2' });
        // T2 - 1 lead
        await db.insert(schema.leads).values({ tenantId: tenant2, leadNo: `L_T2_1_${Date.now()}`, customerName: 'T2 Lead 1' });

        // T1 - Measure Tasks
        await db.insert(schema.measureTasks).values({
            tenantId: tenant1,
            taskNo: `M_T1_WA_${Date.now()}`,
            assignedWorkerId: workerT1_A_Id, // Assigned to Worker A
            status: 'PENDING',
        });
        await db.insert(schema.measureTasks).values({
            tenantId: tenant1,
            taskNo: `M_T1_WB_${Date.now()}`,
            assignedWorkerId: workerT1_B_Id, // Assigned to Worker B
            status: 'PENDING',
        });
    });

    it('should preserve cache isolation across tenants and users (D3-P0-1)', async () => {
        // 1. T1 Admin requests dashboard -> expects 2 leads
        vi.mocked(auth).mockResolvedValue({
            user: { id: adminT1_Id, tenantId: tenant1, role: 'ADMIN', name: 'Admin T1' },
            expires: '',
        } as any);

        const resT1 = await getDashboardStats({});
        expect(resT1.success).toBe(true);
        expect(resT1.stats!.cards.find(c => c.title === '全量线索')!.value).toBe(2);

        // 2. T2 Admin requests dashboard -> expects 1 lead (should NOT hit T1's cache)
        vi.mocked(auth).mockResolvedValue({
            user: { id: adminT2_Id, tenantId: tenant2, role: 'ADMIN', name: 'Admin T2' },
            expires: '',
        } as any);

        const resT2 = await getDashboardStats({});
        expect(resT2.success).toBe(true);
        // Explicitly confirm isolation
        expect(resT2.stats!.cards.find(c => c.title === '全量线索')!.value).toBe(1);
        expect(resT2.stats!.cards.find(c => c.title === '全量线索')!.value).not.toBe(2);
    });

    it('should restrict WORKER measure task counts to themselves only (D3-P1-2)', async () => {
        // 1. Worker A requests dashboard -> expects 1 pending task (out of 2 total in T1)
        vi.mocked(auth).mockResolvedValue({
            user: { id: workerT1_A_Id, tenantId: tenant1, role: 'WORKER', name: 'Worker T1 A' },
            expires: '',
        } as any);

        const resWA = await getDashboardStats({});
        expect(resWA.success).toBe(true);
        expect(resWA.stats!.cards.find(c => c.title === '待处理测量')!.value).toBe(1);

        // 2. Worker B requests dashboard -> expects 1 pending task (their own)
        vi.mocked(auth).mockResolvedValue({
            user: { id: workerT1_B_Id, tenantId: tenant1, role: 'WORKER', name: 'Worker T1 B' },
            expires: '',
        } as any);

        const resWB = await getDashboardStats({});
        expect(resWB.success).toBe(true);
        expect(resWB.stats!.cards.find(c => c.title === '待处理测量')!.value).toBe(1);
    });
});
