/**
 * 工人端 - 提交完工 API
 * POST /api/mobile/tasks/:id/complete
 */

import { NextRequest } from 'next/server';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile:tasks:complete');
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';

import { withRateLimit, getRateLimitKey } from '@/shared/middleware/rate-limiter';

/**
 * 验证模式
 */
const CompleteSchema = z.object({
    photos: z.array(z.string().url()).optional(),
    remark: z.string().max(500).optional(),
    signatureUrl: z.string().url().optional(),
    partialInstall: z.boolean().optional(),
    issues: z.array(z.string()).optional(),
});

/**
 * 工人端 - 提交完工接口
 * 
 * @description 提交测量任务或安装任务的完工信息。
 * 包含状态机校验：仅限 PENDING_VISIT 或 IN_PROGRESS 状态的任务。
 * 已集成 Zod 输入校验和 AuditService 审计日志。
 * 
 * @param {NextRequest} request - JSON body 包含照片、备注、签名等
 * @param {Object} context - 包含路径参数 id (taskId)
 * @returns {Promise<NextResponse>} 返回完工状态
 */
async function completeHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // 3. 获取请求参数并进行 Zod 校验
    const { id: taskId } = await params;
    let validatedData;

    try {
        const body = await request.json();
        const result = CompleteSchema.safeParse(body);
        if (!result.success) {
            return apiError('输入校验失败: ' + result.error.issues.map(e => e.message).join(', '), 400);
        }
        validatedData = result.data;
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const { photos, remark, signatureUrl, issues } = validatedData;

    // 4. 查找任务
    try {
        let taskType: 'measure' | 'install' = 'measure';
        let taskFound = false;
        let currentStatus: string | null = null;

        const measureTask = await db.query.measureTasks.findFirst({
            where: and(
                eq(measureTasks.id, taskId),
                eq(measureTasks.assignedWorkerId, session.userId),
                eq(measureTasks.tenantId, session.tenantId)
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
                    eq(installTasks.installerId, session.userId),
                    eq(installTasks.tenantId, session.tenantId)
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

        // 7. 记录审计日志
        await AuditService.log(db, {
            tableName: taskType === 'measure' ? 'measure_tasks' : 'install_tasks',
            recordId: taskId,
            action: 'COMPLETE_MOBILE',
            userId: session.userId,
            tenantId: session.tenantId,
            details: {
                remark,
                photoCount: photos?.length || 0,
                hasSignature: !!signatureUrl,
                issues
            },
            traceId: session.traceId,
            userAgent: session.userAgent,
            ipAddress: session.ipAddress,
        });

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
    } catch (error) {
        log.error('提交完工失败', { taskId, error: error instanceof Error ? error.message : String(error) }, error);
        return apiError('提交完工失败，请稍后重试', 500);
    }
}

// 应用速率限制：1 分钟内最多 30 次提交
export const POST = withRateLimit(
    completeHandler,
    { windowMs: 60 * 1000, maxAttempts: 30 },
    getRateLimitKey('tasks:complete')
);
