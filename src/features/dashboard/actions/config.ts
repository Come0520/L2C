'use server';

import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { DashboardLayoutConfig, DEFAULT_DASHBOARD_CONFIG } from '../components/configurable-dashboard';

const dashboardConfigSchema = z.object({
    columns: z.number().min(1).max(12).default(4),
    widgets: z.array(z.object({
        id: z.string(),
        type: z.string(),
        title: z.string(),
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
        visible: z.boolean(),
    })),
});

/**
 * 获取用户的仪表盘配置
 */
export async function getDashboardConfig(): Promise<DashboardLayoutConfig> {
    const session = await auth();
    if (!session?.user?.id) return DEFAULT_DASHBOARD_CONFIG;

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { dashboardConfig: true }
    });

    const config = user?.dashboardConfig as Record<string, unknown>;
    if (config && typeof config === 'object' && 'columns' in config && 'widgets' in config) {
        return config as unknown as DashboardLayoutConfig;
    }

    return DEFAULT_DASHBOARD_CONFIG;
}

const saveDashboardConfigActionInternal = createSafeAction(dashboardConfigSchema, async (data, { session }) => {
    const userId = session.user.id;

    await db.update(users)
        .set({
            dashboardConfig: data as unknown as Record<string, unknown>,
            updatedAt: new Date()
        })
        .where(eq(users.id, userId));

    return { success: true };
});

export async function saveDashboardConfigAction(params: z.infer<typeof dashboardConfigSchema>) {
    return saveDashboardConfigActionInternal(params);
}

/**
 * 重置仪表盘配置为默认
 */
export async function resetDashboardConfig(): Promise<{ success: boolean }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    await db.update(users)
        .set({
            dashboardConfig: DEFAULT_DASHBOARD_CONFIG as unknown as Record<string, unknown>,
            updatedAt: new Date()
        })
        .where(eq(users.id, session.user.id));

    return { success: true };
}
