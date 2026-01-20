/**
 * 工人端 - 提交完工 API
 * POST /api/mobile/tasks/:id/complete
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';

interface CompleteParams {
    params: Promise<{ id: string }>;
}

/**
 * 完工请求体
 */
interface CompleteBody {
    photos?: string[];           // 完工照片 URL 列表
    remark?: string;             // 备注
    signatureUrl?: string;       // 客户签名 URL
    partialInstall?: boolean;    // 是否部分安装（仅安装任务）
    issues?: string[];           // 问题列表
}

export async function POST(request: NextRequest, { params }: CompleteParams) {
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
    let body: CompleteBody;

    try {
        body = await request.json();
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const { photos, remark, signatureUrl, partialInstall, issues } = body;

    // 4. 查找任务
    let taskType: 'measure' | 'install' = 'measure';
    let taskFound = false;
    let currentStatus: string | null = null;

    const measureTask = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, taskId),
            eq(measureTasks.assignedWorkerId, session.userId)
        ),
        columns: { id: true, status: true }
    });

    if (measureTask) {
        taskFound = true;
        currentStatus = measureTask.status;
    } else {
        taskType = 'install';
        const installTask = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, taskId),
                eq(installTasks.installerId, session.userId)
            ),
            columns: { id: true, status: true }
        });
        if (installTask) {
            taskFound = true;
            currentStatus = installTask.status;
        }
    }

    if (!taskFound) {
        return apiNotFound('任务不存在或不属于您');
    }

    // 5. 检查任务状态
    const validStatus = ['PENDING_VISIT', 'IN_PROGRESS'];
    const statusToCheck = currentStatus || '';
    if (!validStatus.includes(statusToCheck)) {
        return apiError(`当前状态 ${statusToCheck} 不允许提交完工`, 400);
    }

    const now = new Date();
    const newStatus = 'PENDING_CONFIRM';

    // 6. 更新任务状态
    if (taskType === 'measure') {
        await db.update(measureTasks)
            .set({
                status: newStatus as typeof measureTasks.$inferSelect['status'],
                completedAt: now,
                updatedAt: now,
            })
            .where(eq(measureTasks.id, taskId));
    } else {
        await db.update(installTasks)
            .set({
                status: newStatus as typeof installTasks.$inferSelect['status'],
                completedAt: now,
                actualEndAt: now,
                customerSignatureUrl: signatureUrl,
                signedAt: signatureUrl ? now : undefined,
                updatedAt: now,
            })
            .where(eq(installTasks.id, taskId));
    }

    // 7. 记录完工信息（可扩展存储照片等）
    console.log(`[完工提交] 任务 ${taskId}, 类型: ${taskType}, 照片数: ${photos?.length || 0}`);

    return apiSuccess(
        {
            taskId,
            taskType,
            newStatus,
            completedAt: now.toISOString(),
            hasSignature: !!signatureUrl,
            photoCount: photos?.length || 0,
            hasIssues: (issues?.length || 0) > 0,
        },
        '完工提交成功，等待验收'
    );
}
