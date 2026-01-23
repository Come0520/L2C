'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const mockActionSchema = z.object({
    id: z.string().optional(),
    data: z.any().optional()
});

const syncMeasureToQuoteActionInternal = createSafeAction(mockActionSchema, async (_data) => {
    revalidatePath('/quotes');
    return { success: true, message: "Sync measure to quote simulated" };
});

export async function syncMeasureToQuote(params: z.infer<typeof mockActionSchema>) {
    return syncMeasureToQuoteActionInternal(params);
}

const syncQuoteToMeasureActionInternal = createSafeAction(mockActionSchema, async (_data) => {
    revalidatePath('/service/tasks');
    return { success: true, message: "Sync quote to measure simulated" };
});

export async function syncQuoteToMeasure(params: z.infer<typeof mockActionSchema>) {
    return syncQuoteToMeasureActionInternal(params);
}
