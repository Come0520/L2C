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
     * @param tenantId Optional Tenant ID for security isolation
     */
    static async getEffectiveApprover(approverId: string, flowId?: string, tenantId?: string): Promise<string> {
        const now = new Date();

        // 1. Check for Flow-Specific Delegation first (Higher priority)
        if (flowId) {
            const whereConditions = [
                eq(approvalDelegations.delegatorId, approverId),
                eq(approvalDelegations.isActive, true),
                eq(approvalDelegations.type, 'FLOW'),
                eq(approvalDelegations.flowId, flowId),
                lte(approvalDelegations.startTime, now),
                gte(approvalDelegations.endTime, now)
            ];

            if (tenantId) {
                whereConditions.push(eq(approvalDelegations.tenantId, tenantId));
            }

            const flowDelegation = await db.query.approvalDelegations.findFirst({
                where: and(...whereConditions),
                orderBy: [desc(approvalDelegations.createdAt)]
            });

            if (flowDelegation) {
                return flowDelegation.delegateeId;
            }
        }

        // 2. Check for Global Delegation
        const globalWhere = [
            eq(approvalDelegations.delegatorId, approverId),
            eq(approvalDelegations.isActive, true),
            eq(approvalDelegations.type, 'GLOBAL'),
            lte(approvalDelegations.startTime, now),
            gte(approvalDelegations.endTime, now)
        ];

        if (tenantId) {
            globalWhere.push(eq(approvalDelegations.tenantId, tenantId));
        }

        const globalDelegation = await db.query.approvalDelegations.findFirst({
            where: and(...globalWhere),
            orderBy: [desc(approvalDelegations.createdAt)]
        });

        if (globalDelegation) {
            return globalDelegation.delegateeId;
        }

        // 3. No delegation, return original
        return approverId;
    }
}
