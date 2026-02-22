import { logger } from "@/shared/lib/logger";
import { db } from '@/shared/api/db';
import { approvalFlows } from '@/shared/api/schema/approval';
import { eq, and } from 'drizzle-orm';

/**
 * Finance Approval Logic Container
 * Defines constants and helper methods for Payment/Refund approvals
 */
export class FinanceApprovalLogic {
    static readonly FLOW_CODES = {
        PAYMENT: 'FINANCE_PAYMENT',
        REFUND: 'FINANCE_REFUND',
    };

    /**
     * Check if a specific flow is active for the tenant
     */
    static async isFlowActive(tenantId: string, flowCode: string) {
        const flow = await db.query.approvalFlows.findFirst({
            where: and(
                eq(approvalFlows.tenantId, tenantId),
                eq(approvalFlows.code, flowCode),
                eq(approvalFlows.isActive, true)
            )
        });
        return !!flow;
    }

    /**
     * Get default steps for initialization (if we were to auto-create flows)
     */
    static getDefaultSteps(type: 'PAYMENT' | 'REFUND') {
        if (type === 'PAYMENT') {
            return [
                { name: 'Store Manager', role: 'STORE_MANAGER', sortOrder: 1 },
                { name: 'Finance', role: 'FINANCE', sortOrder: 2 }
            ];
        } else {
            return [
                { name: 'Store Manager', role: 'STORE_MANAGER', sortOrder: 1 },
                { name: 'Finance', role: 'FINANCE', sortOrder: 2 },
                // Large refunds might need Boss? Configurable.
            ];
        }
    }
}
