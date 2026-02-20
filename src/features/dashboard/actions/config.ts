'use server';

import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';
import { getDefaultDashboardConfig } from '../utils';
import { createLogger } from '@/shared/lib/logger';

const logger = createLogger('DashboardConfigAction');

const widgetTypeSchema = z.enum([
    'sales-target', 'sales-leads', 'sales-conversion', 'sales-avg-order',
    'team-sales', 'team-target', 'team-leaderboard', 'conversion-funnel',
    'pending-measure', 'pending-install', 'today-schedule', 'ar-summary',
    'ap-summary', 'cash-flow', 'pending-approval', 'sales-trend',
    'channel-performance', 'executive-summary', 'cash-flow-forecast',
    'ar-aging', 'enhanced-funnel'
]);

const widgetConfigSchema = z.object({
    id: z.string(),
    type: widgetTypeSchema,
    title: z.string().optional(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
    visible: z.boolean(),
});

const dashboardConfigSchema = z.object({
    version: z.number().default(1),
    columns: z.number().min(1).max(12).default(4),
    widgets: z.array(widgetConfigSchema),
});

/**
 * 获取用户的仪表盘配置
 */
export async function getDashboardConfigAction(): Promise<UserDashboardConfig> {
    const session = await auth();
    const defaultData = getDefaultDashboardConfig(session?.user?.role || '');
    if (!session?.user?.id) return defaultData;

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { dashboardConfig: true }
        });

        if (user?.dashboardConfig && typeof user.dashboardConfig === 'object') {
            return user.dashboardConfig as unknown as UserDashboardConfig;
        }
    } catch (error) {
        logger.error('获取仪表盘配置失败', {}, error);
    }

    return defaultData;
}

/**
 * 保存用户仪表盘配置
 */
export const saveDashboardConfigAction = createSafeAction(
    dashboardConfigSchema,
    async (data, { session }) => {
        const userId = session.user.id;
        const tenantId = session.user.tenantId;

        try {
            await db.transaction(async (tx) => {
                // 1. 获取旧配置用于审计对比
                const user = await tx.query.users.findFirst({
                    where: eq(users.id, userId),
                    columns: { dashboardConfig: true }
                });

                // 2. 更新配置
                await tx.update(users)
                    .set({
                        dashboardConfig: data as Record<string, unknown>,
                        updatedAt: new Date()
                    })
                    .where(eq(users.id, userId));

                // 3. 记录审计日志
                await AuditService.log(tx, {
                    tableName: 'users',
                    recordId: userId,
                    action: 'UPDATE_DASHBOARD_CONFIG',
                    userId,
                    tenantId,
                    oldValues: { dashboardConfig: user?.dashboardConfig },
                    newValues: { dashboardConfig: data },
                    details: { message: '用户更新了工作台布局配置' }
                });
            });

            return { success: true };
        } catch (error) {
            logger.error('保存仪表盘配置失败', { userId, tenantId }, error);
            throw new Error('保存失败');
        }
    }
);

/**
 * 重置仪表盘配置为默认
 */
export const resetDashboardConfigAction = createSafeAction(
    z.object({}),
    async (_, { session }) => {
        const userId = session.user.id;
        const tenantId = session.user.tenantId;

        try {
            await db.transaction(async (tx) => {
                const config = getDefaultDashboardConfig(session.user.role || '');
                await tx.update(users)
                    .set({
                        dashboardConfig: config as Record<string, unknown>,
                        updatedAt: new Date()
                    })
                    .where(eq(users.id, userId));

                await AuditService.log(tx, {
                    tableName: 'users',
                    recordId: userId,
                    action: 'RESET_DASHBOARD_CONFIG',
                    userId,
                    tenantId,
                    details: { message: '用户重置了工作台布局配置为默认' }
                });
            });

            return { success: true };
        } catch (error) {
            logger.error('重置仪表盘配置失败', { userId, tenantId }, error);
            throw new Error('重置失败');
        }
    }
);
