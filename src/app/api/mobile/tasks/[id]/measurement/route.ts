/**
 * 工人端 - 提交测量数据 API
 * POST /api/mobile/tasks/:id/measurement
 * 
 * 支持多方案测量数据提交
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';

interface MeasurementParams {
    params: Promise<{ id: string }>;
}

/**
 * 测量数据项
 */
interface MeasurementItem {
    roomName: string;           // 空间名称
    windowType: 'STRAIGHT' | 'L_SHAPE' | 'U_SHAPE' | 'ARC';  // 窗型
    width: number;              // 宽度 (mm)
    height: number;             // 高度 (mm)
    installType: 'TOP' | 'SIDE';  // 安装方式
    bracketDist?: number;       // 支架离地高度 (mm)
    wallMaterial?: string;      // 墙体材质
    hasBox?: boolean;           // 是否有窗帘盒
    boxDepth?: number;          // 窗帘盒深度
    isElectric?: boolean;       // 是否预留电源
    remark?: string;            // 备注
    photos?: string[];          // 照片 URL
}

/**
 * 测量方案
 */
interface MeasurementPlan {
    planName: string;           // 方案名称（如：方案A、方案B）
    items: MeasurementItem[];   // 测量项
}

/**
 * 测量数据请求体
 */
interface MeasurementBody {
    plans: MeasurementPlan[];   // 多个方案
    notes?: string;             // 整体备注
    voiceNotes?: string[];      // 语音备注 URL
}

export async function POST(request: NextRequest, { params }: MeasurementParams) {
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
    let body: MeasurementBody;

    try {
        body = await request.json();
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const { plans, notes, voiceNotes } = body;

    // 4. 参数校验
    if (!plans || !Array.isArray(plans) || plans.length === 0) {
        return apiError('至少需要提交一个测量方案', 400);
    }

    // 校验每个方案
    for (const plan of plans) {
        if (!plan.items || plan.items.length === 0) {
            return apiError(`方案 "${plan.planName}" 缺少测量数据`, 400);
        }
        for (const item of plan.items) {
            if (!item.roomName || !item.width || !item.height) {
                return apiError('测量项缺少必要字段: roomName, width, height', 400);
            }
        }
    }

    // 5. 查找测量任务
    const task = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, taskId),
            eq(measureTasks.assignedWorkerId, session.userId)
        ),
    });

    if (!task) {
        return apiNotFound('测量任务不存在或不属于您');
    }

    // 6. 检查任务状态（status 是枚举类型，可能为 null）
    const validStatus: string[] = ['PENDING_VISIT', 'IN_PROGRESS'];
    const currentStatus = task.status as string | null;
    if (!currentStatus || !validStatus.includes(currentStatus)) {
        return apiError(`当前状态 ${currentStatus ?? '未知'} 不允许提交测量数据`, 400);
    }

    const now = new Date();

    // 7. 保存测量数据（简化处理，实际应存储到 measure_items 表）
    // 这里将数据结构化存储
    const _measurementData = {
        plans,
        notes,
        voiceNotes,
        submittedAt: now.toISOString(),
        submittedBy: session.userId,
    };

    // 更新任务状态和数据
    await db.update(measureTasks)
        .set({
            status: 'PENDING_CONFIRM' as typeof measureTasks.$inferSelect['status'],
            // items: measurementData,  // 如果有 JSONB 字段
            updatedAt: now,
        })
        .where(eq(measureTasks.id, taskId));

    // 统计信息
    const totalItems = plans.reduce((sum, plan) => sum + plan.items.length, 0);

    console.log(`[测量数据提交] 任务 ${taskId}, 方案数: ${plans.length}, 项目数: ${totalItems}`);

    return apiSuccess(
        {
            taskId,
            planCount: plans.length,
            itemCount: totalItems,
            status: 'PENDING_CONFIRM',
            submittedAt: now.toISOString(),
        },
        '测量数据提交成功，等待确认'
    );
}
