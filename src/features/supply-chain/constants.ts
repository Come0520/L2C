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
    IN_PRODUCTION: 'IN_PRODUCTION',
    READY: 'READY',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type POStatus = typeof PO_STATUS[keyof typeof PO_STATUS];

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
