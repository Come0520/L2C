'use server';

import { z } from 'zod';
import { auth } from '@/shared/lib/auth';
import { ChangeOrderService } from '@/services/change-order.service';

export const createChangeRequestSchema = z.object({
    orderId: z.string().uuid(),
    type: z.enum(['FIELD_CHANGE', 'CUSTOMER_CHANGE', 'STOCK_OUT', 'OTHER']),
    reason: z.string().min(1, 'Reason is required'),
    diffAmount: z.string().optional(), // Receive as string to handle decimal input
    // In V1, we might not pass full JS objects for original/new data via simple form.
    // We'll stick to basic fields for now or assume simple JSON if needed.
    // For specific field changes, we might want params.
});

import { submitApproval } from '@/features/approval/actions/submission';

export async function createChangeRequestAction(input: z.infer<typeof createChangeRequestSchema>) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    const tenantId = (session.user as any).tenantId;

    try {
        const result = await ChangeOrderService.createRequest(input.orderId, tenantId, {
            type: input.type,
            reason: input.reason,
            diffAmount: input.diffAmount ? parseFloat(input.diffAmount) : 0,
            requestedBy: session.user.id!,
        });

        // Submit for Approval
        await submitApproval({
            tenantId,
            requesterId: session.user.id,
            flowCode: 'ORDER_CHANGE',
            entityType: 'ORDER_CHANGE',
            entityId: result.id,
            amount: result.diffAmount ? Math.abs(parseFloat(result.diffAmount)) : 0,
            comment: input.reason,
            // Additional conditions can be passed here
        });

        return { success: true };
    } catch (e: any) {
        console.error('Create Change Request Error:', e);
        return { success: false, error: e.message };
    }
}

export async function approveChangeRequestAction(requestId: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    const tenantId = (session.user as any).tenantId;

    try {
        await ChangeOrderService.approveRequest(requestId, tenantId, session.user.id!);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function rejectChangeRequestAction(requestId: string, reason?: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    const tenantId = (session.user as any).tenantId;

    try {
        await ChangeOrderService.rejectRequest(requestId, tenantId, session.user.id!, reason);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
