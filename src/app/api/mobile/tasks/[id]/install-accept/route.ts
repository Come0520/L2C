
import { NextRequest } from 'next/server';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile:tasks:install-accept');
import { db } from '@/shared/api/db';
import { installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound, apiForbidden } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';
import { AuditService } from '@/shared/services/audit-service';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/mobile/tasks/[id]/install-accept
 * 工人接单/拒单
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    const authResult = await authenticateMobile(request);
    if (!authResult.success) return authResult.response;

    const roleCheck = requireWorker(authResult.session);
    if (!roleCheck.allowed) return roleCheck.response;

    const { session } = authResult;
    const { id: taskId } = await params;

    try {
        const body = await request.json();
        const { action, reason: _reason } = body;

        if (!['accept', 'reject'].includes(action)) {
            return apiError('无效的操作类型', 400);
        }

        const task = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, taskId),
                eq(installTasks.tenantId, session.tenantId)
            ),
            columns: { id: true, status: true, installerId: true }
        });

        if (!task) return apiNotFound('任务不存在');
        if (task.installerId !== session.userId) return apiForbidden('无权操作此任务');

        // 状态校验：必须是 PENDING_ACCEPT
        if (task.status !== 'PENDING_ACCEPT') {
            return apiError(`当前状态(${task.status})无法进行接单/拒单操作`, 400);
        }

        const now = new Date();

        if (action === 'accept') {
            // 接受 -> PENDING_VISIT
            await db.update(installTasks)
                .set({
                    status: 'PENDING_VISIT',
                    updatedAt: now,
                })
                .where(eq(installTasks.id, taskId));

            // 记录审计日志
            await AuditService.log(db, {
                tableName: 'install_tasks',
                recordId: taskId,
                action: 'ACCEPT_TASK_MOBILE',
                userId: session.userId,
                tenantId: session.tenantId,
                details: { action, taskType: 'install' },
                traceId: session.traceId,
                userAgent: session.userAgent,
                ipAddress: session.ipAddress,
            });

            return apiSuccess({
                success: true,
                message: '已接单，请按时上门',
                status: 'PENDING_VISIT'
            });
        } else {
            // 拒绝 -> PENDING_DISPATCH (重置状态，清空 installerId?)
            // 如果清空 installerId，下次该工人就看不到了。
            // 这里逻辑：退回调度池，清空 installerId。
            await db.update(installTasks)
                .set({
                    status: 'PENDING_DISPATCH',
                    installerId: null, // 清空指派
                    // 记录拒绝原因? Schema 中可能有 remark 或 log 表。
                    // 暂时只重置。
                    updatedAt: now,
                })
                .where(eq(installTasks.id, taskId));

            // 记录审计日志
            await AuditService.log(db, {
                tableName: 'install_tasks',
                recordId: taskId,
                action: 'REJECT_TASK_MOBILE',
                userId: session.userId,
                tenantId: session.tenantId,
                details: { action, reason: _reason, taskType: 'install' },
                traceId: session.traceId,
                userAgent: session.userAgent,
                ipAddress: session.ipAddress,
            });

            return apiSuccess({
                success: true,
                message: '已拒绝接单',
                status: 'PENDING_DISPATCH'
            });
        }

    } catch (error) {
        log.error('Install Accept/Reject Error', { taskId, error: error instanceof Error ? error.message : String(error) }, error);
        return apiError('操作失败', 500);
    }
}
