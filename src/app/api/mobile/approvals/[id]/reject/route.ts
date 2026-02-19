/**
 * 老板端 - 审批驳回 API
 * POST /api/mobile/approvals/:id/reject
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { approvalTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireBoss } from '@/shared/middleware/mobile-auth';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile/approvals/[id]/reject');

interface RejectParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RejectParams) {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
        return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查
    const roleCheck = requireBoss(session);
    if (!roleCheck.allowed) {
        return roleCheck.response;
    }

    const { id: taskId } = await params;

    // 3. 解析请求体
    let reason = '';
    try {
        const body = await request.json();
        reason = body.reason || '';
    } catch {
        // 无请求体
    }

    // 驳回必须填写原因
    if (!reason) {
        return apiError('请填写驳回原因', 400);
    }

    try {
        // 4. 查找审批任务
        const task = await db.query.approvalTasks.findFirst({
            where: and(
                eq(approvalTasks.id, taskId),
                eq(approvalTasks.tenantId, session.tenantId),
                eq(approvalTasks.approverId, session.userId),
                eq(approvalTasks.status, 'PENDING')
            ),
            columns: {
                id: true,
            }
        });

        if (!task) {
            return apiNotFound('审批任务不存在或已处理');
        }

        const now = new Date();

        // 5. 更新审批状态
        await db.update(approvalTasks)
            .set({
                status: 'REJECTED',
                actionAt: now,
                comment: reason,
            })
            .where(eq(approvalTasks.id, taskId));

        log.info(`审批驳回: 任务 ${taskId}, 原因: ${reason}`);

        return apiSuccess(
            {
                taskId,
                status: 'REJECTED',
                reason,
                processedAt: now.toISOString(),
            },
            '审批已驳回'
        );

    } catch (error) {
        log.error('审批驳回错误', {}, error);
        return apiError('审批驳回失败', 500);
    }
}
