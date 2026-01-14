'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const mockActionSchema = z.object({
    id: z.string().optional(),
    data: z.any().optional()
});

export const createSplitRule = createSafeAction(mockActionSchema, async (data) => {
    return { success: true, message: "Rule creation simulated in recovery mode" };
});

export const updateSplitRule = createSafeAction(mockActionSchema, async (data) => {
    return { success: true, message: "Rule update simulated in recovery mode" };
});

export const deleteSplitRule = createSafeAction(mockActionSchema, async (data) => {
    revalidatePath('/settings/split-rules');
    return { success: true, message: "Rule deletion simulated in recovery mode" };
});
