'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { QuoteConfigService } from '@/services/quote-config.service';
import { revalidatePath } from 'next/cache';
import { auth } from '@/shared/lib/auth';

const updateModeSchema = z.object({
    mode: z.enum(['simple', 'advanced'])
});

const updateGlobalConfigSchema = z.object({
    mode: z.enum(['simple', 'advanced']).optional(),
    visibleFields: z.array(z.string()).optional(),
    presetLoss: z.object({
        side: z.number(),
        bottom: z.number(),
        header: z.number(),
    }).optional(),
});

/**
 * 获取当前用户的报价单配置
 */
export async function getMyQuoteConfig() {
    const session = await auth();
    if (!session?.user) {
        return QuoteConfigService.getMergedConfig('default', 'guest');
    }

    return await QuoteConfigService.getMergedConfig(session.user.tenantId, session.user.id);
}

/**
 * 切换用户的报价模式
 */
export const toggleQuoteMode = createSafeAction(updateModeSchema, async (data) => {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await QuoteConfigService.updateUserMode(session.user.id, data.mode);

    revalidatePath('/quotes');
    return { success: true };
});

/**
 * 更新租户的全局报价配置
 */
export const updateGlobalQuoteConfig = createSafeAction(updateGlobalConfigSchema, async (data) => {
    const session = await auth();
    if (!session?.user?.id || !session.user.tenantId) {
        throw new Error('Unauthorized');
    }

    // Simple Admin Check (Extend with checkPermission if needed later)
    if (session.user.role !== 'ADMIN') {
        throw new Error('Permission denied: Only admins can change global config');
    }

    await QuoteConfigService.updateTenantConfig(session.user.tenantId, data);

    revalidatePath('/quotes');
    return { success: true };
});
