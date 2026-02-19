/**
 * 供应链模块常量定义
 * 包含错误消息、状态枚举和配置常量
 */

// ============ 错误消息常量 ============
export const SUPPLY_CHAIN_ERRORS = {
    // 通用错误
    UNAUTHORIZED: '未授权',
    VALIDATION_FAILED: '输入验证失败',

    // 权限相关
    NO_PO_PERMISSION: '无采购单管理权限',
    NO_VIEW_PERMISSION: '无供应链查看权限',
    NO_MANAGE_PERMISSION: '无供应链管理权限',
    NO_SETTINGS_PERMISSION: '无设置管理权限',

    // 供应商错误
    SUPPLIER_NOT_FOUND: '供应商不存在或无权访问',

    // 采购单错误
    PO_NOT_FOUND: '采购单不存在',
    PO_BATCH_MISMATCH: (found: number, total: number) => `找到 ${found}/${total} 个采购单`,
    NO_DRAFT_PO_TO_DELETE: '没有可删除的草稿采购单',

    // 产品错误
    UNKNOWN_PRODUCT: '未知产品',
    UNKNOWN_SUPPLIER: '未知供应商',
} as const;

// ============ 采购单状态常量 ============
export const PO_STATUS = {
    DRAFT: 'DRAFT',
    PENDING_CONFIRMATION: 'PENDING_CONFIRMATION', // 待确认 (Was PENDING)
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    IN_PRODUCTION: 'IN_PRODUCTION',
    READY: 'READY',
    SHIPPED: 'SHIPPED',
    PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED', // 部分收货
    DELIVERED: 'DELIVERED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type POStatus = typeof PO_STATUS[keyof typeof PO_STATUS];

export const PO_STATUS_LABELS: Record<string, string> = {
    [PO_STATUS.DRAFT]: '草稿',
    [PO_STATUS.PENDING_CONFIRMATION]: '待确认',
    [PO_STATUS.PENDING_PAYMENT]: '待付款',
    [PO_STATUS.IN_PRODUCTION]: '生产中',
    [PO_STATUS.READY]: '备货完成',
    [PO_STATUS.SHIPPED]: '已发货',
    [PO_STATUS.PARTIALLY_RECEIVED]: '部分收货',
    [PO_STATUS.DELIVERED]: '已送达',
    [PO_STATUS.COMPLETED]: '已完成',
    [PO_STATUS.CANCELLED]: '已取消',
};

/**
 * 采购单有效状态转换映射
 * key: 当前状态, value: 允许转换到的目标状态列表
 */
export const VALID_PO_TRANSITIONS: Record<string, string[]> = {
    [PO_STATUS.DRAFT]: [PO_STATUS.PENDING_CONFIRMATION, PO_STATUS.CANCELLED],
    [PO_STATUS.PENDING_CONFIRMATION]: [PO_STATUS.PENDING_PAYMENT, PO_STATUS.CANCELLED],
    [PO_STATUS.PENDING_PAYMENT]: [PO_STATUS.IN_PRODUCTION, PO_STATUS.CANCELLED],
    [PO_STATUS.IN_PRODUCTION]: [PO_STATUS.READY, PO_STATUS.CANCELLED],
    [PO_STATUS.READY]: [PO_STATUS.SHIPPED, PO_STATUS.PARTIALLY_RECEIVED, PO_STATUS.COMPLETED],
    [PO_STATUS.SHIPPED]: [PO_STATUS.PARTIALLY_RECEIVED, PO_STATUS.COMPLETED],
    [PO_STATUS.PARTIALLY_RECEIVED]: [PO_STATUS.PARTIALLY_RECEIVED, PO_STATUS.COMPLETED],
    [PO_STATUS.DELIVERED]: [PO_STATUS.COMPLETED],
    [PO_STATUS.COMPLETED]: [],
    [PO_STATUS.CANCELLED]: [],
};

/**
 * 校验采购单状态转换是否合法
 */
export function isValidPoTransition(currentStatus: string, targetStatus: string): boolean {
    const allowed = VALID_PO_TRANSITIONS[currentStatus];
    return allowed ? allowed.includes(targetStatus) : false;
}

// ============ 加工单状态常量 ============
export const WORK_ORDER_STATUS = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type WorkOrderStatus = typeof WORK_ORDER_STATUS[keyof typeof WORK_ORDER_STATUS];

// ============ 路由路径常量 ============
export const SUPPLY_CHAIN_PATHS = {
    PURCHASE_ORDERS: '/supply-chain/purchase-orders',
    PENDING_POOL: '/supply-chain/pending-pool',
    PROCESSING_ORDERS: '/supply-chain/processing-orders',
    INVENTORY: '/supply-chain/inventory',
    SUPPLIERS: '/supply-chain/suppliers',
    RULES: '/supply-chain/rules',
    PRODUCT_BUNDLES: '/supply-chain/product-bundles',
} as const;

// ============ 业务配置常量 ============
export const PO_CONFIG = {
    // 采购单号前缀
    PO_NO_PREFIX: 'PO-',
    MERGED_PO_NO_PREFIX: 'PO-MERGED-',
} as const;

// ============ 统一 API 响应类型 ============

/**
 * 统一的 Action 响应类型
 * 所有 Server Actions 应使用此类型作为返回值
 */
export interface ActionResponse<T = undefined> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * 成功响应工厂函数
 */
export function successResponse<T>(data?: T, message?: string): ActionResponse<T> {
    return { success: true, data, message };
}

/**
 * 错误响应工厂函数
 */
export function errorResponse(error: string): ActionResponse<never> {
    return { success: false, error };
}
