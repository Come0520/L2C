/**
 * 工人端 - 上传媒体 API
 * POST /api/mobile/tasks/:id/media
 * 
 * 支持上传照片、视频、语音
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks, installPhotos, measureSheets } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
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

interface SitePhoto {
    id: string;
    url: string;
    category: string;
    roomName: string;
    remark: string;
    type: 'photo' | 'video' | 'audio';
    duration: number;
    uploadedBy: string | null;
    uploadedAt: string;
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

    // 6. 构建媒体记录并存储
    const now = new Date();
    let mediaId = crypto.randomUUID();

    if (taskType === 'install') {
        // 安装任务：存入 install_photos 表
        // 映射类型
        let photoType: 'BEFORE' | 'AFTER' | 'DETAIL' = 'DETAIL';
        if (category === 'before') photoType = 'BEFORE';
        else if (category === 'after') photoType = 'AFTER';

        // environment 映射为 DETAIL，并在备注中说明
        let finalRemark = remark;
        if (category === 'environment') {
            finalRemark = remark ? `[环境] ${remark}` : '[环境]';
        }

        const [inserted] = await db.insert(installPhotos).values({
            tenantId: session.tenantId,
            installTaskId: taskId,
            photoType,
            photoUrl: url,
            roomName: roomName || null,
            remark: finalRemark || null,
            createdAt: now
        }).returning({ id: installPhotos.id });

        mediaId = inserted.id;

    } else {
        // 测量任务：更新 measure_sheets 的 site_photos 字段
        // 1. 找到关联的测量单 (通常取最新的一个)
        const sheet = await db.query.measureSheets.findFirst({
            where: eq(measureSheets.taskId, taskId),
            orderBy: [desc(measureSheets.createdAt)]
        });

        if (!sheet) {
            // 如果没有测量单，这通常是个异常情况，或者需要自动创建一个 Draft
            // 这里为了稳健性，如果找不到 sheet，暂时返回错误，提示先创建测量单（或开始测量）
            return apiError('未找到关联的测量单，无法上传照片', 404);
        }

        // 2. 更新 site_photos
        // site_photos 结构约定: Array<{ url, category, roomName, remark, uploadedAt }>
        const newPhoto = {
            id: mediaId,
            url,
            category: category || 'detail',
            roomName: roomName || '',
            remark: remark || '',
            type: type, // photo/video/audio
            duration: duration || 0,
            uploadedBy: session.userId,
            uploadedAt: now.toISOString()
        };

        const currentPhotos = Array.isArray(sheet.sitePhotos) ? sheet.sitePhotos as SitePhoto[] : [];
        const updatedPhotos = [...currentPhotos, newPhoto];

        await db.update(measureSheets)
            .set({
                sitePhotos: updatedPhotos,
                updatedAt: now
            })
            .where(eq(measureSheets.id, sheet.id));
    }

    console.log(`[媒体上传] 任务 ${taskId}, 类型: ${taskType}, ID: ${mediaId}`);

    return apiSuccess(
        {
            mediaId,
            taskId,
            taskType,
            url,
            category,
            uploadedAt: now.toISOString(),
        },
        '媒体上传成功'
    );
}
