import { db } from "@/shared/api/db";
import { approvalDelegations } from "@/shared/api/schema";
import { eq, and, lte, gte, desc } from "drizzle-orm";

export class ApprovalDelegationService {
    /**
     * Check if an approver has an active delegation and return the delegatee's ID.
     * If no active delegation, returns the original approver ID.
     * 
     * @param approverId The original approver User ID
     * @param flowId Optional Flow ID to check for flow-specific delegation
     */
    static async getEffectiveApprover(approverId: string, flowId?: string): Promise<string> {
        const now = new Date();

        // 1. Check for Flow-Specific Delegation first (Higher priority)
        if (flowId) {
            const flowDelegation = await db.query.approvalDelegations.findFirst({
                where: and(
                    eq(approvalDelegations.delegatorId, approverId),
                    eq(approvalDelegations.isActive, true),
                    eq(approvalDelegations.type, 'FLOW'),
                    eq(approvalDelegations.flowId, flowId),
                    lte(approvalDelegations.startTime, now),
                    gte(approvalDelegations.endTime, now)
                ),
                orderBy: [desc(approvalDelegations.createdAt)]
            });

            if (flowDelegation) {
                return flowDelegation.delegateeId;
            }
        }

        // 2. Check for Global Delegation
        const globalDelegation = await db.query.approvalDelegations.findFirst({
            where: and(
                eq(approvalDelegations.delegatorId, approverId),
                eq(approvalDelegations.isActive, true),
                eq(approvalDelegations.type, 'GLOBAL'),
                lte(approvalDelegations.startTime, now),
                gte(approvalDelegations.endTime, now)
            ),
            orderBy: [desc(approvalDelegations.createdAt)]
        });

        if (globalDelegation) {
            return globalDelegation.delegateeId;
        }

        // 3. No delegation, return original
        return approverId;
    }
}
