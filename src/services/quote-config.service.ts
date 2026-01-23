import { db } from '@/shared/api/db';
import { quoteConfig } from '@/shared/api/schema/quote-config';
import { tenants } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { DEFAULT_QUOTE_MODE_CONFIG, type QuoteModeConfig } from '@/features/settings/lib/quote-mode-constants';

/**
 * 尺寸限制配置 (Dimension Limits Configuration)
 * 支持租户级自定义，但不能超过系统硬限制
 */
export interface DimensionLimits {
    /** 高度警告阈值 (cm)，超过此值提示确认 */
    heightWarning: number;
    /** 高度硬限制 (cm)，系统级上限，不可超过 */
    heightMax: number;
    /** 宽度警告阈值 (cm)，超过此值提示确认 */
    widthWarning: number;
    /** 宽度硬限制 (cm)，系统级上限，不可超过 */
    widthMax: number;
    /** 是否启用尺寸校验 */
    enabled: boolean;
}

/**
 * 报价方案配置 (Quote Plan Settings)
 */
export interface QuotePlanSettings {
    markup: number;        // 加价率 (0.1 = 10%)
    quality: string;       // 质量档次描述
    description?: string;  // 适用场景描述
}

/**
 * 空间分组配置 (Room Group Configuration)
 * 用于报价单中的空间选择器
 */
export interface RoomGroup {
    /** 分组名称 */
    label: string;
    /** 分组内的空间选项 */
    items: string[];
    /** 是否显示自定义输入 */
    hasCustom?: boolean;
}

/**
 * 报价展示配置结构 (Quote Visibility Configuration)
 */
export interface QuoteConfig {
    mode: 'simple' | 'advanced';

    // 三级模式支持
    defaultPlan?: 'ECONOMIC' | 'COMFORT' | 'LUXURY';
    planSettings?: {
        ECONOMIC?: QuotePlanSettings;
        COMFORT?: QuotePlanSettings;
        LUXURY?: QuotePlanSettings;
    };

    visibleFields: string[];
    presetLoss: {
        curtain: {
            /** 侧边损耗 (cm) */
            sideLoss: number;
            /** 底边损耗 (cm) */
            bottomLoss: number;
            /** 包布带帘头损耗 (cm) */
            headerLossWrapped: number;
            /** 贴布带帘头损耗 (cm) */
            headerLossAttached: number;
            /** 默认帘头工艺 */
            defaultHeaderType: 'WRAPPED' | 'ATTACHED';
            /** 默认褶皱倍数 */
            defaultFoldRatio: number;
            /** 定高面料阈值 (cm)，超过此值触发超高预警 */
            heightWarningThreshold: number;
            /** 兼容旧版 headerLoss，等同于 headerLossWrapped */
            headerLoss?: number;
        };
        wallpaper: {
            widthLoss: number;
            cutLoss: number;
        };
    };
    discountControl?: {
        minDiscountRate: number;
        requireApprovalBelow: number;
    };

    /** 尺寸校验配置 (Dimension Validation) */
    dimensionLimits?: DimensionLimits;

    /** 空间分组配置 (Room Groups for Space Selector) */
    roomGroups?: RoomGroup[];
}

/**
 * 系统默认配置 (System Default)
 */
const SYSTEM_DEFAULT_CONFIG: QuoteConfig = {
    mode: 'simple',
    defaultPlan: 'COMFORT',
    planSettings: {
        ECONOMIC: {
            markup: 0.15,  // 15% 加价
            quality: '经济实惠',
            description: '适合预算有限的客户，保证基本质量'
        },
        COMFORT: {
            markup: 0.30,  // 30% 加价
            quality: '舒适品质',
            description: '性价比之选，满足大多数客户需求'
        },
        LUXURY: {
            markup: 0.50,  // 50% 加价
            quality: '豪华尊享',
            description: '高端品质，极致体验'
        }
    },
    visibleFields: [
        'productName', 'width', 'height', 'quantity', 'unitPrice', 'subtotal'
    ],
    presetLoss: {
        curtain: {
            sideLoss: 5,
            bottomLoss: 10,
            headerLossWrapped: 20,
            headerLossAttached: 7,
            defaultHeaderType: 'WRAPPED',
            defaultFoldRatio: 2,
            heightWarningThreshold: 275
        },
        wallpaper: { widthLoss: 20, cutLoss: 10 }
    },
    discountControl: {
        minDiscountRate: 0.80,
        requireApprovalBelow: 0.90
    },
    /**
     * 尺寸限制系统默认配置
     * - 系统级硬限制：高度 1000cm，宽度 2000cm（不可超过）
     * - 警告阈值：高度 400cm（复式/挑高），宽度 1000cm（需分段）
     * - 租户可自定义更低的警告阈值，但硬限制不可调整
     */
    dimensionLimits: {
        heightWarning: 400,   // 超过 400cm 提示是否为复式/挑高
        heightMax: 1000,      // 系统硬限制，不可超过 1000cm
        widthWarning: 1000,   // 超过 1000cm 提示是否需分段
        widthMax: 2000,       // 系统硬限制，不可超过 2000cm
        enabled: true
    },
    /**
     * 空间分组默认配置
     * 租户可自定义，用于报价单中的空间选择器
     */
    roomGroups: [
        {
            label: '卧室',
            items: ['主卧', '次卧', '客房', '儿童房', '男孩房', '女孩房'],
        },
        {
            label: '公共空间',
            items: ['客厅', '餐厅', '书房', '茶室', '阳台', '南阳台', '北阳台'],
        },
        {
            label: '其他',
            items: ['阳光房', '洗衣房', '保姆房'],
            hasCustom: true,
        },
    ]
};

/**
 * 报价配置服务 (Quote Configuration Service)
 * 处理租户配置、用户偏好与系统默认值的合并逻辑
 * Now backed by 'quote_config' table
 */
export class QuoteConfigService {

    /**
     * 获取合并后的最终配置
     */
    static async getMergedConfig(tenantId: string, userId: string): Promise<QuoteConfig> {
        // 1. Fetch Tenant Config
        const tenantData = await db.query.quoteConfig.findFirst({
            where: and(
                eq(quoteConfig.type, 'TENANT'),
                eq(quoteConfig.entityId, tenantId)
            )
        });

        // 2. Fetch User Config
        const userData = await db.query.quoteConfig.findFirst({
            where: and(
                eq(quoteConfig.type, 'USER'),
                eq(quoteConfig.entityId, userId)
            )
        });

        // 2.5 获取租户的快速报价字段配置 (Get Tenant's Quick Quote Field Config)
        const tenantRecord = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId),
            columns: { settings: true },
        });
        const tenantQuoteModeConfig = (tenantRecord?.settings as Record<string, unknown>)?.quoteModeConfig as QuoteModeConfig | undefined;

        const tenantSettings = (tenantData?.config as unknown as Partial<QuoteConfig>) || {};
        const userPrefs = (userData?.config as unknown as Partial<QuoteConfig>) || {};

        // 3. Merge: System > Tenant > User
        const config: QuoteConfig = {
            ...SYSTEM_DEFAULT_CONFIG,
            ...tenantSettings,
            ...userPrefs,
            // Deep merge essential nested objects
            presetLoss: {
                curtain: {
                    ...SYSTEM_DEFAULT_CONFIG.presetLoss.curtain,
                    ...(tenantSettings.presetLoss?.curtain || {}),
                    ...(userPrefs.presetLoss?.curtain || {})
                },
                wallpaper: {
                    ...SYSTEM_DEFAULT_CONFIG.presetLoss.wallpaper,
                    ...(tenantSettings.presetLoss?.wallpaper || {}),
                    ...(userPrefs.presetLoss?.wallpaper || {})
                }
            },
            planSettings: {
                ECONOMIC: {
                    ...SYSTEM_DEFAULT_CONFIG.planSettings!.ECONOMIC!,
                    ...(tenantSettings.planSettings?.ECONOMIC || {}),
                    ...(userPrefs.planSettings?.ECONOMIC || {})
                },
                COMFORT: {
                    ...SYSTEM_DEFAULT_CONFIG.planSettings!.COMFORT!,
                    ...(tenantSettings.planSettings?.COMFORT || {}),
                    ...(userPrefs.planSettings?.COMFORT || {})
                },
                LUXURY: {
                    ...SYSTEM_DEFAULT_CONFIG.planSettings!.LUXURY!,
                    ...(tenantSettings.planSettings?.LUXURY || {}),
                    ...(userPrefs.planSettings?.LUXURY || {})
                }
            },
            // Logic: User mode overrides Tenant mode (unless we want strict enforcement)
            // Logic: Visible fields are union
            visibleFields: Array.from(new Set([
                ...SYSTEM_DEFAULT_CONFIG.visibleFields,
                ...(tenantSettings.visibleFields || []),
                ...(userPrefs.visibleFields || [])
            ])),
            // 尺寸限制配置：租户可自定义警告阈值，但硬限制始终使用系统默认值
            dimensionLimits: {
                // 硬限制不可调整，始终使用系统默认值
                heightMax: SYSTEM_DEFAULT_CONFIG.dimensionLimits!.heightMax,
                widthMax: SYSTEM_DEFAULT_CONFIG.dimensionLimits!.widthMax,
                // 警告阈值可由租户自定义，但不能超过硬限制
                heightWarning: Math.min(
                    tenantSettings.dimensionLimits?.heightWarning ?? SYSTEM_DEFAULT_CONFIG.dimensionLimits!.heightWarning,
                    SYSTEM_DEFAULT_CONFIG.dimensionLimits!.heightMax
                ),
                widthWarning: Math.min(
                    tenantSettings.dimensionLimits?.widthWarning ?? SYSTEM_DEFAULT_CONFIG.dimensionLimits!.widthWarning,
                    SYSTEM_DEFAULT_CONFIG.dimensionLimits!.widthMax
                ),
                enabled: tenantSettings.dimensionLimits?.enabled ?? SYSTEM_DEFAULT_CONFIG.dimensionLimits!.enabled
            }
        };

        // If advanced mode, ensure advanced fields are visible
        if (config.mode === 'advanced') {
            const advancedFields = ['foldRatio', 'processFee', 'remark', 'measuredWidth', 'measuredHeight'];
            config.visibleFields = Array.from(new Set([...config.visibleFields, ...advancedFields]));
        } else {
            // 快速模式：使用租户配置的快速报价字段 (Quick Mode: Use tenant's quick quote fields)
            const quickModeFields = tenantQuoteModeConfig?.quickModeFields ?? DEFAULT_QUOTE_MODE_CONFIG.quickModeFields;
            config.visibleFields = quickModeFields;
        }

        return config;
    }

    /**
     * 获取租户配置
     */
    static async getTenantConfig(tenantId: string): Promise<QuoteConfig> {
        const tenantData = await db.query.quoteConfig.findFirst({
            where: and(
                eq(quoteConfig.type, 'TENANT'),
                eq(quoteConfig.entityId, tenantId)
            )
        });

        const tenantSettings = (tenantData?.config as unknown as Partial<QuoteConfig>) || {};

        return {
            ...SYSTEM_DEFAULT_CONFIG,
            ...tenantSettings,
            presetLoss: {
                curtain: { ...SYSTEM_DEFAULT_CONFIG.presetLoss.curtain, ...tenantSettings.presetLoss?.curtain },
                wallpaper: { ...SYSTEM_DEFAULT_CONFIG.presetLoss.wallpaper, ...tenantSettings.presetLoss?.wallpaper }
            },
            visibleFields: Array.from(new Set([
                ...SYSTEM_DEFAULT_CONFIG.visibleFields,
                ...(tenantSettings.visibleFields || [])
            ])),
            // 尺寸限制配置
            dimensionLimits: {
                heightMax: SYSTEM_DEFAULT_CONFIG.dimensionLimits!.heightMax,
                widthMax: SYSTEM_DEFAULT_CONFIG.dimensionLimits!.widthMax,
                heightWarning: Math.min(
                    tenantSettings.dimensionLimits?.heightWarning ?? SYSTEM_DEFAULT_CONFIG.dimensionLimits!.heightWarning,
                    SYSTEM_DEFAULT_CONFIG.dimensionLimits!.heightMax
                ),
                widthWarning: Math.min(
                    tenantSettings.dimensionLimits?.widthWarning ?? SYSTEM_DEFAULT_CONFIG.dimensionLimits!.widthWarning,
                    SYSTEM_DEFAULT_CONFIG.dimensionLimits!.widthMax
                ),
                enabled: tenantSettings.dimensionLimits?.enabled ?? SYSTEM_DEFAULT_CONFIG.dimensionLimits!.enabled
            }
        };
    }

    /**
     * 更新用户模式偏好
     */
    static async updateUserMode(userId: string, mode: 'simple' | 'advanced') {
        const existing = await db.query.quoteConfig.findFirst({
            where: and(
                eq(quoteConfig.type, 'USER'),
                eq(quoteConfig.entityId, userId)
            )
        });

        const newConfig = {
            ...(existing?.config as unknown as Partial<QuoteConfig> || {}),
            mode
        };

        if (existing) {
            await db.update(quoteConfig)
                .set({ config: newConfig, updatedAt: new Date() })
                .where(eq(quoteConfig.id, existing.id));
        } else {
            await db.insert(quoteConfig).values({
                type: 'USER',
                entityId: userId,
                config: newConfig
            });
        }
    }

    /**
     * 更新租户全局配置 (仅限管理员)
     */
    static async updateTenantConfig(tenantId: string, config: Partial<QuoteConfig>) {
        const existing = await db.query.quoteConfig.findFirst({
            where: and(
                eq(quoteConfig.type, 'TENANT'),
                eq(quoteConfig.entityId, tenantId)
            )
        });

        const newConfig = {
            ...(existing?.config as unknown as Partial<QuoteConfig> || {}),
            ...config
        };

        if (existing) {
            await db.update(quoteConfig)
                .set({ config: newConfig, updatedAt: new Date() })
                .where(eq(quoteConfig.id, existing.id));
        } else {
            await db.insert(quoteConfig).values({
                type: 'TENANT',
                entityId: tenantId,
                config: newConfig
            });
        }
    }

    /**
     * 更新用户默认方案偏好 (Update User Plan Preference)
     */
    static async updateUserPlan(userId: string, plan: 'ECONOMIC' | 'COMFORT' | 'LUXURY') {
        const existing = await db.query.quoteConfig.findFirst({
            where: and(
                eq(quoteConfig.type, 'USER'),
                eq(quoteConfig.entityId, userId)
            )
        });

        const newConfig = {
            ...(existing?.config as unknown as Partial<QuoteConfig> || {}),
            defaultPlan: plan
        };

        if (existing) {
            await db.update(quoteConfig)
                .set({ config: newConfig, updatedAt: new Date() })
                .where(eq(quoteConfig.id, existing.id));
        } else {
            await db.insert(quoteConfig).values({
                type: 'USER',
                entityId: userId,
                config: newConfig
            });
        }
    }

    /**
     * 获取特定方案的配置 (Get Specific Plan Settings)
     */
    static async getPlanSettings(
        tenantId: string,
        userId: string,
        plan: 'ECONOMIC' | 'COMFORT' | 'LUXURY'
    ): Promise<QuotePlanSettings> {
        const config = await this.getMergedConfig(tenantId, userId);
        return config.planSettings?.[plan] || SYSTEM_DEFAULT_CONFIG.planSettings![plan]!;
    }

    /**
     * 获取空间分组配置 (Get Room Groups)
     * 优先返回租户自定义配置，否则返回系统默认配置
     */
    static async getRoomGroups(tenantId: string): Promise<RoomGroup[]> {
        const tenantData = await db.query.quoteConfig.findFirst({
            where: and(
                eq(quoteConfig.type, 'TENANT'),
                eq(quoteConfig.entityId, tenantId)
            )
        });

        const tenantSettings = (tenantData?.config as unknown as Partial<QuoteConfig>) || {};
        return tenantSettings.roomGroups || SYSTEM_DEFAULT_CONFIG.roomGroups!;
    }

    /**
     * 更新空间分组配置 (Update Room Groups)
     * 仅限管理员操作
     */
    static async updateRoomGroups(tenantId: string, roomGroups: RoomGroup[]) {
        const existing = await db.query.quoteConfig.findFirst({
            where: and(
                eq(quoteConfig.type, 'TENANT'),
                eq(quoteConfig.entityId, tenantId)
            )
        });

        const newConfig = {
            ...(existing?.config as unknown as Partial<QuoteConfig> || {}),
            roomGroups
        };

        if (existing) {
            await db.update(quoteConfig)
                .set({ config: newConfig, updatedAt: new Date() })
                .where(eq(quoteConfig.id, existing.id));
        } else {
            await db.insert(quoteConfig).values({
                type: 'TENANT',
                entityId: tenantId,
                config: newConfig
            });
        }
    }
}
