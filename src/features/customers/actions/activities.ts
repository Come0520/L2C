'use server';

import { db } from '@/shared/api/db';
import { customerActivities, customers } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { revalidateTag } from 'next/cache';
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
    images: string[] | null;
}

/**
 * 获取客户的动态/活动记录
 * 
 * 安全检查：自动从 session 获取 tenantId 并校验 CUSTOMER.VIEW 权限
 * @param customerId 客户 ID
 */
/**
 * 获取客户的动态/活动记录（支持分页限制）
 * @param customerId 客户 ID
 * @param limit 最大返回记录数，默认 50
 */
export async function getActivities(customerId: string, limit: number = 50): Promise<{ success: boolean; data?: ActivityDTO[]; error?: string }> {
    const startTime = Date.now();
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
            limit,
            with: {
                creator: {
                    columns: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        const results: ActivityDTO[] = list.map(item => ({
            ...item,
            id: item.id.toString(),
            createdAt: item.createdAt || new Date(),
            location: typeof item.location === 'string' ? item.location : null,
            images: item.images,
            creator: {
                id: (item as any).creator?.id || 'system',
                name: (item as any).creator?.name || '系统',
                avatarUrl: (item as any).creator?.avatarUrl || null
            }
        }));

        const duration = Date.now() - startTime;
        logger.info('[customers] 获取活动列表完成:', { customerId, count: results.length, duration });

        return { success: true, data: results };

    } catch (error) {
        logger.error('[customers] 获取客户动态失败:', error);
        return { success: false, error: 'Failed to fetch activities' };
    }
}

/**
 * 创建客户动态/活动记录
 * 
 * 安全检查：自动从 session 获取 tenantId 并校验 CUSTOMER.EDIT 权限
 * @param input 活动表单数据
 */
export async function createActivity(
    input: z.infer<typeof activitySchema>
): Promise<{ success: boolean; data?: ActivityDTO; error?: string }> {
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

        // 精确清除客户详情缓存
        revalidateTag(`customer-detail-${data.customerId}`, {});

        const returnData: ActivityDTO = {
            id: newActivity['id']?.toString() || '',
            type: newActivity.type,
            description: newActivity.description || '',
            createdAt: newActivity.createdAt || new Date(),
            creator: {
                id: session.user.id,
                name: session.user.name || '',
                avatarUrl: null
            },
            location: typeof newActivity.location === 'string' ? newActivity.location : null,
            images: newActivity.images as string[] | null,
        };

        return { success: true, data: returnData };

    } catch (error) {
        logger.error('[customers] 创建客户动态失败:', error);
        return { success: false, error: 'Failed to create activity' };
    }
}
