'use server';

import { db } from "@/shared/api/db";
import {
    approvals,
    approvalTasks,
    approvalFlows
} from "@/shared/api/schema";
import { eq, and, desc } from "drizzle-orm";
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

// Schema 定义
const emptySchema = z.object({});
const getApprovalDetailsSchema = z.object({
    id: z.string().uuid(),
});

// createSafeAction 内部实现
const getPendingApprovalsInternal = createSafeAction(emptySchema, async (_params, { session }) => {
    try {
        const tasks = await db.query.approvalTasks.findMany({
            where: and(
                eq(approvalTasks.tenantId, session.user.tenantId),
                eq(approvalTasks.approverId, session.user.id),
                eq(approvalTasks.status, 'PENDING')
            ),
            with: {
                approval: {
                    with: {
                        flow: true
                    }
                },
                node: true
            },
            orderBy: [desc(approvalTasks.createdAt)]
        });
        return { success: true, data: tasks };
    } catch (e: unknown) {
        const { logger } = await import('@/shared/lib/logger');
        const message = e instanceof Error ? e.message : String(e);
        logger.error("getPendingApprovals error", { error: e, message });
        return { success: false, error: message };
    }
});

const getApprovalHistoryInternal = createSafeAction(emptySchema, async (_params, { session }) => {
    try {
        const myApprovals = await db.query.approvals.findMany({
            where: and(
                eq(approvals.tenantId, session.user.tenantId),
                eq(approvals.requesterId, session.user.id)
            ),
            with: {
                flow: true,
            },
            orderBy: [desc(approvals.createdAt)]
        });
        return { success: true, data: myApprovals };
    } catch (e: unknown) {
        const { logger } = await import('@/shared/lib/logger');
        const message = e instanceof Error ? e.message : String(e);
        logger.error("getApprovalHistory error", { error: e, message });
        return { success: false, error: message };
    }
});

const getApprovalDetailsInternal = createSafeAction(getApprovalDetailsSchema, async (params, { session }) => {
    try {
        const approval = await db.query.approvals.findFirst({
            where: and(
                eq(approvals.id, params.id),
                eq(approvals.tenantId, session.user.tenantId)
            ),
            with: {
                flow: true,
            }
        });

        if (!approval) return { success: false, error: "Not found" };

        const tasks = await db.query.approvalTasks.findMany({
            where: and(
                eq(approvalTasks.approvalId, params.id),
                eq(approvalTasks.tenantId, session.user.tenantId)
            ),
            with: {
                node: true,
            },
            orderBy: [desc(approvalTasks.createdAt)]
        });

        return { success: true, data: { approval, tasks } };
    } catch (e: unknown) {
        const { logger } = await import('@/shared/lib/logger');
        const message = e instanceof Error ? e.message : String(e);
        logger.error("getApprovalDetails error", { error: e, message, id: params.id });
        return { success: false, error: message };
    }
});

const getApprovalFlowsInternal = createSafeAction(emptySchema, async (_params, { session }) => {
    try {
        const flows = await db.query.approvalFlows.findMany({
            where: eq(approvalFlows.tenantId, session.user.tenantId),
            orderBy: [desc(approvalFlows.updatedAt)]
        });
        return { success: true, data: flows };
    } catch (e: unknown) {
        const { logger } = await import('@/shared/lib/logger');
        const message = e instanceof Error ? e.message : String(e);
        logger.error("getApprovalFlows error", { error: e, message });
        return { success: false, error: message };
    }
});

// 导出函数
/**
 * 获取当前用户的待处理审批任务列表
 * @returns 待处理任务数组
 */
export async function getPendingApprovals() {
    return getPendingApprovalsInternal({});
}

/**
 * 获取当前用户发起的审批历史列表
 * @returns 审批实例数组
 */
export async function getApprovalHistory() {
    return getApprovalHistoryInternal({});
}

/**
 * 获取指定审批实例的详细信息（包含任务序列）
 * @param id - 审批实例 ID
 * @returns 实例详情及任务列表
 */
export async function getApprovalDetails(id: string) {
    return getApprovalDetailsInternal({ id });
}

/**
 * 获取当前租户下所有的活跃审批流程定义
 * @returns 流程定义数组
 */
export async function getApprovalFlows() {
    return getApprovalFlowsInternal({});
}
