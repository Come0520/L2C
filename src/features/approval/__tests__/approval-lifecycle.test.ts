import { vi, describe, it, expect, beforeAll } from 'vitest';
import type { InferSelectModel } from 'drizzle-orm';

// 1. 使用 vi.hoisted 提前注入环境变量
vi.hoisted(() => {
    process.env.DATABASE_URL = 'postgresql://l2c_user:password@127.0.0.1:5435/l2c_dev';
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

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
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
    let flowCode: string;

    beforeAll(async () => {
        // 1. Create Tenant
        const [tenant] = await db.insert(schema.tenants).values({
            name: 'Lifecycle Tenant ' + Date.now(),
            code: 'LC_' + Date.now(),
        }).returning() as Tenant[];
        tenantId = tenant.id;

        // 2. Create Users
        const usersToCreate = [
            { email: `req_${Date.now()}@test.com`, name: 'Requester', role: 'SALES', isActive: true },
            { email: `app1_${Date.now()}@test.com`, name: 'Approver 1', role: 'FINANCE', isActive: true },
            { email: `app2_${Date.now()}@test.com`, name: 'Approver 2', role: 'FINANCE', isActive: true },
            { email: `app3_${Date.now()}@test.com`, name: 'Approver 3', role: 'FINANCE', isActive: true },
            { email: `newapp_${Date.now()}@test.com`, name: 'New Approver', role: 'TECH', isActive: true },
        ];

        const createdUsers = await db.insert(schema.users).values(
            usersToCreate.map(u => ({ ...u, tenantId, passwordHash: 'hash', phone: '13800000000' }))
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
        flowCode = flow.code;

        await db.insert(schema.approvalNodes).values({
            tenantId,
            flowId,
            name: 'Finance Review',
            approverRole: 'FINANCE',
            approverMode: 'MAJORITY',
            sortOrder: 1,
        });

        // 3.5 Create Customer
        const [customer] = await db.insert(schema.customers).values({
            tenantId,
            customerNo: `CUS_${Date.now()}`,
            name: 'Test Customer',
            type: 'INDIVIDUAL',
            phone: '13812345678',
            rating: 'NORMAL',
            createdBy: requesterId
        }).returning();

        // 4. Create Quote
        const [quote] = await db.insert(schema.quotes).values({
            tenantId,
            quoteNo: `QT_${Date.now()}`,
            customerId: customer.id, // mocked customer relation
            totalAmount: '50000',
            status: 'DRAFT',
            createdBy: requesterId,
            validUntil: new Date(Date.now() + 86400000)
        }).returning() as Quote[];
        quoteId = quote.id;

    }, 30000);

    it('should run full approval lifecycle (Submit -> Add Approver -> Majority Approve)', async () => {
        // Step 1: Submit Approval
        vi.mocked(auth).mockResolvedValue({ user: { id: requesterId, tenantId }, expires: '' } as any);

        const submitRes = await submissionActions.submitApproval({
            entityType: 'QUOTE',
            entityId: quoteId,
            flowCode: flowCode // 使用保存的 flowCode
        });

        expect(submitRes.success).toBe(true);
        const approvalId = submitRes.approvalId!;

        // Check initial tasks
        const tasks = await db.query.approvalTasks.findMany({
            where: (t: any, { eq }: any) => eq(t.approvalId, approvalId)
        });

        // At this point, FINANCE users should have tasks.
        // We know approver1, approver2, approver3 are FINANCE.
        // Assuming the system assigns dynamically based on role.
        const currentTask = tasks.find((t: any) => t.status === 'PENDING' && t.approverId === approver1Id);
        expect(currentTask).toBeDefined();

        if (currentTask) {
            // Step 2: Add Approver
            // @ts-ignore — mock auth
            vi.mocked(auth).mockResolvedValue({ user: { id: approver1Id, tenantId }, expires: '' } as any);
            const addResult = await processingActions.addApprover({
                taskId: currentTask.id,
                targetUserId: newApproverId,
                comment: 'Need tech review'
            });
            expect(addResult.success).toBe(true);

            // Validate new task was created
            const updatedTasks = await db.query.approvalTasks.findMany({
                where: (t: any, { eq }: any) => eq(t.approvalId, approvalId)
            });
            const newTask = updatedTasks.find((t: any) => t.approverId === newApproverId);
            expect(newTask).toBeDefined();
            expect(newTask?.status).toBe('PENDING');

            // Step 3: Process the newly added approver's task (TECH)
            // 此时已有 4 个任务 (3 FINANCE + 1 TECH)，TECH 通过后 1/4 = 25%，未达多数
            // @ts-ignore — mock auth
            vi.mocked(auth).mockResolvedValue({ user: { id: newApproverId, tenantId }, expires: '' } as any);
            await processingActions.processApproval({
                taskId: newTask!.id,
                action: 'APPROVE',
                comment: 'Tech review passed'
            });

            // 验证: TECH 通过后 (1/4)，审批实例仍应为 PENDING
            const midInstance = await db.query.approvals.findFirst({
                where: (t: any, { eq }: any) => eq(t.id, approvalId)
            });
            expect(midInstance?.status).toBe('PENDING');

            // Step 4: Approver1 (FINANCE) 审批通过 → 2/4 = 50% → 达到 MAJORITY
            const financeTask1 = updatedTasks.find((t: any) => t.approverId === approver1Id);

            // @ts-ignore — mock auth
            vi.mocked(auth).mockResolvedValue({ user: { id: approver1Id, tenantId }, expires: '' } as any);
            await processingActions.processApproval({
                taskId: financeTask1!.id,
                action: 'APPROVE'
            });

            const finalInstance = await db.query.approvals.findFirst({
                where: (t: any, { eq }: any) => eq(t.id, approvalId)
            });
            expect(finalInstance?.status).toBe('APPROVED'); // 2/4 = 50% → 多数通过!
        }
    });
});
