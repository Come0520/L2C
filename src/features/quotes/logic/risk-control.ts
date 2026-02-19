import { QuoteItem } from '@/shared/api/schema/quotes';
import { TenantSettings } from '@/shared/types/tenant-settings';
import Decimal from 'decimal.js';

export interface RiskCheckResult {
    isRisk: boolean;
    reason: string[];
    hardStop: boolean;
}

/**
 * Checks if the quote violates any risk control rules.
 * 
 * Rules:
 * 1. Hard Stop: Final Amount < Total Cost (Negative Margin)
 * 2. Soft Risk: Final Discount < Min Discount Rate
 * 3. Soft Risk: Profit Margin < Min Profit Margin
 */
export function checkDiscountRisk(
    items: QuoteItem[],
    finalAmount: number,
    originalAmount: number,
    settings: TenantSettings
): RiskCheckResult {
    const result: RiskCheckResult = {
        isRisk: false,
        reason: [],
        hardStop: false
    };

    // Defaults
    const minDiscountRate = settings.quoteConfig?.minDiscountRate ?? 0.90;
    const minProfitMargin = settings.quoteConfig?.minProfitMargin ?? 0.15;

    // 1. Calculate Total Cost
    // P1-R5-02: Fix precision issues with Decimal.js
    const totalCostDec = items.reduce((sum, item) => {
        const quantity = new Decimal(item.quantity || 0);
        const costPrice = new Decimal(item.costPrice || 0);
        return sum.plus(quantity.times(costPrice));
    }, new Decimal(0));
    const totalCost = totalCostDec.toNumber();

    // 2. Check Negative Margin (Hard Stop)
    if (finalAmount < totalCost) {
        result.isRisk = true;
        result.hardStop = true;
        result.reason.push(`报价金额 (${finalAmount}) 低于总成本 (${totalCost})，属于负毛利严重风险。`);
    }

    // 3. Check Discount Rate
    // Avoid division by zero
    if (originalAmount > 0) {
        const currentDiscount = new Decimal(finalAmount).div(originalAmount).toNumber();
        if (currentDiscount < minDiscountRate) {
            result.isRisk = true;
            result.reason.push(`当前折扣 (${(currentDiscount * 10).toFixed(2)}折) 低于最低折扣限制 (${(minDiscountRate * 10).toFixed(2)}折)。`);
        }
    }

    // 4. Check Profit Margin
    // Margin = (Final - Cost) / Final
    if (finalAmount > 0) {
        const profit = new Decimal(finalAmount).minus(totalCost);
        const margin = profit.div(finalAmount).toNumber();

        if (margin < minProfitMargin) {
            result.isRisk = true;
            result.reason.push(`当前毛利率 (${(margin * 100).toFixed(1)}%) 低于最低毛利限制 (${(minProfitMargin * 100).toFixed(1)}%)。`);
        }
    }

    return result;
}
