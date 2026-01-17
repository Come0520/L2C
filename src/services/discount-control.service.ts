


export class DiscountControlService {
    /**
     * Check if the discount rate requires approval
     * @param tenantId 
     * @param rate Discount rate (e.g. 0.8 for 20% off)
     * @returns true if approval is required
     */
    static async checkRequiresApproval(tenantId: string, rate: number): Promise<boolean> {
        // TODO: specific logic fetching from tenant settings
        // For now, default policy: any discount below 0.8 (more than 20% off) requires approval
        return rate < 0.8;
    }

    /**
     * Validate if the discount rate is within allowable limits
     * @param tenantId 
     * @param rate 
     * @returns 
     */
    static async validateMinimumDiscount(tenantId: string, rate: number): Promise<{ isValid: boolean; message?: string }> {
        // TODO: specific logic fetching from tenant settings
        // For now, absolute minimum rate is 0.5 (50% off)
        const MIN_RATE = 0.5;

        if (rate < MIN_RATE) {
            return {
                isValid: false,
                message: `折扣过低，系统最低允许折扣率为 ${MIN_RATE}`
            };
        }

        return { isValid: true };
    }
}
