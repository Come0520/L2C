'use server';

import { db } from '@/shared/api/db';
import { measureTasks, measureSheets } from '@/shared/api/schema/service';
import { leads } from '@/shared/api/schema/leads';
import { customers } from '@/shared/api/schema/customers';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ActionState, createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

// Input Schema
const CreateMeasureTaskSchema = z.object({
    leadId: z.string().uuid().optional(),
    customerId: z.string().uuid(),
    tenantId: z.string().uuid(),
    userId: z.string().uuid().optional(),
    type: z.enum(['QUOTE_BASED', 'BLIND', 'SALES_SELF']).default('BLIND'),
    remark: z.string().optional(),
    requiresFee: z.boolean().optional(),
});

type CreateMeasureTaskInput = z.infer<typeof CreateMeasureTaskSchema>;

/**
 * Determine Fee Check Status
 */
function calculateFeeStatus(input: { requiresFee?: boolean }, customer: { level?: string | null }) {
    // Rule 1: VIP Customers (Level A) are exempt
    if (customer.level === 'A') {
        return { isFeeExempt: true, feeCheckStatus: 'NONE' as const };
    }

    // Rule 2: Explicit Requirement
    if (input.requiresFee) {
        return { isFeeExempt: false, feeCheckStatus: 'PENDING' as const };
    }

    // Default: details pending
    return { isFeeExempt: false, feeCheckStatus: 'NONE' as const };
}

/**
 * Create Measure Task
 * 1. Create Measure Task Header
 * 2. Create Initial Draft Sheet
 * 3. Update Lead Status (if linked)
 */
export const createMeasureTask = createSafeAction(
    CreateMeasureTaskSchema,
    async (input: CreateMeasureTaskInput): Promise<ActionState<any>> => {
        const { leadId, customerId, tenantId, userId, type, remark, requiresFee } = input;

        return await db.transaction(async (tx) => {
            // Verify Customer
            const customer = await tx.query.customers.findFirst({
                where: eq(customers.id, customerId)
            });
            if (!customer) return { success: false, error: '客户不存在' };

            // Fee Logic
            const { isFeeExempt, feeCheckStatus } = calculateFeeStatus({ requiresFee }, customer);

            // Check existing active tasks? Maybe allow multiple.

            const measureNo = `MEA-${Date.now().toString().slice(-8)}`;

            const targetLeadId = leadId || customer.sourceLeadId;
            if (!targetLeadId) {
                return { success: false, error: '未找到关联线索，无法创建测量任务' };
            }

            // 1. Create Task
            const [newTask] = await tx.insert(measureTasks).values({
                tenantId,
                measureNo,
                leadId: targetLeadId,
                customerId,
                status: 'PENDING', // Pending Dispatch
                type: type as any,
                remark,
                round: 1, // First round
                isFeeExempt,
                feeCheckStatus,
                // assignedWorkerId: null, // To be dispatched
            }).returning();

            // 2. Create Initial Sheet
            const [newSheet] = await tx.insert(measureSheets).values({
                tenantId,
                taskId: newTask.id,
                status: 'DRAFT',
                round: 1,
                variant: 'Initial',
            }).returning();

            // 3. Update Lead Status if applicable
            if (targetLeadId) {
                await tx.update(leads)
                    .set({ status: 'PENDING_ASSIGNMENT' }) // Or PENDING_MEASUREMENT if such status exists?
                    // leadStatusEnum: ['PENDING_ASSIGNMENT', 'PENDING_FOLLOWUP', 'FOLLOWING_UP', 'INVALID', 'WON'] -- Doesn't have PENDING_MEASUREMENT in enum.
                    // customerPipelineStatusEnum has PENDING_MEASUREMENT.
                    .where(eq(leads.id, targetLeadId));

                // Also update customer pipeline status
                await tx.update(customers)
                    .set({ pipelineStatus: 'PENDING_MEASUREMENT' })
                    .where(eq(customers.id, customerId));
            }

            revalidatePath('/measurement');
            return { success: true, data: { taskId: newTask.id, sheetId: newSheet.id } };
        });
    }
);
