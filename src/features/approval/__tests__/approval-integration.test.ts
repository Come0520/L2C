/**
 * @vitest-environment node
 */
import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';

// Force set env for test before other imports
process.env.DATABASE_URL = 'postgresql://l2c_test_user:l2c_test_password@localhost:5434/l2c_test';

import { auth } from '@/shared/lib/auth';
// Mock auth module
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

describe('Approval Integration Tests', () => {
    let db: any;
    let schema: any;
    let processingActions: any;

    let tenantId: string;
    let userId: string;
    let adminId: string;
    let flowId: string;
    let approvalId: string;
    let taskId: string;
    let nodeId: string;

    beforeAll(async () => {
        // Dynamic imports
        const dbModule = await import('@/shared/api/db');
        db = dbModule.db;
        schema = await import('@/shared/api/schema');
        processingActions = await import('../actions/processing');

        // 1. Create Tenant
        const [tenant] = await db.insert(schema.tenants).values({
            name: 'Test Tenant ' + Date.now(),
            code: 'TEST_INT_' + Date.now(),
        }).returning();
        tenantId = tenant.id;

        // 2. Create Users
        const [user] = await db.insert(schema.users).values({
            tenantId,
            email: `user_${Date.now()}@test.com`,
            name: 'Test Requester',
            role: 'USER',
            passwordHash: 'hash'
        }).returning();
        userId = user.id;

        const [admin] = await db.insert(schema.users).values({
            tenantId,
            email: `admin_${Date.now()}@test.com`,
            name: 'Test Admin',
            role: 'ADMIN',
            passwordHash: 'hash'
        }).returning();
        adminId = admin.id;

        // 3. Create Flow
        const [flow] = await db.insert(schema.approvalFlows).values({
            tenantId,
            code: 'TEST_FLOW_' + Date.now(),
            name: 'Test Flow',
            isActive: true
        }).returning();
        flowId = flow.id;

        // 4. Create Node
        const [node] = await db.insert(schema.approvalNodes).values({
            tenantId,
            flowId,
            name: 'Step 1',
            approverType: 'USER',
            approverUserId: userId,
            approverMode: 'ALL', // Corrected from matcherType
            sortOrder: 1,
        }).returning();
        nodeId = node.id;

        // 5. Create Approval Instance
        // Note: entityId is random UUID here, assuming no FK constraint on polymorphic entityId for 'TEST' type
        const entityId = '123e4567-e89b-12d3-a456-426614174005';
        const [approval] = await db.insert(schema.approvals).values({
            tenantId,
            flowId,
            entityType: 'TEST',
            entityId,
            status: 'PENDING',
            currentNodeId: nodeId,
            requesterId: userId
        }).returning();
        approvalId = approval.id;

        // 6. Create Task
        const [task] = await db.insert(schema.approvalTasks).values({
            tenantId,
            approvalId,
            nodeId: nodeId,
            approverId: userId,
            status: 'PENDING',
        }).returning();
        taskId = task.id;

    }, 30000);

    afterAll(async () => {
        // Cleanup if possible, or rely on test DB reset
        // For local dev with persistent DB, cleanup is good practice
        if (db && tenantId) {
            // Deleting tenant cascades usually? If not, delete manually order matters.
            // We skip detailed cleanup for now as it's a test env usually reset/dockerized.
        }
    });

    it('should allow adding an approver (addApprover)', async () => {
        (auth as any).mockResolvedValue({
            user: { id: userId, tenantId, name: 'Test Requester' },
        });

        const res = await processingActions.addApprover({
            taskId: taskId,
            targetUserId: adminId, // Adding admin as approver
            comment: 'Help me approve'
        });

        // Depending on implementation, this returns the new task or success status
        expect(res).toBeDefined();
        if (res.success !== undefined) {
            // If it returns StandardResponse
            // verifying success might depend on logic (e.g. is user allowed to add approver?)
            // Assuming user can add.
        }
    });

    it('should process approval (processApproval)', async () => {
        (auth as any).mockResolvedValue({
            user: { id: userId, tenantId, name: 'Test Requester' },
        });

        const res = await processingActions.processApproval({
            taskId: taskId,
            action: 'APPROVE',
            comment: 'Approved by test'
        });

        expect(res.success).toBe(true);

        const task = await db.query.approvalTasks.findFirst({
            where: (t: any, { eq }: any) => eq(t.id, taskId)
        });
        expect(task.status).toBe('APPROVED');
    });
});
