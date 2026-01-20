'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

const mockActionSchema = z.object({
    id: z.string().optional(),
    data: z.any().optional()
});

export const createReminderRule = createSafeAction(mockActionSchema, async (data) => {
    return { success: true, message: "Rule creation simulated in recovery mode" };
});

export const updateReminderRule = createSafeAction(mockActionSchema, async (data) => {
    return { success: true, message: "Rule update simulated in recovery mode" };
});

export const deleteReminderRule = createSafeAction(mockActionSchema, async (data) => {
    return { success: true, message: "Rule deletion simulated in recovery mode" };
});

export const toggleReminderRule = createSafeAction(mockActionSchema, async (data) => {
    return { success: true, message: "Rule toggle simulated in recovery mode" };
});
