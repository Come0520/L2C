import { QuoteConfigService } from '@/services/quote-config.service';

/**
 * Service for discount risk control and validation logic.
 */
export class DiscountControlService {
    /**
     * Validates if a discount rate is within the minimum allowed limit.
     */
    static async validateMinimumDiscount(tenantId: string, discountRate: number): Promise<{ isValid: boolean, message?: string }> {
        const config = await QuoteConfigService.getTenantConfig(tenantId);

        const minRate = config.discountControl?.minDiscountRate ?? 0;

        if (discountRate < minRate) {
            return {
                isValid: false,
                message: `折扣率 (${(discountRate * 100).toFixed(0)}%) 低于租户最低限制 (${(minRate * 100).toFixed(0)}%)。`
            };
        }

        return { isValid: true };
    }

    /**
     * Checks if a quote's discount requires approval based on tenant configuration.
     */
    static async checkRequiresApproval(tenantId: string, discountRate: number): Promise<boolean> {
        // If no discount (rate = 1), no approval needed
        if (discountRate >= 1) return false;

        const config = await QuoteConfigService.getTenantConfig(tenantId);

        // If discountRate is lower than the threshold, approval is required
        const threshold = config.discountControl?.requireApprovalBelow ?? 0;
        return discountRate < threshold;
    }

    /**
     * Calculates the actual discount rate for a quote.
     * Rate = finalAmount / totalAmount
     */
    static calculateActualRate(totalAmount: number, finalAmount: number): number {
        if (totalAmount <= 0) return 1;
        return Number((finalAmount / totalAmount).toFixed(4));
    }
}
