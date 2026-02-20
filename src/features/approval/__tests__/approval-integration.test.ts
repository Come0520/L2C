import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { InferSelectModel } from 'drizzle-orm';

// Force set env for test before other imports
process.env.DATABASE_URL = 'postgresql://l2c_user:password@127.0.0.1:5435/l2c_dev';
process.env.AUTH_SECRET = 'test_secret_for_integration_tests';

import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import * as schema from '@/shared/api/schema';
import * as processingActions from '../actions/processing';

// Mock auth module
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

type Tenant = InferSelectModel<typeof schema.tenants>;
type User = InferSelectModel<typeof schema.users>;
type ApprovalFlow = InferSelectModel<typeof schema.approvalFlows>;
type ApprovalNode = InferSelectModel<typeof schema.approvalNodes>;
type Approval = InferSelectModel<typeof schema.approvals>;
type ApprovalTask = InferSelectModel<typeof schema.approvalTasks>;

describe('Approval Integration Tests', () => {
    let tenantId: string;
    let userId: string;
    let adminId: string;
    let flowId: string;
    let approvalId: string;
    let taskId: string;
    let nodeId: string;

    beforeAll(async () => {
        // 1. Create Tenant
        const [tenant] = await db.insert(schema.tenants).values({
            name: 'Test Tenant ' + Date.now(),
            code: 'TEST_INT_' + Date.now(),
        }).returning() as Tenant[];
        tenantId = tenant.id;

        // 2. Create Users
        const [user] = await db.insert(schema.users).values({
            tenantId,
            email: `user_${Date.now()}@test.com`,
            name: 'Test Requester',
            role: 'USER',
            passwordHash: 'hash'
        }).returning() as User[];
        userId = user.id;

        const [admin] = await db.insert(schema.users).values({
            tenantId,
            email: `admin_${Date.now()}@test.com`,
            name: 'Test Admin',
            role: 'ADMIN',
            passwordHash: 'hash'
        }).returning() as User[];
        adminId = admin.id;

        // 3. Create Flow
        const [flow] = await db.insert(schema.approvalFlows).values({
            tenantId,
            code: 'TEST_FLOW_' + Date.now(),
            name: 'Test Flow',
            isActive: true
        }).returning() as ApprovalFlow[];
        flowId = flow.id;

        // 4. Create Node
        const [node] = await db.insert(schema.approvalNodes).values({
            tenantId,
            flowId,
            name: 'Step 1',
            approverType: 'USER',
            approverUserId: userId,
            approverMode: 'ALL',
            sortOrder: 1,
        }).returning() as ApprovalNode[];
        nodeId = node.id;

        // 5. Create Approval Instance
        const entityId = '123e4567-e89b-12d3-a456-426614174005';
        const [approval] = await db.insert(schema.approvals).values({
            tenantId,
            flowId,
            entityType: 'TEST',
            entityId,
            status: 'PENDING',
            currentNodeId: nodeId,
            requesterId: userId
        }).returning() as Approval[];
        approvalId = approval.id;

        // 6. Create Task
        const [task] = await db.insert(schema.approvalTasks).values({
            tenantId,
            approvalId,
            nodeId: nodeId,
            approverId: userId,
            status: 'PENDING',
        }).returning() as ApprovalTask[];
        taskId = task.id;

    }, 30000);

    afterAll(async () => {
        // Cleanup could be added here
    });

    it('should allow adding an approver (addApprover)', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(auth).mockResolvedValue({ user: { id: userId, tenantId, name: 'Test Requester' }, expires: '' } as any);

        const res = await processingActions.addApprover({
            taskId: taskId,
            targetUserId: adminId,
            comment: 'Help me approve'
        });

        expect(res).toBeDefined();
    });

    it('should process approval (processApproval)', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(auth).mockResolvedValue({ user: { id: userId, tenantId, name: 'Test Requester' }, expires: '' } as any);

        const res = await processingActions.processApproval({
            taskId: taskId,
            action: 'APPROVE',
            comment: 'Approved by test'
        });

        expect(res.success).toBe(true);

        const task = await db.query.approvalTasks.findFirst({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            where: (t: ApprovalTask, { eq }: any) => eq(t.id, taskId)
        });
        expect(task?.status).toBe('APPROVED');
    });
});


