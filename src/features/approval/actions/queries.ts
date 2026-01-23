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
        const message = e instanceof Error ? e.message : String(e);
        console.error("getPendingApprovals error", e);
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
        const message = e instanceof Error ? e.message : String(e);
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
            where: eq(approvalTasks.approvalId, params.id),
            with: {
                node: true,
            },
            orderBy: [desc(approvalTasks.createdAt)]
        });

        return { success: true, data: { approval, tasks } };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
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
        const message = e instanceof Error ? e.message : String(e);
        return { success: false, error: message };
    }
});

// 导出函数
export async function getPendingApprovals() {
    return getPendingApprovalsInternal({});
}

export async function getApprovalHistory() {
    return getApprovalHistoryInternal({});
}

export async function getApprovalDetails(id: string) {
    return getApprovalDetailsInternal({ id });
}

export async function getApprovalFlows() {
    return getApprovalFlowsInternal({});
}
