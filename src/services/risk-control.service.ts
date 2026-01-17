import { db } from '@/shared/api/db';
import { quotes, quoteItems } from '@/shared/api/schema/quotes';
import { eq } from 'drizzle-orm';
import { tenants } from '@/shared/api/schema';

export interface RiskCheckResult {
    requiresApproval: boolean;
    blockSubmission: boolean; // If true, specific permission needed to even submit
    reasons: string[];
}

const DEFAULT_RISK_CONFIG = {
    minProfitMargin: 0.15, // 15% margin required
    minDiscountRate: 0.80, // Minimum rate 0.8 (max 20% off)
    blockNegativeMargin: true, // Block if cost > price
};

export class RiskControlService {
    /**
     * Check risk for a quote
     */
    static async checkQuoteRisk(quoteId: string, tenantId: string): Promise<RiskCheckResult> {
        // 1. Fetch Quote and Items with Cost
        const quote = await db.query.quotes.findFirst({
            where: eq(quotes.id, quoteId),
            with: {
                items: true
            }
        });

        if (!quote) throw new Error('Quote not found');

        // 2. Fetch Tenant Config (Mock/Placeholder for now)
        // const tenant = await db.query.tenants.findFirst(...)
        const config = DEFAULT_RISK_CONFIG;

        const reasons: string[] = [];
        let requiresApproval = false;
        let blockSubmission = false;

        // 3. Calculate Totals
        let totalCost = 0;
        let finalAmount = Number(quote.finalAmount || 0);
        let totalQuoteAmount = Number(quote.totalAmount || 0);

        quote.items.forEach(item => {
            const qty = Number(item.quantity || 0);
            const cost = Number(item.costPrice || 0);
            totalCost += cost * qty;
        });

        // 4. Check Negative Margin (Hard Block)
        if (config.blockNegativeMargin && finalAmount < totalCost) {
            reasons.push(`Negative Profit: Cost (${totalCost.toFixed(2)}) > Price (${finalAmount.toFixed(2)})`);
            requiresApproval = true;
            blockSubmission = true;
        }

        // 5. Check Minimum Profit Margin
        const margin = finalAmount > 0 ? (finalAmount - totalCost) / finalAmount : 0;

        if (!blockSubmission && margin < config.minProfitMargin) {
            requiresApproval = true;
            reasons.push(`Low Profit Margin: ${(margin * 100).toFixed(1)}% < ${(config.minProfitMargin * 100)}%`);
        }

        // 6. Check Discount Rate
        const discountRate = Number(quote.discountRate || 1);
        if (discountRate < config.minDiscountRate) {
            requiresApproval = true;
            reasons.push(`High Discount: Rate ${discountRate} < ${config.minDiscountRate}`);
        }

        // 7. Check Manual Discount Amount
        // If finalAmount is manually set significantly lower than totalAmount
        // (Handled by discountRate or just pure amount check)

        return {
            requiresApproval,
            blockSubmission,
            reasons
        };
    }
}
