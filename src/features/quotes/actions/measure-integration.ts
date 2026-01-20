'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// syncMeasureToQuote removed in favor of measurement-actions.ts

export const createMeasureFromQuote = createSafeAction(z.object({
    quoteId: z.string().uuid(),
    tenantId: z.string().uuid(),
    customerId: z.string().uuid(),
    leadId: z.string().uuid(), // Required per schema
}), async (data) => {
    const { db } = await import('@/shared/api/db');
    const { measureTasks } = await import('@/shared/api/schema/service');

    const measureNo = `MS${Date.now()}`;
    const [measureTask] = await db.insert(measureTasks).values({
        measureNo,
        tenantId: data.tenantId,
        customerId: data.customerId,
        leadId: data.leadId,
        status: 'PENDING',
        type: 'QUOTE_BASED', // Valid enum value
        scheduledAt: new Date(),
        remark: `Created from quote ${data.quoteId}`
    }).returning();

    revalidatePath('/measurements');
    revalidatePath(`/quotes/${data.quoteId}`);

    return {
        success: true,
        measureTaskId: measureTask.id
    };
});
