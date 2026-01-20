import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema/quotes';
import { eq } from 'drizzle-orm';
import { tenants } from '@/shared/api/schema/infrastructure';
import { checkDiscountRisk } from '@/features/quotes/logic/risk-control';
import { TenantSettings } from '@/shared/types/tenant-settings';

export interface RiskCheckResult {
    requiresApproval: boolean;
    blockSubmission: boolean;
    reasons: string[];
}

export class RiskControlService {
    /**
     * Check risk for a quote using domain logic and tenant settings
     */
    static async checkQuoteRisk(quoteId: string, tenantId: string): Promise<RiskCheckResult> {
        // 1. Fetch Quote and Items
        const quote = await db.query.quotes.findFirst({
            where: eq(quotes.id, quoteId),
            with: {
                items: true
            }
        });

        if (!quote) throw new Error('Quote not found');

        // 2. Fetch Tenant Config
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId)
        });

        const settings = (tenant?.settings || {}) as TenantSettings;

        // 3. Domain Logic Calculation
        const result = checkDiscountRisk(
            quote.items,
            Number(quote.finalAmount || 0),
            Number(quote.totalAmount || 0),
            settings
        );

        return {
            requiresApproval: result.isRisk,
            blockSubmission: result.hardStop,
            reasons: result.reason
        };
    }
}
