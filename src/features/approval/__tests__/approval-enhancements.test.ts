import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import type { InferSelectModel } from 'drizzle-orm';

// 1. 使用 vi.hoisted 提前注入环境变量
vi.hoisted(() => {
    process.env.DATABASE_URL = 'postgresql://l2c_user:password@127.0.0.1:5435/l2c_dev';
    process.env.AUTH_SECRET = 'test_secret_for_enhancements';
});

import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import * as schema from '@/shared/api/schema';
import * as submissionActions from '../actions/submission';
import * as processingActions from '../actions/processing';
import * as managementActions from '../actions/management';

// Setup globals or mocks that don't depend on DB
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

type Tenant = InferSelectModel<typeof schema.tenants>;
type User = InferSelectModel<typeof schema.users>;
type ApprovalFlow = InferSelectModel<typeof schema.approvalFlows>;
type PaymentBill = InferSelectModel<typeof schema.paymentBills>;

describe('Approval Enhancements', () => {
    let tenantId: string;
    let adminId: string;
    let user1Id: string;
    let user2Id: string;

    beforeAll(async () => {
        // Setup Tenant and Users
        const [tenant] = await db.insert(schema.tenants).values({
            name: 'Test Tenant ' + Date.now(),
            code: 'TEST_' + Date.now(),
        }).returning() as Tenant[];
        tenantId = tenant.id;

        const [u1] = await db.insert(schema.users).values({
            tenantId, email: `admin_${Date.now()}@test.com`, name: 'Admin', role: 'ADMIN', passwordHash: 'hash', phone: '13800000000'
        }).returning() as User[];
        adminId = u1.id;

        const [u2] = await db.insert(schema.users).values({
            tenantId, email: `u1_${Date.now()}@test.com`, name: 'User1', role: 'FINANCE', passwordHash: 'hash', phone: '13800000000', isActive: true
        }).returning() as User[];
        user1Id = u2.id;

        const [u3] = await db.insert(schema.users).values({
            tenantId, email: `u2_${Date.now()}@test.com`, name: 'User2', role: 'FINANCE', passwordHash: 'hash', phone: '13800000000', isActive: true
        }).returning() as User[];
        user2Id = u3.id;
    });

    afterAll(async () => {
        // Cleanup if needed
    });

    it('should handle Parallel Approval (ANY)', async () => {
        // 1. Create Flow
        const [flow] = await db.insert(schema.approvalFlows).values({
            tenantId, code: 'TEST_ANY', name: 'Test Any', isActive: true
        }).returning() as ApprovalFlow[];

        await db.insert(schema.approvalNodes).values({
            tenantId, flowId: flow.id, name: 'Parallel Node', approverMode: 'ANY', approverRole: 'FINANCE'
        });

        // 2. Create Entity
        const [bill] = await db.insert(schema.paymentBills).values({
            tenantId, paymentNo: `BILL_ANY_${Date.now()}`, payeeType: 'SUPPLIER', payeeId: adminId, payeeName: 'Sup',
            amount: '100', status: 'PENDING', recordedBy: adminId, paymentMethod: 'CASH', proofUrl: 'url'
        }).returning() as PaymentBill[];

        // 3. Submit
        vi.mocked(auth).mockResolvedValue({ user: { id: adminId, tenantId, role: 'ADMIN' }, expires: '' } as any);
        const res = await submissionActions.submitApproval({
            entityType: 'PAYMENT_BILL', entityId: bill.id, flowCode: 'TEST_ANY'
        });
        if (!res.success) throw new Error(JSON.stringify(res, null, 2));
        expect(res.success).toBe(true);

        // 4. Check Tasks
        const instance = await db.query.approvals.findFirst({
            where: (t: any, { eq }: any) => eq(t.entityId, bill.id)
        });
        const tasks = await db.query.approvalTasks.findMany({
            where: (t: any, { eq }: any) => eq(t.approvalId, instance!.id)
        });
        expect(tasks.length).toBeGreaterThanOrEqual(1);

        // 5. User1 Approves
        vi.mocked(auth).mockResolvedValue({ user: { id: user1Id, tenantId, role: 'FINANCE' }, expires: '' } as any);
        const task1 = tasks.find((t: any) => t.approverId === user1Id);
        if (!task1) throw new Error('Task1 not found');

        const procRes = await processingActions.processApproval({
            taskId: task1.id, action: 'APPROVE', comment: 'Go'
        });
        expect(procRes.success).toBe(true);

        // 6. Verify Outcome
        const updatedInstance = await db.query.approvals.findFirst({
            where: (t: any, { eq }: any) => eq(t.id, instance!.id)
        });
        expect(updatedInstance!.status).toBe('APPROVED');

        const task2 = await db.query.approvalTasks.findFirst({
            where: (t: any, { eq, and }: any) => and(eq(t.approvalId, instance!.id), eq(t.approverId, user2Id))
        });
        expect(task2!.status).toBe('CANCELED');
    });

    it('should handle Parallel Approval (ALL)', async () => {
        const [flow] = await db.insert(schema.approvalFlows).values({
            tenantId, code: 'TEST_ALL', name: 'Test All', isActive: true
        }).returning() as ApprovalFlow[];

        await db.insert(schema.approvalNodes).values({
            tenantId, flowId: flow.id, name: 'Parallel Node All', approverMode: 'ALL',
            approverRole: 'FINANCE'
        });

        const [bill] = await db.insert(schema.paymentBills).values({
            tenantId, paymentNo: `BILL_ALL_${Date.now()}`, payeeType: 'SUPPLIER', payeeId: adminId, payeeName: 'Sup',
            amount: '100', status: 'PENDING', recordedBy: adminId, paymentMethod: 'CASH', proofUrl: 'url'
        }).returning() as PaymentBill[];

        // @ts-ignore — 仅 mock 必要的用户、租户和角色信息
        const res = await submissionActions.submitApproval({ entityType: 'PAYMENT_BILL', entityId: bill.id, flowCode: 'TEST_ALL' });
        expect(res.success).toBe(true);

        const instance = await db.query.approvals.findFirst({ where: (t: any, { eq }: any) => eq(t.entityId, bill.id) });
        const tasks = await db.query.approvalTasks.findMany({ where: (t: any, { eq }: any) => eq(t.approvalId, instance!.id) });

        vi.mocked(auth).mockResolvedValue({ user: { id: user1Id, tenantId }, expires: '' } as any);
        const task1 = tasks.find((t: any) => t.approverId === user1Id);
        await processingActions.processApproval({ taskId: task1!.id, action: 'APPROVE' });

        const midInstance = await db.query.approvals.findFirst({ where: (t: any, { eq }: any) => eq(t.id, instance!.id) });
        expect(midInstance!.status).toBe('PENDING');

        vi.mocked(auth).mockResolvedValue({ user: { id: user2Id, tenantId }, expires: '' } as any);
        const task2 = tasks.find((t: any) => t.approverId === user2Id);
        await processingActions.processApproval({ taskId: task2!.id, action: 'APPROVE' });

        const finalInstance = await db.query.approvals.findFirst({ where: (t: any, { eq }: any) => eq(t.id, instance!.id) });
        expect(finalInstance!.status).toBe('APPROVED');
    });

    it('should handle Delegation', async () => {
        await db.insert(schema.approvalDelegations).values({
            tenantId, delegatorId: user1Id, delegateeId: user2Id,
            type: 'GLOBAL',
            startTime: new Date(Date.now() - 10000),
            endTime: new Date(Date.now() + 10000),
            isActive: true
        });

        const [flow] = await db.insert(schema.approvalFlows).values({
            tenantId, code: 'TEST_DEL', name: 'Test Del', isActive: true
        }).returning() as ApprovalFlow[];
        await db.insert(schema.approvalNodes).values({
            tenantId, flowId: flow.id, name: 'Node 1', approverUserId: user1Id
        });

        const [bill] = await db.insert(schema.paymentBills).values({
            tenantId, paymentNo: `BILL_DEL_${Date.now()}`, payeeType: 'SUPPLIER', payeeId: adminId, payeeName: 'Sup',
            amount: '100', status: 'PENDING', recordedBy: adminId, paymentMethod: 'CASH', proofUrl: 'url'
        }).returning() as PaymentBill[];

        // @ts-ignore — 仅 mock 必要的用户、租户和角色信息
        vi.mocked(auth).mockResolvedValue({ user: { id: adminId, tenantId }, expires: '' } as any);
        await submissionActions.submitApproval({ entityType: 'PAYMENT_BILL', entityId: bill.id, flowCode: 'TEST_DEL' });

        const instance = await db.query.approvals.findFirst({ where: (t: any, { eq }: any) => eq(t.entityId, bill.id) });
        const tasks = await db.query.approvalTasks.findMany({ where: (t: any, { eq }: any) => eq(t.approvalId, instance!.id) });

        expect(tasks[0].approverId).toBe(user2Id);
    });

    it('should handle Withdraw', async () => {
        const [flow] = await db.insert(schema.approvalFlows).values({
            tenantId, code: 'TEST_WITHDRAW', name: 'Test Withdraw', isActive: true
        }).returning() as ApprovalFlow[];
        await db.insert(schema.approvalNodes).values({
            tenantId, flowId: flow.id, name: 'Node 1', approverUserId: user1Id
        });

        const [bill] = await db.insert(schema.paymentBills).values({
            tenantId, paymentNo: `BILL_WD_${Date.now()}`, payeeType: 'SUPPLIER', payeeId: adminId, payeeName: 'Sup',
            amount: '100', status: 'PENDING', recordedBy: adminId, paymentMethod: 'CASH', proofUrl: 'url'
        }).returning() as PaymentBill[];

        // @ts-ignore — 仅 mock 必要的用户、租户和角色信息
        vi.mocked(auth).mockResolvedValue({ user: { id: adminId, tenantId }, expires: '' } as any);
        await submissionActions.submitApproval({ entityType: 'PAYMENT_BILL', entityId: bill.id, flowCode: 'TEST_WITHDRAW' });

        const instance = await db.query.approvals.findFirst({ where: (t: any, { eq }: any) => eq(t.entityId, bill.id) });

        const res = await managementActions.withdrawApproval({ instanceId: instance!.id, reason: 'Test' });
        expect(res.success).toBe(true);

        const updatedInstance = await db.query.approvals.findFirst({ where: (t: any, { eq }: any) => eq(t.id, instance!.id) });
        expect(updatedInstance!.status).toBe('CANCELED');

        const updatedBill = await db.query.paymentBills.findFirst({ where: (t: any, { eq }: any) => eq(t.id, bill.id) });
        expect(updatedBill!.status).toBe('DRAFT');
    });
});

