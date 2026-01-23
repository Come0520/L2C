'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

const mockActionSchema = z.object({
    id: z.string().optional(),
    data: z.unknown().optional()
});

const createReminderRuleActionInternal = createSafeAction(mockActionSchema, async (_data) => {
    return { success: true, message: "Rule creation simulated in recovery mode" };
});

export async function createReminderRule(params: z.infer<typeof mockActionSchema>) {
    return createReminderRuleActionInternal(params);
}

const updateReminderRuleActionInternal = createSafeAction(mockActionSchema, async (_data) => {
    return { success: true, message: "Rule update simulated in recovery mode" };
});

export async function updateReminderRule(params: z.infer<typeof mockActionSchema>) {
    return updateReminderRuleActionInternal(params);
}

const deleteReminderRuleActionInternal = createSafeAction(mockActionSchema, async (_data) => {
    return { success: true, message: "Rule deletion simulated in recovery mode" };
});

export async function deleteReminderRule(params: z.infer<typeof mockActionSchema>) {
    return deleteReminderRuleActionInternal(params);
}

const toggleReminderRuleActionInternal = createSafeAction(mockActionSchema, async (_data) => {
    return { success: true, message: "Rule toggle simulated in recovery mode" };
});

export async function toggleReminderRule(params: z.infer<typeof mockActionSchema>) {
    return toggleReminderRuleActionInternal(params);
}
