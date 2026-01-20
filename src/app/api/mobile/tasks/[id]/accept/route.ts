/**
 * 工人端 - 接单/拒单 API
 * POST /api/mobile/tasks/:id/accept
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';

interface AcceptParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: AcceptParams) {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
        return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查
    const roleCheck = requireWorker(session);
    if (!roleCheck.allowed) {
        return roleCheck.response;
    }

    // 3. 获取请求参数
    const { id: taskId } = await params;
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
            eq(measureTasks.assignedWorkerId, session.userId)
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
                eq(installTasks.installerId, session.userId)
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

    // 7. 如果拒单，记录原因（可扩展到操作日志）
    if (!accept && reason) {
        console.log(`[工人拒单] 任务 ${taskId}, 原因: ${reason}`);
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
