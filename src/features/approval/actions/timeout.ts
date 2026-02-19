'use server';

import { db } from '@/shared/api/db';
import { approvalTasks } from '@/shared/api/schema';
import { lte, and, eq } from 'drizzle-orm';
import { logger } from '@/shared/lib/logger';
import { type SystemSession } from '../schema';

/**
 * 处理超时的审批任务
 * Cron Job 定期调用此函数检查并处理超时任务
 */
export async function processTimeouts() {
    // Cron Job 系统级调用，处理所有租户的超时任务
    const now = new Date();

    // 查找所有超时的待处理任务 (跨租户)
    const overdueTasks = await db.query.approvalTasks.findMany({
        where: and(
            eq(approvalTasks.status, 'PENDING'),
            lte(approvalTasks.timeoutAt, now)
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

    if (overdueTasks.length === 0) return;

    logger.info(`[ApprovalTimeout] Found ${overdueTasks.length} overdue tasks.`);

    for (const task of overdueTasks) {
        try {
            await processTimeout(task);
        } catch (error) {
            logger.error(`[ApprovalTimeout] Failed to process task ${task.id}`, error);
        }
    }
}

async function processTimeout(task: {
    id: string;
    tenantId: string;
    approvalId: string;
    node?: {
        timeoutAction?: 'REMIND' | 'AUTO_PASS' | 'AUTO_REJECT' | 'ESCALATE' | null;
    } | null;
    approval: {
        entityType: string;
        entityId: string;
    };
    comment?: string | null;
}) {
    const timeoutAction = task.node?.timeoutAction || 'REMIND';

    // Check if task is still pending (double check inside loop)
    // Actually best to do inside transaction or optimistic lock, but here serialized processing is okay-ish for Cron.
    // We already queried PENDING.

    return db.transaction(async (tx) => {
        // P1-1: 修复 TOCTOU 竞态条件
        // 事务内重新验证任务状态，防止在查询后、进入事务前任务状态已被变更
        const freshTask = await tx.query.approvalTasks.findFirst({
            where: and(
                eq(approvalTasks.id, task.id),
                eq(approvalTasks.status, 'PENDING')
            )
        });

        if (!freshTask) {
            logger.warn(`[Approval-Timeout] Task ${task.id} already processed or status changed, skipping.`);
            return;
        }

        switch (timeoutAction) {
            case 'AUTO_PASS':
                // 1. 调用通用审批逻辑 (自动通过)
                // 动态导入避免循环依赖
                const { _processApprovalLogic } = await import('./processing');

                // 构造一个模拟 session 用于内部调用 (System User)
                const systemSession: SystemSession = {
                    user: { id: 'SYSTEM', tenantId: task.tenantId, name: 'System', role: 'ADMIN' },
                    expires: new Date(Date.now() + 3600000).toISOString()
                };

                await _processApprovalLogic(tx, {
                    taskId: task.id,
                    action: 'APPROVE',
                    comment: '超时自动通过'
                }, systemSession);
                break;

            case 'AUTO_REJECT':
                // 自动驳回：复用核心逻辑以确保一致性（处理 MAJORITY/ALL 模式及其它副作用）
                const { _processApprovalLogic: autoLogic } = await import("./processing");
                const autoSession: SystemSession = {
                    user: { id: 'SYSTEM', tenantId: task.tenantId, name: 'System', role: 'ADMIN' },
                    expires: new Date(Date.now() + 3600000).toISOString()
                };

                await autoLogic(tx, {
                    taskId: task.id,
                    action: 'REJECT',
                    comment: '超时自动驳回'
                }, autoSession);
                break;

            case 'ESCALATE':
            case 'REMIND':
            default:
                // 延长超时时间或仅记录
                await tx.update(approvalTasks)
                    .set({
                        timeoutAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 延长12小时
                        comment: task.comment ? `${task.comment}\n超时自动处理: ${timeoutAction}` : `超时自动处理: ${timeoutAction}`
                    })
                    .where(eq(approvalTasks.id, task.id));

                logger.info(`[ApprovalTimeout] Task ${task.id} action: ${timeoutAction}`);
                break;
        }
    });
}

/**
 * 手动运行超时检查（通常用于测试）
 * @returns 扫描并处理后的统计
 */
export async function checkTimeoutsManually() {
    return processTimeouts();
}
