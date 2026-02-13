
/**
 * @vitest-environment node
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { vi, describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/shared/api/db';

describe('Approval Workflow', () => {
    let leadId: string;
    let tenantId: string;
    let userId: string;

    // Dynamic imports
    let saveApprovalFlow: (data: unknown) => Promise<{ success: boolean; data: { id: string } }>;
    let createMeasureTask: (data: unknown) => Promise<{ success: boolean; data: { id: string; status: string } }>;
    let processApprovalDecision: (data: unknown) => Promise<{ success: boolean; data: { status: string } }>;

    beforeAll(async () => {
        try {
            console.log('Importing DB...');

            // 1. Fetch valid user
            const validUser = await db.query.users.findFirst();
            if (!validUser) throw new Error('No valid user found');
            userId = validUser.id;
            tenantId = validUser.tenantId;

            // 2. Mock auth
            vi.doMock('@/shared/lib/auth', () => ({
                checkPermission: vi.fn().mockResolvedValue(true),
                auth: vi.fn().mockResolvedValue({
                    user: { id: userId, tenantId: tenantId, role: 'ADMIN' } // Assume Admin has role needed
                }),
            }));

            // 3. Import actions
            const settingsActions = await import('../../settings/actions');
            saveApprovalFlow = settingsActions.saveApprovalFlow;

            const measureActions = await import('../../service/measurement/actions');
            createMeasureTask = measureActions.createMeasureTask;

            const approvalActions = await import('../actions');
            processApprovalDecision = approvalActions.processApprovalDecision;

            // 4. Get Lead
            const lead = await db.query.leads.findFirst({
                where: (l: { tenantId: string }, { eq }: { eq: (a: unknown, b: unknown) => unknown }) => eq(l.tenantId, tenantId)
            });
            if (lead) leadId = lead.id;

        } catch (e) {
            console.error('Setup failed', e);
            throw e;
        }
    });

    it('should create an approval flow and trigger it on measurement creation', async () => {
        if (!leadId) {
            console.log('Skipping test - No lead found');
            return;
        }

        // 1. Create Approval Flow for Measurement
        const flowName = `Test Flow ${Date.now()}`;
        const saveRes = await saveApprovalFlow({
            name: flowName,
            module: 'MEASUREMENT',
            triggerAction: 'CREATE',
            steps: [
                {
                    order:1,
                    name: 'Test Step 1',
                    approverType: 'USER',
                    approverValue: userId, // Current user approves
                    required: true
                }
            ],
            timeoutHours: 24,
            timeoutAction: 'REMIND',
            isActive: true
        });

        if (!saveRes.success) console.error('Save Flow Error:', saveRes.error);
        expect(saveRes.success).toBe(true);
        const flowId = saveRes.data.id;

        // 2. Create Measure Task (Should trigger approval)
        const taskRes = await createMeasureTask({
            leadId: leadId,
            remark: 'Test Approval'
        });

        if (!taskRes.success) console.error('Create Task Error:', taskRes.error);
        expect(taskRes.success).toBe(true);
        const task = taskRes.data;
        console.log('Task Status:', task.status);
        // Check status - SHOULD BE PENDING_APPROVAL because flow exists
        expect(task.status).toBe('PENDING_APPROVAL');

        // 3. Check Approval Instance Created
        const instance = await db.query.approvalInstances.findFirst({
            where: (t: { entityId: string }, { eq }: { eq: (a: unknown, b: unknown) => unknown }) => eq(t.entityId, task.id)
        });
        expect(instance).toBeDefined();
        expect(instance.status).toBe('PENDING');
        expect(instance.flowId).toBe(flowId);

        // 4. Approve
        const approveRes = await processApprovalDecision({
            instanceId: instance.id,
            action: 'APPROVE',
            comment: 'LGTM'
        });
        expect(approveRes.success).toBe(true);
        expect(approveRes.data.status).toBe('PROCESSED');

        // 5. Verify Post-Approval State (Measure Task should be PENDING)
        const updatedTask = await db.query.measureTasks.findFirst({
            where: (t: { id: string }, { eq }: { eq: (a: unknown, b: unknown) => unknown }) => eq(t.id, task.id)
        });
        expect(updatedTask.status).toBe('PENDING');

        // Cleanup
        await db.delete(approvalInstancesTable).where(approvalInstancesTable.flowId, flowId); // Simplified cleanup
        // await db.delete(approvalFlows).where(approvalFlows.id, flowId);
    });
});
