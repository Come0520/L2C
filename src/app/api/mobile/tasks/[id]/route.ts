/**
 * 移动端 - 任务详情 API
 * GET /api/mobile/tasks/:id
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireInternal } from '@/shared/middleware/mobile-auth';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile/tasks/[id]');

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const auth = await authenticateMobile(request);
    if (!auth.success) return auth.response;

    const session = auth.session;
    const isInternal = requireInternal(session);
    if (!isInternal.allowed) return isInternal.response;

    const taskId = params.id;
    let detail: Record<string, unknown> | null = null;
    let taskType = 'measure';

    try {
        // 1. 查找测量任务
        const measureTask = await db.query.measureTasks.findFirst({
            where: and(
                eq(measureTasks.id, taskId),
                eq(measureTasks.assignedWorkerId, session.userId),
                eq(measureTasks.tenantId, session.tenantId)
            ),
            with: {
                customer: true,
                lead: true,
            }
        });

        if (measureTask) {
            detail = measureTask;
        } else {
            // 尝试查找安装任务
            taskType = 'install';
            const installTask = await db.query.installTasks.findFirst({
                where: and(
                    eq(installTasks.id, taskId),
                    eq(installTasks.installerId, session.userId),
                    eq(installTasks.tenantId, session.tenantId)
                ),
                with: {
                    customer: {
                        columns: {
                            name: true,
                            phone: true,
                        },
                        with: {
                            addresses: true
                        }
                    },
                    order: {
                        columns: {
                            orderNo: true,
                        }
                    },
                    items: true,
                    photos: true,
                }
            });
            if (installTask) {
                detail = installTask;
            }
        }

        if (!detail) {
            return apiNotFound('任务不存在或不属于您');
        }

        // 4. 返回详情
        return apiSuccess({
            taskId,
            taskType,
            ...detail,
        });

    } catch (error) {
        log.error('任务详情查询错误', {}, error);
        return apiError('查询任务详情失败', 500);
    }
}
