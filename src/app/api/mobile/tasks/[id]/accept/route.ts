/**
 * 工人端 - 接单/拒单 API
 * POST /api/mobile/tasks/:id/accept
 */

import { NextRequest } from 'next/server';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile:tasks:accept');
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';
import { AuditService } from '@/shared/services/audit-service';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    // 1. 认证
    const auth = await authenticateMobile(request);
    if (!auth.success) return auth.response;
    const session = auth.session;

    // 2. 权限检查
    const isWorker = requireWorker(session);
    if (!isWorker.allowed) return isWorker.response;

    // 3. 获取请求参数
    const params = await props.params;
    const taskId = params.id;
    let body: { accept: boolean; reason?: string };

    try {
        body = await request.json();
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const { accept, reason } = body;

    if (typeof accept !== 'boolean') {
        return apiError('缺少 accept 参数', 400);
    }

    // 4. 查找任务（先查测量任务，再查安装任务）
    let taskType: 'measure' | 'install' = 'measure';
    let taskId_: string | undefined;
    let taskStatus: string | null = null;

    const measureTask = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, taskId),
            eq(measureTasks.assignedWorkerId, session.userId),
            eq(measureTasks.tenantId, session.tenantId)
        ),
    });

    if (measureTask) {
        taskId_ = measureTask.id;
        taskStatus = measureTask.status;
    } else {
        taskType = 'install';
        const installTask = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, taskId),
                eq(installTasks.installerId, session.userId),
                eq(installTasks.tenantId, session.tenantId)
            ),
        });
        if (installTask) {
            taskId_ = installTask.id;
            taskStatus = installTask.status;
        }
    }

    if (!taskId_) {
        return apiNotFound('任务不存在或不属于您');
    }

    // 5. 检查任务状态（只有待接单状态可以操作）
    const validStatus = ['DISPATCHING', 'PENDING_ACCEPT'];
    const currentStatus = taskStatus || '';
    if (!validStatus.includes(currentStatus)) {
        return apiError(`当前状态 ${currentStatus} 不允许接单/拒单操作`, 400);
    }

    // 6. 更新任务状态
    const newStatus = accept ? 'PENDING_VISIT' : 'PENDING_DISPATCH';

    if (taskType === 'measure') {
        await db.update(measureTasks)
            .set({
                status: newStatus as typeof measureTasks.$inferSelect['status'],
                updatedAt: new Date(),
            })
            .where(eq(measureTasks.id, taskId));
    } else {
        await db.update(installTasks)
            .set({
                status: newStatus as typeof installTasks.$inferSelect['status'],
                updatedAt: new Date(),
            })
            .where(eq(installTasks.id, taskId));
    }

    // 7. 记录审计日志
    await AuditService.log(db, {
        tableName: taskType === 'measure' ? 'measure_tasks' : 'install_tasks',
        recordId: taskId,
        action: accept ? 'ACCEPT_TASK_MOBILE' : 'REJECT_TASK_MOBILE',
        userId: session.userId,
        tenantId: session.tenantId,
        details: { accept, reason, taskType },
        traceId: session.traceId,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
    });

    // 7. 如果拒单，记录原因（可扩展到操作日志）
    if (!accept && reason) {
        log.info('工人拒单', { taskId, reason });
    }

    return apiSuccess(
        {
            taskId,
            taskType,
            newStatus,
            accepted: accept,
        },
        accept ? '接单成功' : '已拒绝该任务'
    );
}
