
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';
import { AuditService } from '@/shared/services/audit-service';

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

    // 查找并更新任务状态
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
        await db.update(measureTasks)
            .set({ status: 'PENDING_CONFIRM', updatedAt: new Date() })
            .where(eq(measureTasks.id, taskId));
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
        if (installTask) {
            found = true;
            await db.update(installTasks)
                .set({ status: 'PENDING_CONFIRM', updatedAt: new Date() })
                .where(eq(installTasks.id, taskId));
        }
    }

    if (!found) {
        return apiNotFound('任务不存在或不属于您');
    }

    // 记录审计日志
    await AuditService.log(db, {
        tableName: taskType === 'measure' ? 'measure_tasks' : 'install_tasks',
        recordId: taskId,
        action: 'TASK_SIGNATURE_REQUEST',
        userId: session.userId,
        tenantId: session.tenantId,
        newValues: { status: 'PENDING_CONFIRM' }
    });

    return apiSuccess({ taskId, status: 'PENDING_CONFIRM' }, '已发起签字申请');
}
