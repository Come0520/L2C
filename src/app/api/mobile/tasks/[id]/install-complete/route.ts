
import { NextRequest } from 'next/server';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile:tasks:install-complete');
import { db } from '@/shared/api/db';
import { installTasks, installPhotos } from '@/shared/api/schema';
import { eq, and, count } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound, apiForbidden } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';
import { AuditService } from '@/shared/services/audit-service';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/mobile/tasks/[id]/install-complete
 * 工人提交安装完工
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
        const { latitude, longitude, accuracy, address, customerSignatureUrl } = body;

        // 1. Verify GPS (Check-out location)
        if (!latitude || !longitude) {
            return apiError('缺少完工位置信息(GPS)', 400);
        }

        // 2. Verify Task
        const task = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, taskId),
                eq(installTasks.tenantId, session.tenantId)
            ),
            columns: { id: true, status: true, installerId: true }
        });

        if (!task) return apiNotFound('任务不存在');
        if (task.installerId !== session.userId) return apiForbidden('无权操作此任务');

        // 状态校验：必须是 IN_PROGRESS
        if (task.status !== 'IN_PROGRESS') {
            return apiError(`当前状态(${task.status})不可提交完工`, 400);
        }

        // 3. Verify Photos (At least one)
        const [photoCount] = await db
            .select({ count: count() })
            .from(installPhotos)
            .where(eq(installPhotos.installTaskId, taskId));

        if (photoCount.count === 0) {
            return apiError('请至少上传一张安装照片', 400);
        }

        // 4. Update Task -> PENDING_CONFIRM
        const now = new Date();

        await db.update(installTasks)
            .set({
                status: 'PENDING_CONFIRM',
                checkOutAt: now,
                checkOutLocation: { latitude, longitude, accuracy, address },
                customerSignatureUrl: customerSignatureUrl || null,
                actualEndAt: now,
                updatedAt: now,
            })
            .where(eq(installTasks.id, taskId));

        // 5. 记录审计日志
        await AuditService.log(db, {
            tableName: 'install_tasks',
            recordId: taskId,
            action: 'INSTALL_COMPLETE_MOBILE',
            userId: session.userId,
            tenantId: session.tenantId,
            details: { latitude, longitude, accuracy, address, photoCount: photoCount.count },
            traceId: session.traceId,
            userAgent: session.userAgent,
            ipAddress: session.ipAddress,
        });

        return apiSuccess({
            success: true,
            message: '完工提交成功，等待确认',
            status: 'PENDING_CONFIRM',
            time: now
        });

    } catch (error) {
        log.error('Install Complete Error', { taskId, error: error instanceof Error ? error.message : String(error) }, error);
        return apiError('提交完工失败', 500);
    }
}
