'use server';

import { db } from '@/shared/api/db';
import { customerActivities, customers } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { PERMISSIONS } from '@/shared/config/permissions';
import { activitySchema } from '../schemas';
import { trimInput } from '@/shared/lib/utils';
import { AuditService } from '@/shared/services/audit-service';
import { z } from 'zod';
import { logger } from '@/shared/lib/logger';

export interface ActivityDTO {
    id: string;
    type: string;
    description: string;
    createdAt: Date;
    creator: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
    location?: string | null;
    images?: string[];
}

/**
 * 获取客户的动态/活动记录
 * Get customer activities
 * 
 * 安全检查：自动从 session 获取 tenantId 并校验 CUSTOMER.VIEW 权限
 * Security check: Automatically gets tenantId and checks CUSTOMER.VIEW permission
 * @param customerId 客户 ID
 */
export async function getActivities(customerId: string): Promise<{ success: boolean; data?: ActivityDTO[]; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.tenantId) {
            logger.warn('[customers] 未授权访问客户动态:', { customerId });
            return { success: false, error: 'Unauthorized' };
        }

        logger.info('[customers] 获取客户动态:', { customerId, userId: session.user.id, tenantId: session.user.tenantId });

        // 权限检查
        await checkPermission(session, PERMISSIONS.CUSTOMER.VIEW);

        const list = await db.query.customerActivities.findMany({
            where: and(
                eq(customerActivities.customerId, customerId),
                eq(customerActivities.tenantId, session.user.tenantId)
            ),
            orderBy: [desc(customerActivities.createdAt)],
            with: {
                creator: {
                    columns: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        return { success: true, data: list as ActivityDTO[] };

    } catch (error) {
        logger.error('[customers] 获取客户动态失败:', error);
        return { success: false, error: 'Failed to fetch activities' };
    }
}

/**
 * 创建客户动态/活动记录
 * Create customer activity
 * 
 * 安全检查：自动从 session 获取 tenantId 并校验 CUSTOMER.EDIT 权限
 * Security check: Automatically gets tenantId and checks CUSTOMER.EDIT permission
 * @param input 活动表单数据
 */
export async function createActivity(
    input: z.infer<typeof activitySchema>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.tenantId) {
            logger.warn('[customers] 未授权创建客户动态:', { input });
            return { success: false, error: 'Unauthorized' };
        }

        logger.info('[customers] 创建客户动态:', { ...input, userId: session.user.id, tenantId: session.user.tenantId });

        // [Fix 5.4] 使用 activitySchema 校验并清理输入
        const data = trimInput(activitySchema.parse(input));

        // 权限检查
        await checkPermission(session, PERMISSIONS.CUSTOMER.EDIT);

        // 验证客户是否存在且属于当前租户
        const customer = await db.query.customers.findFirst({
            where: and(eq(customers.id, data.customerId), eq(customers.tenantId, session.user.tenantId)),
            columns: { id: true }
        });

        if (!customer) {
            return { success: false, error: 'Customer not found or access denied' };
        }

        const [newActivity] = await db.insert(customerActivities).values({
            tenantId: session.user.tenantId,
            customerId: data.customerId,
            type: data.type,
            description: data.description,
            images: data.images || [],
            location: data.location || null,
            createdBy: session.user.id
        }).returning();

        // 记录审计日志
        if (newActivity) {
            await AuditService.log(db, {
                tableName: 'customer_activities',
                recordId: newActivity['id'] || `${data.customerId}-${Date.now()}`,
                action: 'CREATE',
                userId: session.user.id,
                tenantId: session.user.tenantId,
                newValues: data,
                details: { customerId: data.customerId, type: data.type },
            });
        }

        revalidatePath(`/customers/${data.customerId}`);
        return { success: true, data: newActivity };

    } catch (error) {
        logger.error('[customers] 创建客户动态失败:', error);
        return { success: false, error: 'Failed to create activity' };
    }
}
