import { NextRequest } from 'next/server';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile:tasks:install-photos');
import { db } from '@/shared/api/db';
import { installTasks, installPhotos } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound, apiForbidden } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/mobile/tasks/[id]/install-photos
 * 获取任务关联的照片
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const authResult = await authenticateMobile(request);
    if (!authResult.success) return authResult.response;

    const roleCheck = requireWorker(authResult.session);
    if (!roleCheck.allowed) return roleCheck.response;

    const { session } = authResult;
    const { id: taskId } = await params;

    try {
        const task = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, taskId),
                eq(installTasks.tenantId, session.tenantId)
            ),
            columns: { id: true, installerId: true }
        });

        if (!task) return apiNotFound('任务不存在');
        // 允许自己看，或者其他授权角色（目前主要是自己）
        if (task.installerId !== session.userId) return apiForbidden('无权访问此任务');

        const photos = await db.query.installPhotos.findMany({
            where: and(
                eq(installPhotos.installTaskId, taskId),
                eq(installPhotos.tenantId, session.tenantId)
            ),
            orderBy: [desc(installPhotos.createdAt)]
        });

        return apiSuccess(photos);
    } catch (error) {
        log.error('获取安装照片失败', { taskId, error: error instanceof Error ? error.message : String(error) }, error);
        return apiError('获取照片失败', 500);
    }
}

/**
 * POST /api/mobile/tasks/[id]/install-photos
 * 上传/绑定照片
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
        const { photoUrl, photoType, remark, roomName } = body;

        if (!photoUrl || !photoType) {
            return apiError('缺少照片URL或类型', 400);
        }

        if (!photoUrl.startsWith('http')) {
            return apiError('无效的照片 URL 格式', 400);
        }

        const VALID_PHOTO_TYPES = ['BEFORE', 'AFTER', 'DETAIL'];
        if (!VALID_PHOTO_TYPES.includes(photoType)) {
            return apiError('无效的照片类型', 400);
        }

        // Verify Task
        const task = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, taskId),
                eq(installTasks.tenantId, session.tenantId)
            ),
            columns: { id: true, status: true, installerId: true }
        });

        if (!task) return apiNotFound('任务不存在');
        if (task.installerId !== session.userId) return apiForbidden('无权操作此任务');

        // 状态允许：IN_PROGRESS 或 PENDING_CONFIRM (允许完工前补传)
        if (!['IN_PROGRESS', 'PENDING_CONFIRM'].includes(task.status)) {
            return apiError(`当前状态(${task.status})不允许上传照片`, 400);
        }

        const [newPhoto] = await db.insert(installPhotos).values({
            tenantId: session.tenantId,
            installTaskId: taskId,
            photoUrl,
            photoType, // BEFORE, AFTER, DETAIL
            roomName: roomName || null,
            remark: remark || null,
        }).returning();

        return apiSuccess(newPhoto);

    } catch (error) {
        log.error('上传安装照片记录失败', { taskId, error: error instanceof Error ? error.message : String(error) }, error);
        return apiError('上传照片记录失败', 500);
    }
}
