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

/**
 * 仪表盘小组件配置校验 Schema
 */
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

/**
 * 仪表盘整体配置校验 Schema
 */
const dashboardConfigSchema = z.object({
    version: z.number(),
    columns: z.number(),
    widgets: z.array(widgetConfigSchema),
});


/**
 * 获取用户的仪表盘配置
 * 自动识别用户身份（租户ID/角色），如果没有针对该用户的个性化配置，则返回默认角色的配置。
 *
 * @returns {Promise<UserDashboardConfig>} 用户的仪表盘配置对象
 */
export async function getDashboardConfigAction(): Promise<UserDashboardConfig> {
    const session = await auth();
    if (!session?.user?.id) {
        return getDefaultDashboardConfig(session?.user?.role || '');
    }

    return WorkbenchService.getDashboardConfig(session.user.id, session.user.role || '');
}

/**
 * 保存用户仪表盘配置 (Server Action)
 * 使用 Zod Schema 进行参数校验，包裹在安全动作中（仅授权用户可调用）。
 * 更新数据库记录并添加审计日志（包含旧值和新值的详细对比）。
 *
 * @param {z.infer<typeof dashboardConfigSchema>} data 仪表盘配置数据
 * @returns {Promise<{ success: boolean }>} 操作成功与否状态
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
            revalidateTag(`dashboard-config:${userId}`, {});
            logger.info('成功保存仪表盘配置', { userId, tenantId });
            return { success: true };
        } catch (error) {
            logger.error('保存仪表盘配置失败', { userId, tenantId, error });
            throw new Error('保存失败');
        }
    }
);

/**
 * 重置仪表盘配置为默认 (Server Action)
 * 使用用户的当前角色获取默认配置并覆盖当前个性化配置，同时记录恢复出厂设置的审计日志。
 *
 * @returns {Promise<{ success: boolean }>} 操作成功与否状态
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
            revalidateTag(`dashboard-config:${userId}`, {});
            logger.info('成功重置仪表盘配置', { userId, tenantId });
            return { success: true };
        } catch (error) {
            logger.error('重置仪表盘配置失败', { userId, tenantId, error });
            throw new Error('重置失败');
        }
    }
);

