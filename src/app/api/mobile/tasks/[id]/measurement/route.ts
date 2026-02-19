/**
 * 工人端 - 提交测量数据 API
 * POST /api/mobile/tasks/:id/measurement
 * 
 * 支持多方案测量数据提交
 */

import { NextRequest } from 'next/server';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile:tasks:measurement');
import { db } from '@/shared/api/db';
import { measureTasks, measureSheets, measureItems } from '@/shared/api/schema';
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

    const { plans } = body as MeasurementBody;

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
            eq(measureTasks.tenantId, session.tenantId),
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

    // 7. 保存测量数据
    await db.transaction(async (tx) => {
        // 创建测量单 (Snapshot)
        const [sheet] = await tx.insert(measureSheets).values({
            tenantId: session.tenantId,
            taskId: taskId,
            round: 1, // 默认为第1轮
            variant: 'A', // 默认方案A
            sitePhotos: [], // 暂不支持上传
            status: 'DRAFT',
            createdAt: now,
            updatedAt: now,
        }).returning();

        // 插入测量项
        if (plans.length > 0) {
            const itemsToInsert = plans.flatMap(plan =>
                plan.items.map(item => ({
                    tenantId: session.tenantId,
                    sheetId: sheet.id,
                    roomName: item.roomName,
                    windowType: item.windowType,
                    width: item.width.toString(),
                    height: item.height.toString(),
                    installType: item.installType,
                    bracketDist: item.bracketDist?.toString(),
                    wallMaterial: item.wallMaterial as any,
                    hasBox: item.hasBox || false,
                    boxDepth: item.boxDepth?.toString(),
                    isElectric: item.isElectric || false,
                    remark: item.remark || plan.planName, // 将方案名作为备注的一部分
                }))
            );

            if (itemsToInsert.length > 0) {
                await tx.insert(measureItems).values(itemsToInsert);
            }
        }

        // 更新任务状态
        await tx.update(measureTasks)
            .set({
                status: 'PENDING_CONFIRM', // type safety handled by drizzle infer
                updatedAt: now,
            })
            .where(and(
                eq(measureTasks.id, taskId),
                eq(measureTasks.tenantId, session.tenantId)
            ));
    });

    // 统计信息
    const totalItems = plans.reduce((sum, plan) => sum + plan.items.length, 0);

    log.warn('测量数据提交', { taskId, planCount: plans.length, itemCount: totalItems });

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
