
import { NextRequest } from 'next/server';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile:tasks:install-items');
import { db } from '@/shared/api/db';
import { installTasks, installItems } from '@/shared/api/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound, apiForbidden } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/mobile/tasks/[id]/install-items
 * 获取安装项列表
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const authResult = await authenticateMobile(request);
    if (!authResult.success) return authResult.response;

    const roleCheck = requireWorker(authResult.session);
    if (!roleCheck.allowed) return roleCheck.response;

    const { session } = authResult;
    const { id: taskId } = await params;

    try {
        // Verify task exists and belongs to user
        const task = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, taskId),
                eq(installTasks.tenantId, session.tenantId)
            ),
            columns: { id: true, installerId: true }
        });

        if (!task) return apiNotFound('任务不存在');
        if (task.installerId !== session.userId) return apiForbidden('无权访问此任务');

        const items = await db.query.installItems.findMany({
            where: and(
                eq(installItems.installTaskId, taskId),
                eq(installItems.tenantId, session.tenantId)
            ),
            orderBy: (items, { asc }) => [asc(items.roomName)]
        });

        return apiSuccess(items);
    } catch (error) {
        log.error('Get Install Items Error', { taskId, error: error instanceof Error ? error.message : String(error) }, error);
        return apiError('获取安装项失败', 500);
    }
}

/**
 * PUT /api/mobile/tasks/[id]/install-items
 * 批量更新安装项状态
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const authResult = await authenticateMobile(request);
    if (!authResult.success) return authResult.response;

    const roleCheck = requireWorker(authResult.session);
    if (!roleCheck.allowed) return roleCheck.response;

    const { session } = authResult;
    const { id: taskId } = await params;

    try {
        const body = await request.json();
        const { items } = body;
        // items: Array<{ id: string, isInstalled: boolean, actualInstalledQuantity?: number, issueCategory?: string }>

        if (!Array.isArray(items) || items.length === 0) {
            return apiError('缺少更新数据', 400);
        }

        // 1. Verify Task
        const task = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, taskId),
                eq(installTasks.tenantId, session.tenantId)
            ),
            columns: { id: true, status: true, installerId: true }
        });

        if (!task) return apiNotFound('任务不存在');
        if (task.installerId !== session.userId) return apiForbidden('无权操作此任务');

        // 允许 IN_PROGRESS 或 PENDING_CONFIRM (补录)
        if (!['IN_PROGRESS', 'PENDING_CONFIRM'].includes(task.status)) {
            return apiError(`当前状态(${task.status})不允许更新安装项`, 400);
        }

        // 2. Batch Update
        // Drizzle doesn't support bulk update with different values easily in one query without raw SQL or case/check.
        // For simplicity and safety in MVP, we iterate. 
        // Or if performance matters, use transaction.

        await db.transaction(async (tx) => {
            const itemIds = items.map(i => i.id);
            // Verify items belong to task
            const validItems = await tx.query.installItems.findMany({
                where: and(
                    inArray(installItems.id, itemIds),
                    eq(installItems.installTaskId, taskId),
                    eq(installItems.tenantId, session.tenantId)
                ),
                columns: { id: true }
            });

            if (validItems.length !== items.length) {
                throw new Error('部分安装项无效或不属于当前任务');
            }

            for (const item of items) {
                await tx.update(installItems)
                    .set({
                        isInstalled: item.isInstalled,
                        actualInstalledQuantity: item.actualInstalledQuantity !== undefined ? String(item.actualInstalledQuantity) : undefined,
                        issueCategory: item.issueCategory || 'NONE',
                        updatedAt: new Date()
                    })
                    .where(and(
                        eq(installItems.id, item.id),
                        eq(installItems.tenantId, session.tenantId)
                    ));
            }
        });

        return apiSuccess({ success: true, count: items.length });

    } catch (error) {
        log.error('Update Install Items Error', { taskId, error: error instanceof Error ? error.message : String(error) }, error);
        return apiError('更新格式错误或部分安装项无效', 500);
    }
}
