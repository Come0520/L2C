'use server';

import { db } from '@/shared/api/db';
import { approvalInstances, approvalFlows, users } from '@/shared/api/schema';
import { eq, desc, and } from 'drizzle-orm';
import { ApprovalStep } from '../schema';

/**
 * 查找活跃的审批流�?
 */
export async function findActiveApprovalFlow(tenantId: string, module: string, triggerAction: string) {
    return await db.query.approvalFlows.findFirst({
        where: and(
            eq(approvalFlows.tenantId, tenantId),
            eq(approvalFlows.module, module),
            eq(approvalFlows.triggerAction, triggerAction),
            eq(approvalFlows.isActive, true)
        )
    });
}

/**
 * 获取我的待审批任�?
 */
export async function getPendingApprovals(userId: string, userRole: string | null) {
    const pending = await db.query.approvalInstances.findMany({
        where: eq(approvalInstances.status, 'PENDING'),
        with: {
            flow: true,
            applicant: true
        },
        orderBy: desc(approvalInstances.appliedAt)
    });

    const myTasks = pending.filter(inst => {
        const steps = inst.flow?.steps as unknown as ApprovalStep[];
        if (!steps) return false;

        const currentStep = steps[(inst.currentStep || 1) - 1];
        if (!currentStep) return false;

        // Match Logic
        if (currentStep.approverType === 'USER' && currentStep.approverValue === userId) return true;
        if (currentStep.approverType === 'ROLE' && userRole && currentStep.approverValue === userRole) return true;

        return false;
    });

    return { success: true, data: myTasks };
}

// TODO: Add more queries like getApprovalHistory, etc.
