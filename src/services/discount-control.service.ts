import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema/infrastructure';
import { eq } from 'drizzle-orm';
import { TenantSettings } from '@/shared/types/tenant-settings';

export class DiscountControlService {
    /**
     * Check if the discount rate requires approval
     * @param tenantId 
     * @param rate Discount rate (e.g. 0.8 for 20% off)
     * @returns true if approval is required
     */
    static async checkRequiresApproval(tenantId: string, rate: number): Promise<boolean> {
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId)
        });
        const settings = (tenant?.settings || {}) as TenantSettings;
        const minDiscountRate = settings.quoteConfig?.minDiscountRate ?? 0.90;

        return rate < minDiscountRate;
    }

    /**
     * Validate if the discount rate is within allowable limits
     * @param tenantId 
     * @param rate 
     * @returns 
     */
    static async validateMinimumDiscount(tenantId: string, rate: number): Promise<{ isValid: boolean; message?: string }> {
        // Hard Stop limit (e.g. 50% usually) - This could also be in settings
        // For now, let's keep a hard safety net or read from settings if available
        const ABSOLUTE_MIN = 0.5;

        if (rate < ABSOLUTE_MIN) {
            return {
                isValid: false,
                message: `折扣过低，系统最低允许折扣率为 ${ABSOLUTE_MIN} (安全红线)`
            };
        }

        return { isValid: true };
    }
}
