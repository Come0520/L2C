/**
 * 工人端 - 上传媒体 API
 * POST /api/mobile/tasks/:id/media
 * 
 * 支持上传照片、视频、语音
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';

interface MediaParams {
    params: Promise<{ id: string }>;
}

/**
 * 媒体上传请求体
 */
interface MediaBody {
    type: 'photo' | 'video' | 'audio';  // 媒体类型
    url: string;                         // OSS URL
    category?: 'before' | 'after' | 'detail' | 'environment';  // 分类
    roomName?: string;                   // 关联空间
    remark?: string;                     // 备注
    duration?: number;                   // 视频/语音时长（秒）
}

export async function POST(request: NextRequest, { params }: MediaParams) {
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
    let body: MediaBody;

    try {
        body = await request.json();
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const { type, url, category, roomName, remark, duration } = body;

    // 4. 参数校验
    if (!type || !url) {
        return apiError('缺少必要参数: type 和 url', 400);
    }

    if (!['photo', 'video', 'audio'].includes(type)) {
        return apiError('无效的媒体类型', 400);
    }

    // 5. 查找任务
    let taskType: 'measure' | 'install' = 'measure';
    let taskFound = false;

    const measureTask = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, taskId),
            eq(measureTasks.assignedWorkerId, session.userId)
        ),
        columns: { id: true }
    });

    if (measureTask) {
        taskFound = true;
    } else {
        taskType = 'install';
        const installTask = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, taskId),
                eq(installTasks.installerId, session.userId)
            ),
            columns: { id: true }
        });
        if (installTask) {
            taskFound = true;
        }
    }

    if (!taskFound) {
        return apiNotFound('任务不存在或不属于您');
    }

    // 6. 构建媒体记录
    const mediaRecord = {
        id: crypto.randomUUID(),
        taskId,
        taskType,
        type,
        url,
        category: category || 'detail',
        roomName: roomName || '',
        remark: remark || '',
        duration: duration || 0,
        uploadedBy: session.userId,
        uploadedAt: new Date().toISOString(),
    };

    // 7. 更新任务媒体列表（实际应存储到专门的媒体表）
    // 这里简化处理，仅记录日志
    console.log(`[媒体上传] 任务 ${taskId}, 类型: ${type}, URL: ${url}`);

    // 实际实现中应该：
    // - 存储到 task_media 表
    // - 或更新任务的 site_photos JSONB 字段

    return apiSuccess(
        {
            mediaId: mediaRecord.id,
            taskId,
            type: mediaRecord.type,
            url: mediaRecord.url,
            category: mediaRecord.category,
            uploadedAt: mediaRecord.uploadedAt,
        },
        '媒体上传成功'
    );
}
