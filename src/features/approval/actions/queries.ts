'use server';

import { db } from "@/shared/api/db";
import {
    approvals,
    approvalTasks,
    approvalFlows,
    approvalNodes
} from "@/shared/api/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/shared/lib/auth";

export async function getPendingApprovals() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, data: [] };

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
    } catch (e: any) {
        console.error("getPendingApprovals error", e);
        return { success: false, error: e.message };
    }
}

export async function getApprovalHistory() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, data: [] };

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
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getApprovalDetails(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const approval = await db.query.approvals.findFirst({
            where: and(
                eq(approvals.id, id),
                eq(approvals.tenantId, session.user.tenantId)
            ),
            with: {
                flow: true,
            }
        });

        if (!approval) return { success: false, error: "Not found" };

        const tasks = await db.query.approvalTasks.findMany({
            where: eq(approvalTasks.approvalId, id),
            with: {
                node: true,
            },
            orderBy: [desc(approvalTasks.createdAt)]
        });

        return { success: true, data: { approval, tasks } };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
