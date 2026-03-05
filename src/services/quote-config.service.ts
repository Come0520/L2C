import { db } from '@/shared/api/db';
import { quoteConfig } from '@/shared/api/schema/quote-config';
import { tenants } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import {
  DEFAULT_QUOTE_MODE_CONFIG,
  type QuoteModeConfig,
} from '@/features/settings/lib/quote-mode-constants';

/**
 * 联动规则定义 (Linkage Rule Definition)
 */
export interface LinkageRule {
  mainCategory: string;
  targetCategory: string;
  matchPattern?: string; // 产品名称匹配模式 (可选)
  calcLogic: 'FINISHED_WIDTH' | 'FINISHED_HEIGHT' | 'FIXED' | 'PROPORTIONAL';
  ratio?: number; // 针对 PROPORTIONAL 或辅助计算
}

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
  markup: number; // 加价率 (0.1 = 10%)
  quality: string; // 质量档次描述
  description?: string; // 适用场景描述
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

  /** BOM自动联动模板设定 (BOM Linkage Templates) */
  bomTemplates?: LinkageRule[];
}

/**
 * 系统默认配置 (System Default)
 */
const SYSTEM_DEFAULT_CONFIG: QuoteConfig = {
  mode: 'simple',
  defaultPlan: 'COMFORT',
  planSettings: {
    ECONOMIC: {
      markup: 0.15, // 15% 加价
      quality: '经济实惠',
      description: '适合预算有限的客户，保证基本质量',
    },
    COMFORT: {
      markup: 0.3, // 30% 加价
      quality: '舒适品质',
      description: '性价比之选，满足大多数客户需求',
    },
    LUXURY: {
      markup: 0.5, // 50% 加价
      quality: '豪华尊享',
      description: '高端品质，极致体验',
    },
  },
  visibleFields: ['productName', 'width', 'height', 'quantity', 'unitPrice', 'subtotal'],
  presetLoss: {
    curtain: {
      sideLoss: 5,
      bottomLoss: 10,
      headerLossWrapped: 20,
      headerLossAttached: 7,
      defaultHeaderType: 'WRAPPED',
      defaultFoldRatio: 2,
      heightWarningThreshold: 275,
    },
    wallpaper: { widthLoss: 20, cutLoss: 10 },
  },
  discountControl: {
    minDiscountRate: 0.8,
    requireApprovalBelow: 0.9,
  },
  bomTemplates: [
    // 窗帘联动
    { mainCategory: 'CURTAIN', targetCategory: 'SERVICE', calcLogic: 'FINISHED_WIDTH' }, // 加工费(SERVICE)按成品宽
    { mainCategory: 'CURTAIN', targetCategory: 'CURTAIN_TRACK', calcLogic: 'FINISHED_WIDTH' }, // 轨道按成品宽
    { mainCategory: 'CURTAIN', targetCategory: 'CURTAIN_ACCESSORY', calcLogic: 'FINISHED_WIDTH' }, // 布带(ACCESSORY)按成品宽

    // 墙纸联动
    {
      mainCategory: 'WALLPAPER',
      targetCategory: 'WALLCLOTH_ACCESSORY',
      calcLogic: 'PROPORTIONAL',
      ratio: 0.2,
    }, // 胶水(ACCESSORY)按面积换算
    { mainCategory: 'WALLPAPER', targetCategory: 'SERVICE', calcLogic: 'PROPORTIONAL', ratio: 1.0 }, // 墙纸人工费(SERVICE)按卷
  ],
  /**
   * 尺寸限制系统默认配置
   * - 系统级硬限制：高度 1000cm，宽度 2000cm（不可超过）
   * - 警告阈值：高度 400cm（复式/挑高），宽度 1000cm（需分段）
   * - 租户可自定义更低的警告阈值，但硬限制不可调整
   */
  dimensionLimits: {
    heightWarning: 400, // 超过 400cm 提示是否为复式/挑高
    heightMax: 1000, // 系统硬限制，不可超过 1000cm
    widthWarning: 1000, // 超过 1000cm 提示是否需分段
    widthMax: 2000, // 系统硬限制，不可超过 2000cm
    enabled: true,
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
  ],
};

/**
 * 报价配置服务 (Quote Configuration Service)
 * 处理租户配置、用户偏好与系统默认值的合并逻辑
 * Now backed by 'quote_config' table
 */
export class QuoteConfigService {
  /**
   * 内存配置缓存 (In-Memory Config Cache)
   * 键格式：`${tenantId}:${userId}`，TTL 为 60 秒。
   * 当租户或用户配置更新后，通过 `invalidateCache` 主动失效。
   */
  private static readonly _cache = new Map<string, { value: QuoteConfig; expiresAt: number }>();

  /** 缓存 TTL 60 秒 */
  private static readonly CACHE_TTL_MS = 60_000;

  /**
   * 使指定租户/用户的配置缓存立即失效 (Invalidate Cache)
   * 应在 `updateTenantConfig`、`updateUserMode`、`updateUserPlan` 后调用。
   *
   * @param tenantId - 租户 ID
   * @param userId - 用户 ID（可选，若不传则仅失效租户级缓存匹配项）
   */
  static invalidateCache(tenantId: string, userId?: string) {
    if (userId) {
      this._cache.delete(`${tenantId}:${userId}`);
    } else {
      // 失效该租户下所有缓存
      for (const key of this._cache.keys()) {
        if (key.startsWith(`${tenantId}:`)) this._cache.delete(key);
      }
    }
  }

  /**
   * 获取合并后的最终配置 (Get Merged Config)
   * 按优先级层次合并配置：系统默认 ← 租户全局配置 ← 用户个人偏好。
   * 返回的配置项包含：报价模式、方案设置、尺寸限制、空间分组、联动规则等。
   * 结果在 60 秒内使用内存缓存，避免高频页面加载时的重复 DB 查询。
   *
   * @param tenantId - 租户 ID
   * @param userId - 用户 ID，用于加载用户级个人偏好（模式选择、默认方案）
   * @returns 合并后的完整配置对象
   */
  static async getMergedConfig(tenantId: string, userId: string): Promise<QuoteConfig> {
    // 命中缓存则直接返回
    const cacheKey = `${tenantId}:${userId}`;
    const cached = this._cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const tenantData = await db.query.quoteConfig.findFirst({
      where: and(eq(quoteConfig.type, 'TENANT'), eq(quoteConfig.entityId, tenantId)),
    });

    // 2. Fetch User Config
    const userData = await db.query.quoteConfig.findFirst({
      where: and(eq(quoteConfig.type, 'USER'), eq(quoteConfig.entityId, userId)),
    });

    // 2.5 获取租户的快速报价字段配置 (Get Tenant's Quick Quote Field Config)
    const tenantRecord = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: { settings: true },
    });
    const tenantQuoteModeConfig = (tenantRecord?.settings as Record<string, unknown>)
      ?.quoteModeConfig as QuoteModeConfig | undefined;

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
          ...(userPrefs.presetLoss?.curtain || {}),
        },
        wallpaper: {
          ...SYSTEM_DEFAULT_CONFIG.presetLoss.wallpaper,
          ...(tenantSettings.presetLoss?.wallpaper || {}),
          ...(userPrefs.presetLoss?.wallpaper || {}),
        },
      },
      planSettings: {
        ECONOMIC: {
          ...SYSTEM_DEFAULT_CONFIG.planSettings!.ECONOMIC!,
          ...(tenantSettings.planSettings?.ECONOMIC || {}),
          ...(userPrefs.planSettings?.ECONOMIC || {}),
        },
        COMFORT: {
          ...SYSTEM_DEFAULT_CONFIG.planSettings!.COMFORT!,
          ...(tenantSettings.planSettings?.COMFORT || {}),
          ...(userPrefs.planSettings?.COMFORT || {}),
        },
        LUXURY: {
          ...SYSTEM_DEFAULT_CONFIG.planSettings!.LUXURY!,
          ...(tenantSettings.planSettings?.LUXURY || {}),
          ...(userPrefs.planSettings?.LUXURY || {}),
        },
      },
      // Logic: User mode overrides Tenant mode (unless we want strict enforcement)
      // Logic: Visible fields are union
      visibleFields: Array.from(
        new Set([
          ...SYSTEM_DEFAULT_CONFIG.visibleFields,
          ...(tenantSettings.visibleFields || []),
          ...(userPrefs.visibleFields || []),
        ])
      ),
      // 尺寸限制配置：租户可自定义警告阈值，但硬限制始终使用系统默认值
      dimensionLimits: {
        // 硬限制不可调整，始终使用系统默认值
        heightMax: SYSTEM_DEFAULT_CONFIG.dimensionLimits!.heightMax,
        widthMax: SYSTEM_DEFAULT_CONFIG.dimensionLimits!.widthMax,
        // 警告阈值可由租户自定义，但不能超过硬限制
        heightWarning: Math.min(
          tenantSettings.dimensionLimits?.heightWarning ??
            SYSTEM_DEFAULT_CONFIG.dimensionLimits!.heightWarning,
          SYSTEM_DEFAULT_CONFIG.dimensionLimits!.heightMax
        ),
        widthWarning: Math.min(
          tenantSettings.dimensionLimits?.widthWarning ??
            SYSTEM_DEFAULT_CONFIG.dimensionLimits!.widthWarning,
          SYSTEM_DEFAULT_CONFIG.dimensionLimits!.widthMax
        ),
        enabled:
          tenantSettings.dimensionLimits?.enabled ?? SYSTEM_DEFAULT_CONFIG.dimensionLimits!.enabled,
      },
      bomTemplates: tenantSettings.bomTemplates ?? SYSTEM_DEFAULT_CONFIG.bomTemplates,
    };

    // If advanced mode, ensure advanced fields are visible
    if (config.mode === 'advanced') {
      const advancedFields = [
        'foldRatio',
        'processFee',
        'remark',
        'measuredWidth',
        'measuredHeight',
      ];
      config.visibleFields = Array.from(new Set([...config.visibleFields, ...advancedFields]));
    } else {
      // 快速模式：使用租户配置的快速报价字段 (Quick Mode: Use tenant's quick quote fields)
      const quickModeFields =
        tenantQuoteModeConfig?.quickModeFields ?? DEFAULT_QUOTE_MODE_CONFIG.quickModeFields;
      config.visibleFields = quickModeFields;
    }

    // 写入缓存
    this._cache.set(cacheKey, {
      value: config,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    return config;
  }

  /**
   * 获取租户全局配置 (Get Tenant Config)
   * 仅读取租户库中存储的配置，不应用系统默认。
   *
   * @param tenantId - 租户 ID
   * @returns 租户配置（如未配置则返回系统默认）
   */
  static async getTenantConfig(tenantId: string): Promise<QuoteConfig> {
    const tenantData = await db.query.quoteConfig.findFirst({
      where: and(eq(quoteConfig.type, 'TENANT'), eq(quoteConfig.entityId, tenantId)),
    });

    const tenantSettings = (tenantData?.config as unknown as Partial<QuoteConfig>) || {};

    return {
      ...SYSTEM_DEFAULT_CONFIG,
      ...tenantSettings,
      presetLoss: {
        curtain: {
          ...SYSTEM_DEFAULT_CONFIG.presetLoss.curtain,
          ...tenantSettings.presetLoss?.curtain,
        },
        wallpaper: {
          ...SYSTEM_DEFAULT_CONFIG.presetLoss.wallpaper,
          ...tenantSettings.presetLoss?.wallpaper,
        },
      },
      visibleFields: Array.from(
        new Set([...SYSTEM_DEFAULT_CONFIG.visibleFields, ...(tenantSettings.visibleFields || [])])
      ),
      // 尺寸限制配置
      dimensionLimits: {
        heightMax: SYSTEM_DEFAULT_CONFIG.dimensionLimits!.heightMax,
        widthMax: SYSTEM_DEFAULT_CONFIG.dimensionLimits!.widthMax,
        heightWarning: Math.min(
          tenantSettings.dimensionLimits?.heightWarning ??
            SYSTEM_DEFAULT_CONFIG.dimensionLimits!.heightWarning,
          SYSTEM_DEFAULT_CONFIG.dimensionLimits!.heightMax
        ),
        widthWarning: Math.min(
          tenantSettings.dimensionLimits?.widthWarning ??
            SYSTEM_DEFAULT_CONFIG.dimensionLimits!.widthWarning,
          SYSTEM_DEFAULT_CONFIG.dimensionLimits!.widthMax
        ),
        enabled:
          tenantSettings.dimensionLimits?.enabled ?? SYSTEM_DEFAULT_CONFIG.dimensionLimits!.enabled,
      },
      bomTemplates: tenantSettings.bomTemplates ?? SYSTEM_DEFAULT_CONFIG.bomTemplates,
    };
  }

  /**
   * 更新用户模式个人偏好 (Update User Mode)
   * 将用户的报价模式选择（简单模式/高级模式）持久化到数据库。
   *
   * @param userId - 用户 ID
   * @param mode - 目标模式: `'simple'` 简单模式 | `'advanced'` 高级模式
   * @returns 更新操作结果
   */
  static async updateUserMode(userId: string, mode: 'simple' | 'advanced') {
    const existing = await db.query.quoteConfig.findFirst({
      where: and(eq(quoteConfig.type, 'USER'), eq(quoteConfig.entityId, userId)),
    });

    const newConfig = {
      ...((existing?.config as unknown as Partial<QuoteConfig>) || {}),
      mode,
    };

    if (existing) {
      await db
        .update(quoteConfig)
        .set({ config: newConfig, updatedAt: new Date() })
        .where(eq(quoteConfig.id, existing.id));
    } else {
      await db.insert(quoteConfig).values({
        type: 'USER',
        entityId: userId,
        config: newConfig,
      });
    }
  }

  /**
   * 更新租户全局配置 (Update Tenant Config)
   * 覆盖租户在数据库中存储的全局配置，支持部分更新。
   * 不影响系统默认配置。
   *
   * @param tenantId - 租户 ID
   * @param config - 要更新的配置内容（支持部分覆盖）
   * @returns 已应用的新配置
   * @security 🔒 仅限管理员调用
   */
  static async updateTenantConfig(tenantId: string, config: Partial<QuoteConfig>) {
    const existing = await db.query.quoteConfig.findFirst({
      where: and(eq(quoteConfig.type, 'TENANT'), eq(quoteConfig.entityId, tenantId)),
    });

    const newConfig = {
      ...((existing?.config as unknown as Partial<QuoteConfig>) || {}),
      ...config,
    };

    if (existing) {
      await db
        .update(quoteConfig)
        .set({ config: newConfig, updatedAt: new Date() })
        .where(eq(quoteConfig.id, existing.id));
    } else {
      await db.insert(quoteConfig).values({
        type: 'TENANT',
        entityId: tenantId,
        config: newConfig,
      });
    }
  }

  /**
   * 更新用户默认方案偏好 (Update User Plan Preference)
   * 将用户选择的报价方案默认偏好（经济/舂适/奔华）持久化到数据库。
   *
   * @param userId - 用户 ID
   * @param plan - 方案类型: `'ECONOMIC'` | `'COMFORT'` | `'LUXURY'`
   * @returns 更新操作结果
   */
  static async updateUserPlan(userId: string, plan: 'ECONOMIC' | 'COMFORT' | 'LUXURY') {
    const existing = await db.query.quoteConfig.findFirst({
      where: and(eq(quoteConfig.type, 'USER'), eq(quoteConfig.entityId, userId)),
    });

    const newConfig = {
      ...((existing?.config as unknown as Partial<QuoteConfig>) || {}),
      defaultPlan: plan,
    };

    if (existing) {
      await db
        .update(quoteConfig)
        .set({ config: newConfig, updatedAt: new Date() })
        .where(eq(quoteConfig.id, existing.id));
    } else {
      await db.insert(quoteConfig).values({
        type: 'USER',
        entityId: userId,
        config: newConfig,
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
      where: and(eq(quoteConfig.type, 'TENANT'), eq(quoteConfig.entityId, tenantId)),
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
      where: and(eq(quoteConfig.type, 'TENANT'), eq(quoteConfig.entityId, tenantId)),
    });

    const newConfig = {
      ...((existing?.config as unknown as Partial<QuoteConfig>) || {}),
      roomGroups,
    };

    if (existing) {
      await db
        .update(quoteConfig)
        .set({ config: newConfig, updatedAt: new Date() })
        .where(eq(quoteConfig.id, existing.id));
    } else {
      await db.insert(quoteConfig).values({
        type: 'TENANT',
        entityId: tenantId,
        config: newConfig,
      });
    }
  }
}
