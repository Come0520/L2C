
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';
import { AuditService } from '@/shared/services/audit-service';

const scheduleSchema = z.object({
    scheduledAt: z.string().datetime().optional(),
    isConfirmed: z.boolean().default(true),
});

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const auth = await authenticateMobile(request);
    if (!auth.success) return auth.response;
    const session = auth.session;

    const isWorker = requireWorker(session);
    if (!isWorker.allowed) return isWorker.response;

    const params = await props.params;
    const taskId = params.id;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const parseResult = scheduleSchema.safeParse(body);
    if (!parseResult.success) {
        return apiError('参数校验失败', 400, parseResult.error.flatten().fieldErrors);
    }

    const { scheduledAt } = parseResult.data;

    // 查找任务
    let taskType: 'measure' | 'install' = 'measure';
    let found = false;

    const measureTask = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, taskId),
            eq(measureTasks.assignedWorkerId, session.userId),
            eq(measureTasks.tenantId, session.tenantId)
        ),
        columns: { id: true },
    });

    if (measureTask) {
        found = true;
    } else {
        taskType = 'install';
        const installTask = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, taskId),
                eq(installTasks.installerId, session.userId),
                eq(installTasks.tenantId, session.tenantId)
            ),
            columns: { id: true },
        });
        if (installTask) found = true;
    }

    if (!found) {
        return apiNotFound('任务不存在或不属于您');
    }

    const updateData: Record<string, any> = {
        updatedAt: new Date(),
        status: 'PENDING_VISIT', // 确认时间后，状态流转为待上门
    };

    if (scheduledAt) {
        updateData.scheduledAt = new Date(scheduledAt);
    }

    if (taskType === 'measure') {
        await db.update(measureTasks)
            .set(updateData)
            .where(eq(measureTasks.id, taskId));
    } else {
        // 安装任务使用的是 scheduledDate 字段名
        const installUpdateData: Record<string, any> = { ...updateData };
        if (installUpdateData.scheduledAt) {
            installUpdateData.scheduledDate = installUpdateData.scheduledAt;
            delete installUpdateData.scheduledAt;
        }
        await db.update(installTasks)
            .set(installUpdateData)
            .where(eq(installTasks.id, taskId));
    }

    // 记录审计日志
    await AuditService.log(db, {
        tableName: taskType === 'measure' ? 'measure_tasks' : 'install_tasks',
        recordId: taskId,
        action: 'TASK_SCHEDULE_UPDATE',
        userId: session.userId,
        tenantId: session.tenantId,
        newValues: {
            status: 'PENDING_VISIT',
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
        }
    });

    return apiSuccess({ taskId, status: 'PENDING_VISIT', scheduledAt }, '预约时间已确认');
}
