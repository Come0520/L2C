'use server';

import { db } from '@/shared/api/db';
import { financeConfigs } from '@/shared/api/schema/finance';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export interface ChannelGradeDiscounts {
    S: number;
    A: number;
    B: number;
    C: number;
    [key: string]: number;
}

const DEFAULT_GRADE_DISCOUNTS: ChannelGradeDiscounts = {
    S: 0.90,
    A: 0.95,
    B: 1.00,
    C: 1.00,
};

const gradeDiscountsSchema = z.record(z.string(), z.number().min(0).max(1));

/**
 * 获取渠道等级折扣配置
 */
export async function getChannelGradeDiscounts(): Promise<ChannelGradeDiscounts> {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return DEFAULT_GRADE_DISCOUNTS;
    }

    const config = await db.query.financeConfigs.findFirst({
        where: and(
            eq(financeConfigs.tenantId, session.user.tenantId),
            eq(financeConfigs.configKey, 'CHANNEL_GRADE_DISCOUNTS')
        ),
    });

    if (!config) {
        return DEFAULT_GRADE_DISCOUNTS;
    }

    try {
        const value = JSON.parse(config.configValue);
        return { ...DEFAULT_GRADE_DISCOUNTS, ...value };
    } catch {
        return DEFAULT_GRADE_DISCOUNTS;
    }
}

/**
 * 更新渠道等级折扣配置
 */
export async function updateChannelGradeDiscounts(discounts: ChannelGradeDiscounts) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    // 权限校验
    try {
        await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
    } catch {
        return { success: false, error: '无权限执行此操作' };
    }

    const validated = gradeDiscountsSchema.safeParse(discounts);
    if (!validated.success) {
        return { success: false, error: validated.error.message };
    }

    const configKey = 'CHANNEL_GRADE_DISCOUNTS';
    const configValue = JSON.stringify(validated.data);

    // Check if exists
    const existing = await db.query.financeConfigs.findFirst({
        where: and(
            eq(financeConfigs.tenantId, session.user.tenantId),
            eq(financeConfigs.configKey, configKey)
        ),
    });

    if (existing) {
        await db.update(financeConfigs)
            .set({
                configValue,
                updatedAt: new Date(),
            })
            .where(eq(financeConfigs.id, existing.id));
    } else {
        await db.insert(financeConfigs).values({
            tenantId: session.user.tenantId,
            configKey,
            configValue,
        });
    }

    revalidatePath('/settings/channels');
    return { success: true };
}
