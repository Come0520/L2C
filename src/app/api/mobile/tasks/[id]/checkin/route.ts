/**
 * 工人端 - GPS 打卡 API
 * POST /api/mobile/tasks/:id/checkin
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';

interface CheckinParams {
    params: Promise<{ id: string }>;
}

/**
 * GPS 打卡请求体
 */
interface CheckinBody {
    latitude: number;      // 纬度
    longitude: number;     // 经度
    address?: string;      // 地址（可选）
    accuracy?: number;      // 精度（米）
    type?: 'in' | 'out';   // 打卡类型：签到/签退
}

export async function POST(request: NextRequest, { params }: CheckinParams) {
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
    let body: CheckinBody;

    try {
        body = await request.json();
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const { latitude, longitude, address, accuracy, type = 'in' } = body;

    // 4. 参数校验
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return apiError('缺少有效的经纬度信息', 400);
    }

    // 5. 查找任务
    let taskType: 'measure' | 'install' = 'measure';
    let taskFound = false;

    const measureTask = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, taskId),
            eq(measureTasks.assignedWorkerId, session.userId)
        ),
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
        });
        if (installTask) {
            taskFound = true;
        }
    }

    if (!taskFound) {
        return apiNotFound('任务不存在或不属于您');
    }

    // 6. 构建位置数据
    const locationData = {
        latitude,
        longitude,
        address: address || '',
        accuracy: accuracy || 0,
        timestamp: new Date().toISOString(),
    };

    const now = new Date();

    // 7. 更新打卡信息
    if (taskType === 'measure') {
        await db.update(measureTasks)
            .set({
                status: type === 'in' ? 'IN_PROGRESS' as typeof measureTasks.$inferSelect['status'] : undefined,
                updatedAt: now,
            })
            .where(eq(measureTasks.id, taskId));
    } else {
        await db.update(installTasks)
            .set({
                checkInAt: type === 'in' ? now : undefined,
                checkOutAt: type === 'out' ? now : undefined,
                actualStartAt: type === 'in' ? now : undefined,
                actualEndAt: type === 'out' ? now : undefined,
                updatedAt: now,
            })
            .where(eq(installTasks.id, taskId));
    }

    return apiSuccess(
        {
            taskId,
            taskType,
            checkinType: type,
            location: locationData,
            checkinAt: now.toISOString(),
        },
        type === 'in' ? '签到成功' : '签退成功'
    );
}
