'use server';

import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';
import { getDefaultDashboardConfig } from '../utils';
import { UserDashboardConfig } from '../types';
import { createLogger } from '@/shared/lib/logger';

import { revalidateTag } from 'next/cache';
import { WorkbenchService } from '@/services/workbench.service';

const logger = createLogger('DashboardConfigAction');

// 仪表盘配置校验 Schema
const widgetConfigSchema = z.object({
    id: z.string(),
    type: z.string(), // 应与 WidgetType 对应
    title: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
    visible: z.boolean(),
});

const dashboardConfigSchema = z.object({
    version: z.number(),
    columns: z.number(),
    widgets: z.array(widgetConfigSchema),
});


/**
 * 获取用户的仪表盘配置
 */
export async function getDashboardConfigAction(): Promise<UserDashboardConfig> {
    const session = await auth();
    if (!session?.user?.id) {
        return getDefaultDashboardConfig(session?.user?.role || '');
    }

    return WorkbenchService.getDashboardConfig(session.user.id, session.user.role || '');
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
                await WorkbenchService.updateDashboardConfig(userId, data as UserDashboardConfig);

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

            // 4. 失效缓存
            revalidateTag(`dashboard-config:${userId}`, 'default');
            return { success: true };
        } catch (error) {
            logger.error('保存仪表盘配置失败', { userId, tenantId, error });
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
                await WorkbenchService.updateDashboardConfig(userId, config);

                await AuditService.log(tx, {
                    tableName: 'users',
                    recordId: userId,
                    action: 'RESET_DASHBOARD_CONFIG',
                    userId,
                    tenantId,
                    details: { message: '用户重置了工作台布局配置为默认' }
                });
            });

            // 失效缓存
            revalidateTag(`dashboard-config:${userId}`, 'default');
            return { success: true };
        } catch (error) {
            logger.error('重置仪表盘配置失败', { userId, tenantId, error });
            throw new Error('重置失败');
        }
    }
);

