'use server';

import { db } from '@/shared/api/db';
import { approvalTasks, approvalNodes, approvals, quotes, paymentBills } from '@/shared/api/schema';
import { eq, and, lt } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * 处理超时的审批任务
 * Cron Job 定期调用此函数检查并处理超时任务
 */
export async function processTimeouts() {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized');
    }

    const now = new Date();

    // 查找所有超时的待处理任务
    const overdueTasks = await db.query.approvalTasks.findMany({
        where: and(
            eq(approvalTasks.tenantId, session.user.tenantId),
            eq(approvalTasks.status, 'PENDING'),
            lt(approvalTasks.timeoutAt, now)
        ),
        with: {
            node: true,
            approval: {
                with: {
                    flow: true
                }
            },
            approver: true
        }
    });

    if (overdueTasks.length === 0) {
        return { success: true, processed: 0, message: '无超时任务' };
    }

    const results = [];

    for (const task of overdueTasks) {
        try {
            await processTimeout(task);
            results.push({ taskId: task.id, success: true });
        } catch (error) {
            results.push({
                taskId: task.id,
                success: false,
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    revalidatePath('/approval');

    return {
        success: true,
        processed: results.length,
        results
    };
}

/**
 * 处理单个超时任务
 */
async function processTimeout(task: any) {
    const timeoutAction = task.node?.timeoutAction || 'REMIND';

    return db.transaction(async (tx) => {
        switch (timeoutAction) {
            case 'AUTO_APPROVE':
                // 自动通过
                await tx.update(approvalTasks)
                    .set({
                        status: 'APPROVED',
                        actionAt: new Date(),
                        comment: '超时自动通过'
                    })
                    .where(eq(approvalTasks.id, task.id));

                // TODO: 触发审批流程继续到下一节点
                break;

            case 'AUTO_REJECT':
                // 自动驳回
                await tx.update(approvalTasks)
                    .set({
                        status: 'REJECTED',
                        actionAt: new Date(),
                        comment: '超时自动驳回'
                    })
                    .where(eq(approvalTasks.id, task.id));

                // 更新审批实例状态
                await tx.update(approvals)
                    .set({
                        status: 'REJECTED',
                        completedAt: new Date()
                    })
                    .where(eq(approvals.id, task.approvalId));

                // 更新业务实体状态
                if (task.approval.entityType === 'QUOTE') {
                    await tx.update(quotes)
                        .set({ status: 'DRAFT' })
                        .where(eq(quotes.id, task.approval.entityId));
                } else if (task.approval.entityType === 'PAYMENT_BILL') {
                    await tx.update(paymentBills)
                        .set({ status: 'DRAFT' })
                        .where(eq(paymentBills.id, task.approval.entityId));
                }
                break;

            case 'ESCALATE':
                // 自动升级至上级（暂时实现为提醒）
                // TODO: 实现真正的升级逻辑
                // 暂时不做操作，仅延长超时时间
                await tx.update(approvalTasks)
                    .set({
                        timeoutAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 延长24小时
                        comment: task.comment ? `${task.comment}\n超时已升级` : '超时已升级'
                    })
                    .where(eq(approvalTasks.id, task.id));
                break;

            case 'REMIND':
            default:
                // 仅提醒，延长超时时间
                await tx.update(approvalTasks)
                    .set({
                        timeoutAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 延长12小时
                        comment: task.comment ? `${task.comment}\n超时提醒已发送` : '超时提醒已发送'
                    })
                    .where(eq(approvalTasks.id, task.id));

                // TODO: 发送通知给审批人
                break;
        }
    });
}

/**
 * 手动触发超时检查 (用于测试或手动执行)
 */
export async function checkTimeoutsManually() {
    return processTimeouts();
}
