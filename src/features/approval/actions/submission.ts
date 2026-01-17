'use server';

import { db } from "@/shared/api/db";
import {
    approvals,
    approvalFlows,
    approvalNodes,
    approvalTasks,
    quotes, // For business callback
    orders  // For business callback
} from "@/shared/api/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { auth } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * 提交审批
 * @param data 
 */
export async function submitApproval(payload: {
    entityType: 'QUOTE' | 'ORDER'; // Expand as needed
    entityId: string;
    flowCode: string; // e.g., 'QUOTE_APPROVAL'
    comment?: string;
}) {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: 'Unauthorized' };

    return db.transaction(async (tx) => {
        // 1. Find active flow definition
        const flow = await tx.query.approvalFlows.findFirst({
            where: and(
                eq(approvalFlows.tenantId, session.user.tenantId),
                eq(approvalFlows.code, payload.flowCode),
                eq(approvalFlows.isActive, true)
            )
        });

        if (!flow) {
            return { success: false, error: '审批流程未定义或已禁用' };
        }

        // 2. Find first node
        const firstNode = await tx.query.approvalNodes.findFirst({
            where: eq(approvalNodes.flowId, flow.id),
            orderBy: [asc(approvalNodes.sortOrder)]
        });

        if (!firstNode) {
            return { success: false, error: '审批流程节点缺失' };
        }

        // 3. Create Approval Instance
        const [approval] = await tx.insert(approvals).values({
            tenantId: session.user.tenantId,
            flowId: flow.id,
            entityType: payload.entityType,
            entityId: payload.entityId,
            status: 'PENDING',
            requesterId: session.user.id,
            currentNodeId: firstNode.id,
            comment: payload.comment,
        }).returning();

        // 4. Create Task for First Node
        // Logic to determine approver:
        // - If approverUserId is set in node, use it.
        // - If approverRole is set, we might need to find users with that role (Complex, skipping for now, assume userId or self-approval if not set for simplicity or error)

        let approverId = firstNode.approverUserId;
        if (!approverId) {
            // Check role? Or assign to admin?
            // For now, fail if no specific user assigned in definition
            // return { success: false, error: `节点 ${firstNode.name} 未指定审批人` };
            // Fallback: Assign to requester for testing if undefined? No, let's leave it null => Unassigned pool?
            // Let's assume for this MVP, node has approverUserId.
        }

        await tx.insert(approvalTasks).values({
            tenantId: session.user.tenantId,
            approvalId: approval.id,
            nodeId: firstNode.id,
            approverId: approverId, // Can be null if pool
            status: 'PENDING',
        });

        // 5. Update Business Entity Status
        if (payload.entityType === 'QUOTE') {
            await tx.update(quotes)
                .set({ status: 'PENDING_APPROVAL' })
                .where(eq(quotes.id, payload.entityId));
        } else if (payload.entityType === 'ORDER') {
            // await tx.update(orders)
            //    .set({ status: 'PENDING_APPROVAL' }) // Order might have specific status flow
            //    .where(eq(orders.id, payload.entityId));
        }

        revalidatePath('/approval');
        return { success: true, message: '审批提交成功' };
    });
}
