/**
 * 套餐限额配置
 * 定义各套餐级别的资源上限与功能开关
 *
 * @example
 * ```ts
 * const limits = PLAN_LIMITS['base'];
 * console.log(limits.maxUsers); // 5
 * console.log(limits.features.dataExport); // false
 * ```
 */

/** 套餐类型 */
export type PlanType = 'base' | 'pro' | 'enterprise';

/** 功能开关集合 */
export interface PlanFeatures {
  /** 数据导出（Excel/PDF） */
  dataExport: boolean;
  /** 多级审批流程 */
  multiLevelApproval: boolean;
  /** 品牌自定义（自有 Logo / 报价单模板 / 小程序登录页） */
  brandCustomization: boolean;
  /** 高级数据分析（历史趋势、多维报表） */
  advancedAnalytics: boolean;
  /** API 开放接口 */
  apiAccess: boolean;
  /** 多门店管理 */
  multiStore: boolean;
}

/** 单个套餐的完整限额定义 */
export interface PlanLimitConfig {
  /** 套餐名称（中文） */
  label: string;
  /** 最大用户数 */
  maxUsers: number;
  /** 最大客户数 */
  maxCustomers: number;
  /** 每月最大报价单数 */
  maxQuotesPerMonth: number;
  /** 每月最大订单数 */
  maxOrdersPerMonth: number;
  /** 云展厅最大产品数 */
  maxShowroomProducts: number;
  /** 最大存储空间（字节） */
  maxStorageBytes: number;
  /** 功能开关 */
  features: PlanFeatures;
}

/** 所有套餐限额配置 */
export type PlanLimitsMap = Record<PlanType, PlanLimitConfig>;

/**
 * 套餐限额静态配置
 *
 * 决策记录（2026-03-02 已确认）：
 * - 免费版：≤5 人、≤200 客户、≤50 报价/月、≤200 展厅产品
 * - 专业版：¥9.9/月，≤15 人、≤5000 客户、不限报价/订单
 * - 企业版：按需报价，不限所有维度，支持本地化私有部署
 */
export const PLAN_LIMITS: PlanLimitsMap = {
  base: {
    label: '基础版 (Base)',
    maxUsers: 5,
    maxCustomers: 200,
    maxQuotesPerMonth: 50,
    maxOrdersPerMonth: 30,
    maxShowroomProducts: 200,
    maxStorageBytes: 500 * 1024 * 1024, // 500MB
    features: {
      dataExport: false,
      multiLevelApproval: false,
      brandCustomization: false,
      advancedAnalytics: false,
      apiAccess: false,
      multiStore: false,
    },
  },
  pro: {
    label: '专业版 (Pro)',
    maxUsers: 15,
    maxCustomers: 5_000,
    maxQuotesPerMonth: Infinity,
    maxOrdersPerMonth: Infinity,
    maxShowroomProducts: 500,
    maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5GB
    features: {
      dataExport: true,
      multiLevelApproval: true,
      brandCustomization: true,
      advancedAnalytics: true,
      apiAccess: false,
      multiStore: false,
    },
  },
  enterprise: {
    label: '企业版 (Enterprise)',
    maxUsers: Infinity,
    maxCustomers: Infinity,
    maxQuotesPerMonth: Infinity,
    maxOrdersPerMonth: Infinity,
    maxShowroomProducts: Infinity,
    maxStorageBytes: 50 * 1024 * 1024 * 1024, // 50GB
    features: {
      dataExport: true,
      multiLevelApproval: true,
      brandCustomization: true,
      advancedAnalytics: true,
      apiAccess: true,
      multiStore: true,
    },
  },
} as const;

// ==================== 辅助工具 ====================

/** 资源类型，用于限额检查 */
export type PlanResource =
  | 'users'
  | 'customers'
  | 'quotesPerMonth'
  | 'ordersPerMonth'
  | 'showroomProducts'
  | 'storageBytes';

/** 资源名称到限额字段的映射 */
const RESOURCE_TO_LIMIT_FIELD: Record<PlanResource, keyof PlanLimitConfig> = {
  users: 'maxUsers',
  customers: 'maxCustomers',
  quotesPerMonth: 'maxQuotesPerMonth',
  ordersPerMonth: 'maxOrdersPerMonth',
  showroomProducts: 'maxShowroomProducts',
  storageBytes: 'maxStorageBytes',
};

/** 限额检查结果 */
export interface PlanLimitCheckResult {
  /** 是否允许继续操作 */
  allowed: boolean;
  /** 当前已用量 */
  current: number;
  /** 该资源的上限 */
  limit: number;
  /** 套餐类型 */
  planType: PlanType;
}

/**
 * 获取某个套餐下某项资源的上限值
 */
export function getPlanLimit(planType: PlanType, resource: PlanResource): number {
  const config = PLAN_LIMITS[planType];
  const field = RESOURCE_TO_LIMIT_FIELD[resource];
  return config[field] as number;
}

/**
 * 检查某项功能是否在套餐中可用
 */
export function isPlanFeatureEnabled(planType: PlanType, feature: keyof PlanFeatures): boolean {
  return PLAN_LIMITS[planType].features[feature];
}

/**
 * 纯函数：对比当前用量与限额，返回检查结果
 * （不含数据库查询，方便单元测试）
 */
export function checkLimit(
  planType: PlanType,
  resource: PlanResource,
  currentUsage: number
): PlanLimitCheckResult {
  const limit = getPlanLimit(planType, resource);
  return {
    allowed: currentUsage < limit,
    current: currentUsage,
    limit,
    planType,
  };
}

/**
 * 格式化限额数字为人类可读文本
 * Infinity → "不限"，其余正常显示
 */
export function formatLimit(value: number): string {
  if (!Number.isFinite(value)) return '不限';
  if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(0)}GB`;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(0)}MB`;
  return value.toLocaleString('zh-CN');
}
