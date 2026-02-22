/**
 * CRM 跟进活动 API
 *
 * GET  /api/miniprogram/crm/activities — 获取客户跟进记录
 * POST /api/miniprogram/crm/activities — 创建跟进记录
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { customerActivities } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../auth-utils';
import { CreateActivitySchema } from '../../miniprogram-schemas';
import { AuditService } from '@/shared/services/audit-service';
import { RateLimiter } from '@/shared/services/miniprogram/security.service';

export async function GET(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('未授权', 401);
        }

        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return apiError('客户 ID 不能为空', 400);
        }

        const list = await db.query.customerActivities.findMany({
            where: and(
                eq(customerActivities.customerId, customerId),
                eq(customerActivities.tenantId, user.tenantId)
            ),
            orderBy: [desc(customerActivities.createdAt)],
            limit: 50,
            with: {
                creator: {
                    columns: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        return apiSuccess(list);

    } catch (error) {
        logger.error('[CRM] 获取活动记录失败', { route: 'crm/activities', error });
        return apiError('获取活动记录失败', 500);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('未授权', 401);
        }

        // 频控：单用户每 5 秒最多 3 条活动
        if (!RateLimiter.allow(`create_activity_${user.id}`, 3, 5000)) {
            return apiError('记录太频繁，请稍后再试', 429);
        }

        const body = await request.json();

        // Zod 输入验证
        const parsed = CreateActivitySchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message, 400);
        }

        const { customerId, type, description, images, location } = parsed.data;

        const [newActivity] = await db.insert(customerActivities).values({
            tenantId: user.tenantId,
            customerId,
            type,
            description,
            images: images || [],
            location: location || null,
            createdBy: user.id
        }).returning();

        // 审计日志
        await AuditService.log(db, {
            tableName: 'customer_activities',
            recordId: newActivity.id,
            action: 'CREATE',
            userId: user.id,
            tenantId: user.tenantId,
            details: { customerId, type }
        });

        logger.info('[CRM] 跟进活动创建成功', {
            route: 'crm/activities',
            activityId: newActivity.id,
            customerId,
            userId: user.id,
            tenantId: user.tenantId,
        });

        return apiSuccess(newActivity);

    } catch (error) {
        logger.error('[CRM] 创建跟进活动失败', { route: 'crm/activities', error });
        return apiError('创建跟进活动失败', 500);
    }
}
