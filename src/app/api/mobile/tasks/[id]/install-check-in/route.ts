
import { NextRequest } from 'next/server';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile:tasks:install-check-in');
import { db } from '@/shared/api/db';
import { installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';
import { AuditService } from '@/shared/services/audit-service';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/mobile/tasks/[id]/install-check-in
 * 工人安装签到
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    let taskId: string | undefined;
    try {
        // 1. 认证检查
        const authResult = await authenticateMobile(request);
        if (!authResult.success) return authResult.response;

        const roleCheck = requireWorker(authResult.session);
        if (!roleCheck.allowed) return roleCheck.response;

        const { session } = authResult;
        const { id } = await params;
        taskId = id;

        // 2. 获取并校验请求体
        const body = await request.json();
        const { latitude, longitude, accuracy, address } = body;

        if (!latitude || !longitude) {
            return apiError('缺少 GPS 位置信息', 400);
        }

        // 3. 查任务 & 权限状态校验
        const task = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, taskId),
                eq(installTasks.tenantId, session.tenantId)
            ),
            columns: {
                id: true,
                status: true,
                installerId: true,
            }
        });

        if (!task) {
            return apiError('任务不存在', 404);
        }

        // 只能签到自己的任务
        if (task.installerId !== session.userId) {
            return apiError('只能签到指派给您的任务', 403);
        }

        // 状态校验：必须是 PENDING_VISIT (待上门)
        // 允许 IN_PROGRESS 补签? 通常第一次签到转为 IN_PROGRESS。暂定严格校验 PENDING_VISIT。
        if (task.status !== 'PENDING_VISIT') {
            return apiError(`当前状态(${task.status})不可签到，需为待上门状态`, 400);
        }

        // 4. 执行签到更新
        // 签到后状态流转为 IN_PROGRESS (施工中)
        // 记录 checkInAt, checkInLocation, status, actualStartAt
        const now = new Date();

        await db.update(installTasks)
            .set({
                status: 'IN_PROGRESS',
                checkInAt: now,
                checkInLocation: {
                    latitude,
                    longitude,
                    accuracy,
                    address
                },
                actualStartAt: now, // 开始施工时间默认为签到时间
                updatedAt: now,
            })
            .where(and(eq(installTasks.id, taskId), eq(installTasks.tenantId, session.tenantId)));

        // 5. 记录审计日志
        await AuditService.log(db, {
            tableName: 'install_tasks',
            recordId: taskId,
            action: 'INSTALL_CHECK_IN_MOBILE',
            userId: session.userId,
            tenantId: session.tenantId,
            details: { latitude, longitude, accuracy, address },
            traceId: session.traceId,
            userAgent: session.userAgent,
            ipAddress: session.ipAddress,
        });

        return apiSuccess({
            success: true,
            message: '签到成功',
            status: 'IN_PROGRESS',
            time: now
        });

    } catch (error) {
        log.error('Install Check-in Error', { taskId, error: error instanceof Error ? error.message : String(error) }, error);
        return apiError('签到失败', 500);
    }
}
