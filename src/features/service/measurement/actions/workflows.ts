'use server';

import { db } from '@/shared/api/db';
import { measureTasks, measureSheets, measureItems } from '@/shared/api/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { measureSheetSchema, reviewMeasureTaskSchema } from '../schemas';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/lib/audit-service';

/**
 * 提交测量数据 (创建新的 Measure Sheet 和 Items)
 * 
 * 安全校验：只有被指派的测量师才能提交数据
 */
export async function submitMeasureData(input: z.infer<typeof measureSheetSchema>) {
    // 🔒 安全校验：获取当前用户身份
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        return { success: false, error: '未授权访问' };
    }
    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    const data = measureSheetSchema.parse(input);

    // 🔒 安全校验：验证任务归属并检查执行者权限
    const task = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, data.taskId),
            eq(measureTasks.tenantId, tenantId)
        ),
        columns: { id: true, assignedWorkerId: true, status: true }
    });

    if (!task) {
        return { success: false, error: '任务不存在或无权访问' };
    }

    // 只有被指派的测量师才能提交数据
    if (task.assignedWorkerId !== userId) {
        return { success: false, error: '只有被指派的测量师才能提交测量数据' };
    }

    // 🔒 状态校验 (R2-SEC-01)
    // 允许提交的状态：PENDING_VISIT (待上门/测量中), PENDING_CONFIRM (驳回修改/补充)
    // 禁止提交的状态：COMPLETED (已完成), CANCELLED (已取消), PENDING (待分配), DISPATCHING (派单中), PENDING_APPROVAL (待审批)
    const allowSubmitStatus = ['PENDING_VISIT', 'PENDING_CONFIRM'];
    if (!allowSubmitStatus.includes(task.status || '')) {
        return { success: false, error: `当前任务状态(${task.status})不允许提交测量数据` };
    }

    return await db.transaction(async (tx) => {
        // 1. 创建测量单
        const [sheet] = await tx.insert(measureSheets).values({
            tenantId,
            taskId: data.taskId,
            round: data.round,
            variant: data.variant,
            sitePhotos: data.sitePhotos,
            sketchMap: data.sketchMap,
            status: 'SUBMITTED', // 提交后为 SUBMITTED，等待审核
        }).returning();

        // 2. 创建明细
        if (data.items.length > 0) {
            await tx.insert(measureItems).values(
                data.items.map(item => ({
                    ...item,
                    tenantId,
                    sheetId: sheet.id,
                    width: item.width.toString(),
                    height: item.height.toString(),
                    bracketDist: item.bracketDist?.toString(),
                    boxDepth: item.boxDepth?.toString(),
                }))
            );
        }

        // 3. 更新任务状态为 PENDING_CONFIRM
        await tx.update(measureTasks)
            .set({ status: 'PENDING_CONFIRM' })
            .where(eq(measureTasks.id, data.taskId));

        return sheet;
    }).then(async (res) => {
        await AuditService.record(
            {
                tenantId: tenantId,
                userId: userId,
                tableName: 'measure_sheets',
                recordId: res.id,
                action: 'CREATE',
                newValues: {
                    taskId: data.taskId,
                    round: data.round,
                    variant: data.variant,
                    status: 'SUBMITTED',
                    itemCount: data.items.length,
                }
            }
        );

        revalidateTag('measure-task');
        revalidatePath('/service/measurement');
        revalidatePath(`/service/measurement/${data.taskId}`);
        return { success: true, data: res };
    });
}

/**
 * 审核测量任务 (确认完成或驳回)
 * 
 * 安全校验：只有销售/管理员才能审核
 */
export async function reviewMeasureTask(input: z.infer<typeof reviewMeasureTaskSchema>) {
    // 🔒 安全校验：获取当前用户身份
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        return { success: false, error: '未授权访问' };
    }
    const tenantId = session.user.tenantId;

    const { id, action, reason } = reviewMeasureTaskSchema.parse(input);

    // 🔒 安全校验：验证任务归属当前租户
    const task = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, id),
            eq(measureTasks.tenantId, tenantId)
        ),
        columns: { id: true, status: true }
    });

    if (!task) {
        return { success: false, error: '任务不存在或无权访问' };
    }

    // 角色校验：仅允许销售/管理员审核
    const allowedRoles = ['admin', 'sales', 'store_manager'];
    if (!session.user.roles?.some(r => allowedRoles.includes(r))) {
        throw new Error('无权限执行审核操作');
    }

    return await db.transaction(async (tx) => {
        if (action === 'APPROVE') {
            await tx.update(measureTasks)
                .set({
                    status: 'COMPLETED',
                    completedAt: new Date(),
                })
                .where(and(
                    eq(measureTasks.id, id),
                    eq(measureTasks.tenantId, tenantId)
                ));

            // P1 修复：联动更新 MeasureSheet 状态为 CONFIRMED
            await tx.update(measureSheets)
                .set({ status: 'CONFIRMED', updatedAt: new Date() })
                .where(and(
                    eq(measureSheets.taskId, id),
                    eq(measureSheets.status, 'SUBMITTED'), // 仅确认已提交的
                    eq(measureSheets.tenantId, tenantId)
                ));

        } else {
            // 驳回逻辑
            await tx.update(measureTasks)
                .set({
                    status: 'PENDING_VISIT', // 驳回至待上门
                    rejectCount: sql`${measureTasks.rejectCount} + 1`,
                    rejectReason: reason,
                })
                .where(and(
                    eq(measureTasks.id, id),
                    eq(measureTasks.tenantId, tenantId)
                ));

            // 将关联的最新 Measure Sheet 标记为 DRAFT（由师傅重新提交）
            await tx.update(measureSheets)
                .set({ status: 'DRAFT', updatedAt: new Date() })
                .where(and(
                    eq(measureSheets.taskId, id),
                    eq(measureSheets.status, 'SUBMITTED'),
                    eq(measureSheets.tenantId, tenantId)
                ));
        }
        return { success: true };
    }).then(async () => {
        await AuditService.recordFromSession(
            session,
            'measure_tasks',
            id,
            'UPDATE',
            {
                changed: {
                    action: action,
                    reason: reason,
                    status: action === 'APPROVE' ? 'COMPLETED' : 'PENDING_VISIT',
                }
            }
        );

        revalidateTag('measure-task');
        revalidatePath('/service/measurement');
        revalidatePath(`/service/measurement/${id}`);
        return { success: true };
    });
}

/**
 * 生成新的测量方案 (Variant) 或轮次 (Round)
 * 允许在现有测量基础上创建差异化版本或重新测量
 * @param taskId - 测量任务 ID
 * @param type - ROUND(新轮次) 或 VARIANT(新方案)
 */
export async function createNewMeasureVersion(taskId: string, type: 'ROUND' | 'VARIANT') {
    // 🔒 安全校验：获取当前用户身份
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('未授权访问');
    }
    const tenantId = session.user.tenantId;

    // 🔒 安全校验：验证任务归属当前租户
    const task = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, taskId),
            eq(measureTasks.tenantId, tenantId)
        ),
        columns: { id: true, assignedWorkerId: true, round: true }
    });

    if (!task) throw new Error('任务不存在或无权访问');

    // 🔒 权限校验 (R2-BL-01)
    // 允许：指派的测量师、管理员、销售、店长
    const userId = session.user.id;
    const userRoles = session.user.roles || [];
    const isAssignedWorker = task.assignedWorkerId === userId;
    const hasManagePermission = userRoles.some(r => ['admin', 'sales', 'store_manager'].includes(r));

    if (!isAssignedWorker && !hasManagePermission) {
        throw new Error('无权限创建新版本');
    }

    let newRound = task.round;
    if (type === 'ROUND') {
        newRound += 1;
        await db.update(measureTasks).set({ round: newRound }).where(eq(measureTasks.id, taskId));
        return { success: true, round: newRound, variant: 'A' };
    }

    // type === 'VARIANT'
    // 查询当前轮次下的所有方案，找到最大的 variant
    const existingSheets = await db.query.measureSheets.findMany({
        where: and(
            eq(measureSheets.taskId, taskId),
            eq(measureSheets.round, newRound),
            eq(measureSheets.tenantId, tenantId)
        ),
        columns: { variant: true }
    });

    let newVariant = 'A';
    if (existingSheets.length > 0) {
        // 找到最大的 variant (这里假设是单字母 A-Z)
        const variants = existingSheets.map(s => s.variant).filter(Boolean) as string[];
        if (variants.length > 0) {
            variants.sort();
            const lastVariant = variants[variants.length - 1];
            // 简单的字符递增逻辑: A -> B, B -> C
            const lastCharCode = lastVariant.charCodeAt(0);
            newVariant = String.fromCharCode(lastCharCode + 1);

            // 🛡️ Variant 溢出保护 (R2-CQ-02)
            // 如果超出 'Z' (Z 的 charCode 是 90)，暂不支持双字母
            if (newVariant > 'Z') {
                throw new Error('版本号超出限制(Z)，无法创建新方案');
            }
        }
    }

    // 审计日志: 记录新版本生成
    await AuditService.recordFromSession(
        session,
        'measure_tasks',
        taskId,
        'UPDATE',
        {
            changed: {
                newRound: newRound,
                newVariant: newVariant,
                type: type,
            }
        }
    );

    revalidateTag('measure-task');
    revalidatePath(`/service/measurement/${taskId}`);
    return { success: true, round: newRound, variant: newVariant };
}
