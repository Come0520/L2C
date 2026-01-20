'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const mockActionSchema = z.object({
    id: z.string().optional(),
    data: z.any().optional()
});

export const syncMeasureToQuote = createSafeAction(mockActionSchema, async (data) => {
    revalidatePath('/quotes');
    return { success: true, message: "Sync measure to quote simulated" };
});

export const syncQuoteToMeasure = createSafeAction(mockActionSchema, async (data) => {
    revalidatePath('/service/tasks');
    return { success: true, message: "Sync quote to measure simulated" };
});
