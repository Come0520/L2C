/**
 * 老板端 - 审批操作 API
 * POST /api/mobile/approvals/:id/approve
 * POST /api/mobile/approvals/:id/reject
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { approvalTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireBoss } from '@/shared/middleware/mobile-auth';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile/approvals/[id]/approve');

interface ApproveParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: ApproveParams) {
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

    // 3. 解析请求体（可选备注）
    let remark = '';
    try {
        const body = await request.json();
        remark = body.remark || '';
    } catch {
        // 无请求体也允许
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
                approvalId: true,
            }
        });

        if (!task) {
            return apiNotFound('审批任务不存在或已处理');
        }

        const now = new Date();

        // 5. 更新审批状态
        await db.update(approvalTasks)
            .set({
                status: 'APPROVED',
                actionAt: now,
                comment: remark || null,
            })
            .where(eq(approvalTasks.id, taskId));

        log.info(`审批通过: 任务 ${taskId}, 审批人: ${session.userId}`);

        return apiSuccess(
            {
                taskId,
                approvalId: task.approvalId,
                status: 'APPROVED',
                actionAt: now.toISOString(),
            },
            '审批已通过'
        );

    } catch (error) {
        log.error('审批操作错误', {}, error);
        return apiError('审批操作失败', 500);
    }
}
