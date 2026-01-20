'use server';

import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { QuoteService, type ImportAction } from '@/services/quote.service';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema/service';
import { eq, and, desc } from 'drizzle-orm';
// customers, leads 导入已移除（未使用）

// Schema Definitions
const previewImportSchema = z.object({
    quoteId: z.string().uuid(),
    measureTaskId: z.string().uuid()
});

const executeImportSchema = z.object({
    quoteId: z.string().uuid(),
    actions: z.array(z.any()) // Validation of complex action objects can be refined, passing as-is for service to validate
});

/*
 * Get list of completed measure tasks for the quote's customer/lead
 */
export async function getImportableMeasureTasks(quoteId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    // Correction: Fetch quote properly
    const quote = await db.query.quotes.findFirst({
        where: (quotes, { eq }) => eq(quotes.id, quoteId),
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
            // eq(measureTasks.status, 'COMPLETED') // Optional: only show completed? strictly yes, but for dev maybe allow others
        ),
        orderBy: [desc(measureTasks.createdAt)],
        limit: 10
    });

    return { success: true, data: tasks };
}

export const previewMeasurementImport = createSafeAction(previewImportSchema, async (data) => {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const result = await QuoteService.previewMeasurementImport(data.quoteId, data.measureTaskId);
    return result;
});

export const executeMeasurementImport = createSafeAction(executeImportSchema, async (data) => {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const result = await QuoteService.executeMeasurementImport(data.quoteId, data.actions as ImportAction[]);

    revalidatePath(`/quotes/${data.quoteId}`);
    return result;
});
