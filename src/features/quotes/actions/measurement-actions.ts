'use server';

import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { QuoteService, type ImportAction } from '@/services/quote.service';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema/service';
import { eq, and, desc } from 'drizzle-orm';
import { updateQuoteTotal } from './shared-helpers';
// customers, leads 导入已移除（未使用）

// Schema Definitions
const previewImportSchema = z.object({
    quoteId: z.string().uuid(),
    measureTaskId: z.string().uuid()
});

const importActionSchema = z.object({
    type: z.enum(['CREATE_ROOM', 'CREATE_ITEM', 'UPDATE_ITEM']),
    description: z.string(),
    data: z.record(z.string(), z.unknown()),
    measureItem: z.record(z.string(), z.unknown()),
    diff: z.array(z.object({
        field: z.string(),
        oldValue: z.unknown(),
        newValue: z.unknown()
    })).optional()
});

const executeImportSchema = z.object({
    quoteId: z.string().uuid(),
    actions: z.array(importActionSchema)
});

/*
 * Get list of completed measure tasks for the quote's customer/lead
 */
export async function getImportableMeasureTasks(quoteId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    // Correction: Fetch quote properly
    const quote = await db.query.quotes.findFirst({
        where: (quotes, { eq, and }) => and(
            eq(quotes.id, quoteId),
            eq(quotes.tenantId, session.user.tenantId)
        ),
        with: {
            customer: true
        }
    });

    if (!quote) return { success: false, error: 'Quote not found' };

    // Find tasks for this customer 
    // Logic: Same Customer ID
    const tasks = await db.query.measureTasks.findMany({
        where: and(
            eq(measureTasks.customerId, quote.customerId),
            eq(measureTasks.tenantId, session.user.tenantId)
            // eq(measureTasks.status, 'COMPLETED') // Optional: only show completed? strictly yes, but for dev maybe allow others
        ),
        orderBy: [desc(measureTasks.createdAt)],
        limit: 10
    });

    return { success: true, data: tasks };
}

const previewMeasurementImportActionInternal = createSafeAction(previewImportSchema, async (data) => {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const result = await QuoteService.previewMeasurementImport(data.quoteId, data.measureTaskId, session.user.tenantId);
    return result;
});

export async function previewMeasurementImport(params: z.infer<typeof previewImportSchema>) {
    return previewMeasurementImportActionInternal(params);
}

const executeMeasurementImportActionInternal = createSafeAction(executeImportSchema, async (data) => {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const result = await QuoteService.executeMeasurementImport(data.quoteId, data.actions as ImportAction[], session.user.tenantId);

    // 导入完成后重新计算总额
    await updateQuoteTotal(data.quoteId, session.user.tenantId);

    revalidatePath(`/quotes/${data.quoteId}`);
    return result;
});

export async function executeMeasurementImport(params: z.infer<typeof executeImportSchema>) {
    return executeMeasurementImportActionInternal(params);
}
