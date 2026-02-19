
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';

// Ensure env is loaded before ANY other imports (except types/vitest)
// Force set env for test
process.env.DATABASE_URL = 'postgresql://l2c_test_user:l2c_test_password@localhost:5434/l2c_test';

// Setup globals or mocks that don't depend on DB
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

describe('Approval Enhancements', () => {
    // Dynamic imports to bypass hosting issues
    let db: any;
    let auth: any;
    let schema: any;
    let submissionActions: any;
    let processingActions: any;
    let managementActions: any;

    let tenantId: string;
    let adminId: string;
    let user1Id: string;
    let user2Id: string;

    beforeAll(async () => {
        // Import modules AFTER env is loaded
        const dbModule = await import('@/shared/api/db');
        db = dbModule.db;
        schema = await import('@/shared/api/schema');
        const authModule = await import('@/shared/lib/auth');
        auth = authModule.auth;

        submissionActions = await import('../actions/submission');
        processingActions = await import('../actions/processing');
        managementActions = await import('../actions/management');

        // Setup Tenant and Users
        const tenant = await db.insert(schema.tenants).values({
            name: 'Test Tenant ' + Date.now(),
            code: 'TEST_' + Date.now(),
        }).returning().then((r: any[]) => r[0]);
        tenantId = tenant.id;

        const u1 = await db.insert(schema.users).values({
            tenantId, email: `admin_${Date.now()}@test.com`, name: 'Admin', role: 'ADMIN', passwordHash: 'hash'
        }).returning().then((r: any[]) => r[0]);
        adminId = u1.id;

        const u2 = await db.insert(schema.users).values({
            tenantId, email: `u1_${Date.now()}@test.com`, name: 'User1', role: 'FINANCE', passwordHash: 'hash'
        }).returning().then((r: any[]) => r[0]);
        user1Id = u2.id;

        const u3 = await db.insert(schema.users).values({
            tenantId, email: `u2_${Date.now()}@test.com`, name: 'User2', role: 'FINANCE', passwordHash: 'hash'
        }).returning().then((r: any[]) => r[0]);
        user2Id = u3.id;
    });

    afterAll(async () => {
        // Cleanup if needed
    });

    it('should handle Parallel Approval (ANY)', async () => {
        // 1. Create Flow
        const flow = await db.insert(schema.approvalFlows).values({
            tenantId, code: 'TEST_ANY', name: 'Test Any', isActive: true
        }).returning().then((r: any[]) => r[0]);

        const node = await db.insert(schema.approvalNodes).values({
            tenantId, flowId: flow.id, name: 'Parallel Node', approverMode: 'ANY', approverRole: 'FINANCE'
        }).returning().then((r: any[]) => r[0]);

        // 2. Create Entity
        const bill = await db.insert(schema.paymentBills).values({
            tenantId, paymentNo: `BILL_ANY_${Date.now()}`, payeeType: 'SUPPLIER', payeeId: adminId, payeeName: 'Sup',
            amount: '100', status: 'PENDING', recordedBy: adminId, paymentMethod: 'CASH', proofUrl: 'url'
        }).returning().then((r: any[]) => r[0]);

        // 3. Submit
        vi.mocked(auth).mockResolvedValue({ user: { id: adminId, tenantId, role: 'ADMIN' } } as any);
        const res = await submissionActions.submitApproval({
            entityType: 'PAYMENT_BILL', entityId: bill.id, flowCode: 'TEST_ANY'
        });
        expect(res.success).toBe(true);

        // 4. Check Tasks
        const instance = await db.query.approvals.findFirst({
            where: (t: any, { eq }: any) => eq(t.entityId, bill.id)
        });
        const tasks = await db.query.approvalTasks.findMany({
            where: (t: any, { eq }: any) => eq(t.approvalId, instance!.id)
        });
        expect(tasks.length).toBeGreaterThanOrEqual(2);

        // 5. User1 Approves
        vi.mocked(auth).mockResolvedValue({ user: { id: user1Id, tenantId, role: 'FINANCE' } } as any);
        const task1 = tasks.find((t: any) => t.approverId === user1Id);

        const procRes = await processingActions.processApproval({
            taskId: task1!.id, action: 'APPROVE', comment: 'Go'
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
        // Logic says CANCELED in code
        expect(task2!.status).toBe('CANCELED');
    });

    it('should handle Parallel Approval (ALL)', async () => {
        const flow = await db.insert(schema.approvalFlows).values({
            tenantId, code: 'TEST_ALL', name: 'Test All', isActive: true
        }).returning().then((r: any[]) => r[0]);

        await db.insert(schema.approvalNodes).values({
            tenantId, flowId: flow.id, name: 'Parallel Node All', approverMode: 'ALL',
            approverRole: 'FINANCE'
        });

        const bill = await db.insert(schema.paymentBills).values({
            tenantId, paymentNo: `BILL_ALL_${Date.now()}`, payeeType: 'SUPPLIER', payeeId: adminId, payeeName: 'Sup',
            amount: '100', status: 'PENDING', recordedBy: adminId, paymentMethod: 'CASH', proofUrl: 'url'
        }).returning().then((r: any[]) => r[0]);

        vi.mocked(auth).mockResolvedValue({ user: { id: adminId, tenantId, role: 'ADMIN' } } as any);
        await submissionActions.submitApproval({ entityType: 'PAYMENT_BILL', entityId: bill.id, flowCode: 'TEST_ALL' });

        const instance = await db.query.approvals.findFirst({ where: (t: any, { eq }: any) => eq(t.entityId, bill.id) });
        const tasks = await db.query.approvalTasks.findMany({ where: (t: any, { eq }: any) => eq(t.approvalId, instance!.id) });

        vi.mocked(auth).mockResolvedValue({ user: { id: user1Id, tenantId } } as any);
        const task1 = tasks.find((t: any) => t.approverId === user1Id);
        await processingActions.processApproval({ taskId: task1!.id, action: 'APPROVE' });

        const midInstance = await db.query.approvals.findFirst({ where: (t: any, { eq }: any) => eq(t.id, instance!.id) });
        expect(midInstance!.status).toBe('PENDING');

        vi.mocked(auth).mockResolvedValue({ user: { id: user2Id, tenantId } } as any);
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

        const flow = await db.insert(schema.approvalFlows).values({
            tenantId, code: 'TEST_DEL', name: 'Test Del', isActive: true
        }).returning().then((r: any[]) => r[0]);
        await db.insert(schema.approvalNodes).values({
            tenantId, flowId: flow.id, name: 'Node 1', approverUserId: user1Id
        });

        const bill = await db.insert(schema.paymentBills).values({
            tenantId, paymentNo: `BILL_DEL_${Date.now()}`, payeeType: 'SUPPLIER', payeeId: adminId, payeeName: 'Sup',
            amount: '100', status: 'PENDING', recordedBy: adminId, paymentMethod: 'CASH', proofUrl: 'url'
        }).returning().then((r: any[]) => r[0]);

        vi.mocked(auth).mockResolvedValue({ user: { id: adminId, tenantId } } as any);
        await submissionActions.submitApproval({ entityType: 'PAYMENT_BILL', entityId: bill.id, flowCode: 'TEST_DEL' });

        const instance = await db.query.approvals.findFirst({ where: (t: any, { eq }: any) => eq(t.entityId, bill.id) });
        const tasks = await db.query.approvalTasks.findMany({ where: (t: any, { eq }: any) => eq(t.approvalId, instance!.id) });

        expect(tasks[0].approverId).toBe(user2Id);
    });

    it('should handle Withdraw', async () => {
        const flow = await db.insert(schema.approvalFlows).values({
            tenantId, code: 'TEST_WITHDRAW', name: 'Test Withdraw', isActive: true
        }).returning().then((r: any[]) => r[0]);
        await db.insert(schema.approvalNodes).values({
            tenantId, flowId: flow.id, name: 'Node 1', approverUserId: user1Id
        });

        const bill = await db.insert(schema.paymentBills).values({
            tenantId, paymentNo: `BILL_WD_${Date.now()}`, payeeType: 'SUPPLIER', payeeId: adminId, payeeName: 'Sup',
            amount: '100', status: 'PENDING', recordedBy: adminId, paymentMethod: 'CASH', proofUrl: 'url'
        }).returning().then((r: any[]) => r[0]);

        vi.mocked(auth).mockResolvedValue({ user: { id: adminId, tenantId } } as any);
        await submissionActions.submitApproval({ entityType: 'PAYMENT_BILL', entityId: bill.id, flowCode: 'TEST_WITHDRAW' });

        const instance = await db.query.approvals.findFirst({ where: (t: any, { eq }: any) => eq(t.entityId, bill.id) });

        const res = await managementActions.withdrawApproval({ instanceId: instance!.id, reason: 'Test' });
        expect(res.success).toBe(true);

        const updatedInstance = await db.query.approvals.findFirst({ where: (t: any, { eq }: any) => eq(t.id, instance!.id) });
        expect(updatedInstance!.status).toBe('WITHDRAWN');

        const updatedBill = await db.query.paymentBills.findFirst({ where: (t: any, { eq }: any) => eq(t.id, bill.id) });
        expect(updatedBill!.status).toBe('DRAFT');
    });
});
