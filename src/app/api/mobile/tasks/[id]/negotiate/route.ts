/**
 * 工人端 - 工费协商 API
 * POST /api/mobile/tasks/:id/negotiate
 * 
 * 工人对任务的工费提出协商申请，附带期望金额和原因说明。
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';
import { AuditService } from '@/shared/services/audit-service';

/**
 * 工费协商请求校验 Schema
 */
const negotiateSchema = z.object({
    /** 期望工费金额（元） */
    proposedAmount: z.number().positive('期望金额必须大于0'),
    /** 协商原因说明 */
    reason: z.string().min(5, '原因说明至少5个字符').max(500, '原因说明不超过500个字符'),
});

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    // 1. 认证
    const auth = await authenticateMobile(request);
    if (!auth.success) return auth.response;
    const session = auth.session;

    // 2. 权限检查 — 仅工人角色
    const isWorker = requireWorker(session);
    if (!isWorker.allowed) return isWorker.response;

    // 3. 获取路径参数
    const params = await props.params;
    const taskId = params.id;

    // 4. 校验请求体
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const parseResult = negotiateSchema.safeParse(body);
    if (!parseResult.success) {
        return apiError('参数校验失败', 400, parseResult.error.flatten().fieldErrors);
    }

    const { proposedAmount, reason } = parseResult.data;

    // 5. 查找任务（先查测量任务，再查安装任务）
    let taskType: 'measure' | 'install' = 'measure';
    let currentLaborFee: string | null = null;
    let found = false;

    const measureTask = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, taskId),
            eq(measureTasks.assignedWorkerId, session.userId),
            eq(measureTasks.tenantId, session.tenantId)
        ),
        columns: { id: true, status: true, laborFee: true },
    });

    if (measureTask) {
        found = true;
        currentLaborFee = measureTask.laborFee;
    } else {
        taskType = 'install';
        const installTask = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, taskId),
                eq(installTasks.installerId, session.userId),
                eq(installTasks.tenantId, session.tenantId)
            ),
            columns: { id: true, status: true, laborFee: true },
        });
        if (installTask) {
            found = true;
            currentLaborFee = installTask.laborFee;
        }
    }

    if (!found) {
        return apiNotFound('任务不存在或不属于您');
    }

    // 6. 更新工费协商信息
    const adjustmentInfo = JSON.stringify({
        proposedAmount,
        reason,
        requestedAt: new Date().toISOString(),
        requestedBy: session.userId,
    });

    if (taskType === 'measure') {
        await db.update(measureTasks)
            .set({
                adjustmentReason: adjustmentInfo,
                feeCheckStatus: 'PENDING' as typeof measureTasks.$inferSelect['feeCheckStatus'],
                updatedAt: new Date(),
            })
            .where(eq(measureTasks.id, taskId));
    } else {
        await db.update(installTasks)
            .set({
                adjustmentReason: adjustmentInfo,
                feeCheckStatus: 'PENDING' as typeof installTasks.$inferSelect['feeCheckStatus'],
                updatedAt: new Date(),
            })
            .where(eq(installTasks.id, taskId));
    }

    // 记录审计日志
    await AuditService.log(db, {
        tableName: taskType === 'measure' ? 'measure_tasks' : 'install_tasks',
        recordId: taskId,
        action: 'TASK_NEGOTIATE',
        userId: session.userId,
        tenantId: session.tenantId,
        newValues: {
            adjustmentReason: adjustmentInfo,
            feeCheckStatus: 'PENDING',
        },
        oldValues: {
            laborFee: currentLaborFee
        },
        details: { reason }
    });

    return apiSuccess({
        taskId,
        taskType,
        currentLaborFee: currentLaborFee ? parseFloat(currentLaborFee) : null,
        proposedAmount,
        status: 'PENDING',
    }, '工费协商申请已提交');
}
