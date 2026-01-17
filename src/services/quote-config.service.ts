import { db } from '@/shared/api/db';
import { tenants, users } from '@/shared/api/schema/infrastructure';
import { eq } from 'drizzle-orm';

/**
 * 报价展示配置结构 (Quote Visibility Configuration)
 */
export interface QuoteConfig {
    mode: 'simple' | 'advanced';
    visibleFields: string[]; // 允许动态控制的字段列表
    presetLoss: {
        side: number;
        bottom: number;
        header: number;
    };
    discountControl?: {
        minDiscountRate: number; // e.g. 0.80 for 20% off max
        requireApprovalBelow: number; // e.g. 0.90 for 10% off needs approval
    };
}

/**
 * 系统默认配置 (System Default)
 */
const SYSTEM_DEFAULT_CONFIG: QuoteConfig = {
    mode: 'simple',
    visibleFields: [
        'productName', 'width', 'height', 'quantity', 'unitPrice', 'subtotal'
    ],
    presetLoss: {
        side: 20,
        bottom: 20,
        header: 20
    },
    discountControl: {
        minDiscountRate: 0.80,
        requireApprovalBelow: 0.90
    }
};

/**
 * 报价配置服务 (Quote Configuration Service)
 * 处理租户配置、用户偏好与系统默认值的合并逻辑
 */
export class QuoteConfigService {

    /**
     * 获取合并后的最终配置
     */
    static async getMergedConfig(tenantId: string, userId: string): Promise<QuoteConfig> {
        // 1. 获取租户配置
        const tenantData = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId),
            columns: { settings: true }
        });

        // 2. 获取用户偏好
        const userData = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { preferences: true }
        });

        const tenantSettings = (tenantData?.settings as any)?.quoteConfig || {};
        const userPrefs = (userData?.preferences as any)?.quoteMode || {};

        // 3. 执行合并逻辑 (User > Tenant > Default)
        const config: QuoteConfig = {
            ...SYSTEM_DEFAULT_CONFIG,
            ...tenantSettings,
            mode: userPrefs.mode || tenantSettings.mode || SYSTEM_DEFAULT_CONFIG.mode,
            visibleFields: Array.from(new Set([
                ...SYSTEM_DEFAULT_CONFIG.visibleFields,
                ...(tenantSettings.visibleFields || [])
            ]))
        };

        // 如果是高级模式，自动增加高级字段（如果租户未明确禁用）
        if (config.mode === 'advanced') {
            const advancedFields = ['foldRatio', 'processFee', 'remark', 'measuredWidth', 'measuredHeight'];
            config.visibleFields = Array.from(new Set([...config.visibleFields, ...advancedFields]));
        }

        return config;
    }

    /**
     * 获取租户配置
     */
    static async getTenantConfig(tenantId: string): Promise<QuoteConfig> {
        const tenantData = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId),
            columns: { settings: true }
        });

        const tenantSettings = (tenantData?.settings as any)?.quoteConfig || {};
        return {
            ...SYSTEM_DEFAULT_CONFIG,
            ...tenantSettings,
            visibleFields: Array.from(new Set([
                ...SYSTEM_DEFAULT_CONFIG.visibleFields,
                ...(tenantSettings.visibleFields || [])
            ]))
        };
    }

    /**
     * 更新用户模式偏好
     */
    static async updateUserMode(userId: string, mode: 'simple' | 'advanced') {
        const userData = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { preferences: true }
        });

        const preferences = {
            ...(userData?.preferences as any || {}),
            quoteMode: { mode }
        };

        await db.update(users)
            .set({ preferences, updatedAt: new Date() })
            .where(eq(users.id, userId));
    }

    /**
     * 更新租户全局配置 (仅限管理员)
     */
    static async updateTenantConfig(tenantId: string, quoteConfig: Partial<QuoteConfig>) {
        const tenantData = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId),
            columns: { settings: true }
        });

        const settings = {
            ...(tenantData?.settings as any || {}),
            quoteConfig: {
                ...(tenantData?.settings as any)?.quoteConfig || {},
                ...quoteConfig
            }
        };

        await db.update(tenants)
            .set({ settings, updatedAt: new Date() })
            .where(eq(tenants.id, tenantId));
    }
}
