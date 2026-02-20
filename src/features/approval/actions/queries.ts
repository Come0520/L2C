'use server';

import { db } from "@/shared/api/db";
import {
    approvals,
    approvalTasks,
    approvalFlows
} from "@/shared/api/schema";
import { eq, and, desc, count, ne } from "drizzle-orm";
import { createSafeAction } from '@/shared/lib/server-action';
import { emptySchema, getApprovalDetailsSchema, paginationSchema } from '../schema';

// createSafeAction 内部实现
const getPendingApprovalsInternal = createSafeAction(paginationSchema, async (params, { session }) => {
    try {
        const { page = 1, pageSize = 10 } = params;
        const offset = (page - 1) * pageSize;

        const whereClause = and(
            eq(approvalTasks.tenantId, session.user.tenantId),
            eq(approvalTasks.approverId, session.user.id),
            eq(approvalTasks.status, 'PENDING')
        );

        const tasks = await db.query.approvalTasks.findMany({
            where: whereClause,
            with: {
                approval: {
                    with: {
                        flow: true
                    }
                },
                node: true
            },
            orderBy: [desc(approvalTasks.createdAt)],
            limit: pageSize,
            offset: offset,
        });

        const totalResult = await db.select({ value: count() })
            .from(approvalTasks)
            .where(whereClause);

        const total = totalResult[0]?.value || 0;

        return {
            tasks,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    } catch (e: unknown) {
        const { logger } = await import('@/shared/lib/logger');
        const message = e instanceof Error ? e.message : String(e);
        logger.error("getPendingApprovals error", { error: e, message });
        throw new Error(message);
    }
});

const getProcessedApprovalsInternal = createSafeAction(paginationSchema, async (params, { session }) => {
    try {
        const { page = 1, pageSize = 10 } = params;
        const offset = (page - 1) * pageSize;

        const whereClause = and(
            eq(approvalTasks.tenantId, session.user.tenantId),
            eq(approvalTasks.approverId, session.user.id),
            ne(approvalTasks.status, 'PENDING')
        );

        const tasks = await db.query.approvalTasks.findMany({
            where: whereClause,
            with: {
                approval: {
                    with: {
                        flow: true,
                        requester: true
                    }
                },
                node: true
            },
            orderBy: [desc(approvalTasks.actionAt)],
            limit: pageSize,
            offset: offset,
        });

        const totalResult = await db.select({ value: count() })
            .from(approvalTasks)
            .where(whereClause);

        const total = totalResult[0]?.value || 0;

        return {
            tasks,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    } catch (e: unknown) {
        const { logger } = await import('@/shared/lib/logger');
        const message = e instanceof Error ? e.message : String(e);
        logger.error("getProcessedApprovals error", { error: e, message });
        throw new Error(message);
    }
});

const getApprovalHistoryInternal = createSafeAction(paginationSchema, async (params, { session }) => {
    try {
        const { page = 1, pageSize = 10 } = params;
        const offset = (page - 1) * pageSize;

        const whereClause = and(
            eq(approvals.tenantId, session.user.tenantId),
            eq(approvals.requesterId, session.user.id)
        );

        const myApprovals = await db.query.approvals.findMany({
            where: whereClause,
            with: {
                flow: true,
            },
            orderBy: [desc(approvals.createdAt)],
            limit: pageSize,
            offset: offset,
        });

        const totalResult = await db.select({ value: count() })
            .from(approvals)
            .where(whereClause);

        const total = totalResult[0]?.value || 0;

        return {
            success: true,
            data: {
                approvals: myApprovals,
                pagination: {
                    total,
                    page,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        };
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
 * @param params 分页参数
 * @returns 待处理任务数组及分页信息
 */
export async function getPendingApprovals(params: { page?: number; pageSize?: number } = {}) {
    return getPendingApprovalsInternal({ page: params.page ?? 1, pageSize: params.pageSize ?? 10 });
}

/**
 * 获取当前用户已处理的审批任务列表
 * @param params 分页参数
 * @returns 已处理任务数组及分页信息
 */
export async function getProcessedApprovals(params: { page?: number; pageSize?: number } = {}) {
    return getProcessedApprovalsInternal({ page: params.page ?? 1, pageSize: params.pageSize ?? 10 });
}

/**
 * 获取当前用户发起的审批历史列表
 * @param params 分页参数
 * @returns 审批实例数组及分页信息
 */
export async function getApprovalHistory(params: { page?: number; pageSize?: number } = {}) {
    return getApprovalHistoryInternal({ page: params.page ?? 1, pageSize: params.pageSize ?? 10 });
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
