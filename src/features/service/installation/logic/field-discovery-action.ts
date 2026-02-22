'use server';

import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { db } from '@/shared/api/db';
import { and, eq } from 'drizzle-orm';
import { installTasks } from '@/shared/api/schema/service';
import { revalidatePath } from 'next/cache';
import { logger } from '@/shared/lib/logger';

/** 现场发现 Schema */
const fieldDiscoverySchema = z.object({
    taskId: z.string(),
    discovery: z.object({
        type: z.enum(['OLD_CURTAIN', 'BROKEN_ITEM', 'NEW_OPPORTUNITY', 'OTHER']),
        location: z.string(), // 如：卧室、客厅
        description: z.string(),
        priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
        photos: z.array(z.string()).optional(),
    })
});

const submitFieldDiscoveryActionInternal = createSafeAction(fieldDiscoverySchema, async (data, ctx) => {
    const session = ctx.session;
    if (!session?.user?.tenantId) return { success: false, error: '未授权' };

    try {
        const task = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, data.taskId),
                eq(installTasks.tenantId, session.user.tenantId)
            )
        });

        if (!task) return { success: false, error: '任务不存在' };

        const existingDiscoveries = (task.fieldDiscovery as { discoveries?: unknown[] })?.discoveries || [];
        const newDiscovery = {
            ...data.discovery,
            id: `discovery_${Date.now()}`,
            createdAt: new Date().toISOString(),
            createdBy: session.user.id,
        };

        await db.update(installTasks)
            .set({
                fieldDiscovery: { discoveries: [...existingDiscoveries, newDiscovery] },
                updatedAt: new Date(),
            })
            .where(and(
                eq(installTasks.id, data.taskId),
                eq(installTasks.tenantId, session.user.tenantId)
            ));

        revalidatePath('/service/installation');
        return { success: true, message: '现场发现已记录' };
    } catch (error) {
        logger.error('Submit field discovery failed:', error);
        return { success: false, error: '记录失败' };
    }
});

export async function submitFieldDiscoveryAction(params: z.infer<typeof fieldDiscoverySchema>) {
    return submitFieldDiscoveryActionInternal(params);
}
