'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const mockActionSchema = z.object({
    id: z.string().optional(),
    data: z.unknown().optional()
});

const createSplitRuleActionInternal = createSafeAction(mockActionSchema, async (_data, { session }) => {
    // 权限检查：需要设置管理权限
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
    return { success: true, message: "Rule creation simulated in recovery mode" };
});

export async function createSplitRule(params: z.infer<typeof mockActionSchema>) {
    return createSplitRuleActionInternal(params);
}

const updateSplitRuleActionInternal = createSafeAction(mockActionSchema, async (_data, { session }) => {
    // 权限检查：需要设置管理权限
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
    return { success: true, message: "Rule update simulated in recovery mode" };
});

export async function updateSplitRule(params: z.infer<typeof mockActionSchema>) {
    return updateSplitRuleActionInternal(params);
}

const deleteSplitRuleActionInternal = createSafeAction(mockActionSchema, async (_data, { session }) => {
    // 权限检查：需要设置管理权限
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
    revalidatePath('/settings/split-rules');
    return { success: true, message: "Rule deletion simulated in recovery mode" };
});

export async function deleteSplitRule(params: z.infer<typeof mockActionSchema>) {
    return deleteSplitRuleActionInternal(params);
}
