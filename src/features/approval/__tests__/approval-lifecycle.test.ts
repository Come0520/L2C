import { vi, describe, it, expect, beforeAll } from 'vitest';
import type { InferSelectModel } from 'drizzle-orm';

// 1. 使用 vi.hoisted 提前注入环境变量
vi.hoisted(() => {
    process.env.DATABASE_URL = 'postgresql://l2c_user:password@localhost:5434/l2c_test';
    process.env.AUTH_SECRET = 'test_secret_for_lifecycle_tests';
});

import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import * as schema from '@/shared/api/schema';
import * as submissionActions from '../actions/submission';
import * as processingActions from '../actions/processing';

// Mock auth module
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

type Tenant = InferSelectModel<typeof schema.tenants>;
type User = InferSelectModel<typeof schema.users>;
type ApprovalFlow = InferSelectModel<typeof schema.approvalFlows>;
type Quote = InferSelectModel<typeof schema.quotes>;

describe('Approval Lifecycle Integration Tests', () => {
    let tenantId: string;
    let requesterId: string;
    let approver1Id: string;
    let approver2Id: string;
    let _approver3Id: string;
    let newApproverId: string;
    let quoteId: string;
    let flowId: string;

    beforeAll(async () => {
        // 1. Create Tenant
        const [tenant] = await db.insert(schema.tenants).values({
            name: 'Lifecycle Tenant ' + Date.now(),
            code: 'LC_' + Date.now(),
        }).returning() as Tenant[];
        tenantId = tenant.id;

        // 2. Create Users
        const usersToCreate = [
            { email: `req_${Date.now()}@test.com`, name: 'Requester', role: 'SALES' },
            { email: `app1_${Date.now()}@test.com`, name: 'Approver 1', role: 'FINANCE' },
            { email: `app2_${Date.now()}@test.com`, name: 'Approver 2', role: 'FINANCE' },
            { email: `app3_${Date.now()}@test.com`, name: 'Approver 3', role: 'FINANCE' },
            { email: `newapp_${Date.now()}@test.com`, name: 'New Approver', role: 'TECH' },
        ];

        const createdUsers = await db.insert(schema.users).values(
            usersToCreate.map(u => ({ ...u, tenantId, passwordHash: 'hash' }))
        ).returning() as User[];

        requesterId = createdUsers[0].id;
        approver1Id = createdUsers[1].id;
        approver2Id = createdUsers[2].id;
        _approver3Id = createdUsers[3].id;
        newApproverId = createdUsers[4].id;

        // 3. Create Flow (Majority Voting)
        const [flow] = await db.insert(schema.approvalFlows).values({
            tenantId,
            code: 'QUOTE_MAJORITY_' + Date.now(),
            name: 'Quote Majority Flow',
            isActive: true
        }).returning() as ApprovalFlow[];
        flowId = flow.id;

        await db.insert(schema.approvalNodes).values({
            tenantId,
            flowId,
            name: 'Finance Review',
            approverRole: 'FINANCE',
            approverMode: 'MAJORITY',
            sortOrder: 1,
        });

        // 4. Create Quote
        const [quote] = await db.insert(schema.quotes).values({
            tenantId,
            quoteNo: `QT_${Date.now()}`,
            customerId: requesterId, // mock relation
            totalAmount: '50000',
            status: 'DRAFT',
            createdBy: requesterId,
            validUntil: new Date(Date.now() + 86400000)
        }).returning() as Quote[];
        quoteId = quote.id;

    }, 30000);

    it('should run full approval lifecycle (Submit -> Add Approver -> Majority Approve)', async () => {
        // Step 1: Submit Approval
        // @ts-expect-error — mock auth session，仅提供测试需要的部分字段
        vi.mocked(auth).mockResolvedValue({ user: { id: requesterId, tenantId }, expires: '' });

        const submitRes = await submissionActions.submitApproval({
            entityType: 'QUOTE',
            entityId: quoteId,
            flowCode: exactFlowCode
        });

        expect(submitRes.success).toBe(true);
        const approvalId = submitRes.approvalId!;

        // Check initial tasks
        const tasks = await db.query.approvalTasks.findMany({
            where: (t, { eq }) => eq(t.approvalId, approvalId)
        });

        // At this point, FINANCE users should have tasks.
        // We know approver1, approver2, approver3 are FINANCE.
        // Assuming the system assigns dynamically based on role.
        const currentTask = tasks.find(t => t.status === 'PENDING');
        expect(currentTask).toBeDefined();

        if (currentTask) {
            // Step 2: Add Approver
            // @ts-expect-error — mock auth
            vi.mocked(auth).mockResolvedValue({ user: { id: approver1Id, tenantId }, expires: '' });
            const addResult = await processingActions.addApprover({
                taskId: currentTask.id,
                targetUserId: newApproverId,
                comment: 'Need tech review'
            });
            expect(addResult.success).toBe(true);

            // Validate new task was created
            const updatedTasks = await db.query.approvalTasks.findMany({
                where: (t, { eq }) => eq(t.approvalId, approvalId)
            });
            const newTask = updatedTasks.find(t => t.approverId === newApproverId);
            expect(newTask).toBeDefined();
            expect(newTask?.status).toBe('PENDING');

            // Step 3: Process the newly added approver's task
            // @ts-expect-error — mock auth
            vi.mocked(auth).mockResolvedValue({ user: { id: newApproverId, tenantId }, expires: '' });
            await processingActions.processApproval({
                taskId: newTask!.id,
                action: 'APPROVE',
                comment: 'Tech review passed'
            });

            // Step 4: Process Majority (Needs 2 out of 3 Finance approvers)
            // Let's approve with approver1 and approver2
            const financeTask1 = updatedTasks.find(t => t.approverId === approver1Id);
            const financeTask2 = updatedTasks.find(t => t.approverId === approver2Id);

            // @ts-expect-error — mock auth
            vi.mocked(auth).mockResolvedValue({ user: { id: approver1Id, tenantId }, expires: '' });
            await processingActions.processApproval({
                taskId: financeTask1!.id,
                action: 'APPROVE'
            });

            const midInstance = await db.query.approvals.findFirst({
                where: (t, { eq }) => eq(t.id, approvalId)
            });
            expect(midInstance?.status).toBe('PENDING'); // Should still be pending

            // @ts-expect-error — mock auth
            vi.mocked(auth).mockResolvedValue({ user: { id: approver2Id, tenantId }, expires: '' });
            await processingActions.processApproval({
                taskId: financeTask2!.id,
                action: 'APPROVE'
            });

            const finalInstance = await db.query.approvals.findFirst({
                where: (t, { eq }) => eq(t.id, approvalId)
            });
            expect(finalInstance?.status).toBe('APPROVED'); // Reached majority!
        }
    });
});
