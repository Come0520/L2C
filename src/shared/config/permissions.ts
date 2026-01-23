/**
 * 权限定义
 * 
 * 命名规范：
 * - module.action 格式（点号分隔）
 * - action: view, create, edit, delete, manage（完全控制）
 * 
 * 权限层级：
 * - VIEW: 只读访问
 * - CREATE: 创建新记录
 * - EDIT: 修改现有记录
 * - DELETE: 删除记录
 * - MANAGE: 完全控制（包含以上所有）
 */

export const PERMISSIONS = {
    // 订单模块 - 完整 CRUD
    ORDER: {
        VIEW: 'order.view',
        CREATE: 'order.create',
        EDIT: 'order.edit',
        DELETE: 'order.delete',
        MANAGE: 'order.manage',
    },

    // 客户模块 - 完整 CRUD
    CUSTOMER: {
        VIEW: 'customer.view',
        CREATE: 'customer.create',
        EDIT: 'customer.edit',
        DELETE: 'customer.delete',
        MANAGE: 'customer.manage',
    },

    // 报价模块 - 完整 CRUD
    QUOTE: {
        VIEW: 'quote.view',
        CREATE: 'quote.create',
        EDIT: 'quote.edit',
        DELETE: 'quote.delete',
        MANAGE: 'quote.manage',
    },

    // 线索模块 - 完整 CRUD + 专项权限
    LEAD: {
        VIEW: 'lead.view',
        CREATE: 'lead.create',
        EDIT: 'lead.edit',
        DELETE: 'lead.delete',
        ASSIGN: 'lead.assign',
        TRANSFER: 'lead.transfer',
        IMPORT: 'lead.import',
        EXPORT: 'lead.export',
        MANAGE: 'lead.manage',
    },

    // 财务模块 - 扩展为完整 CRUD
    FINANCE: {
        VIEW: 'finance.view',
        CREATE: 'finance.create',
        EDIT: 'finance.edit',
        DELETE: 'finance.delete',
        APPROVE: 'finance.approve',
        LABOR_VIEW: 'finance.labor_view',
        MANAGE: 'finance.manage',
    },

    // 产品模块 - 扩展为完整 CRUD
    PRODUCTS: {
        VIEW: 'products.view',
        CREATE: 'products.create',
        EDIT: 'products.edit',
        DELETE: 'products.delete',
        MANAGE: 'products.manage',
    },

    // 供应链模块 - 扩展为完整 CRUD
    SUPPLY_CHAIN: {
        VIEW: 'supply_chain.view',
        CREATE: 'supply_chain.create',
        EDIT: 'supply_chain.edit',
        DELETE: 'supply_chain.delete',
        SUPPLIER_MANAGE: 'supply_chain.supplier_manage',
        PO_MANAGE: 'supply_chain.po_manage',
        STOCK_MANAGE: 'supply_chain.stock_manage',
        MANAGE: 'supply_chain.manage',
    },

    // 安装模块 - 扩展为完整 CRUD
    INSTALL: {
        VIEW: 'install.view',
        CREATE: 'install.create',
        EDIT: 'install.edit',
        DELETE: 'install.delete',
        COMPLETE: 'install.complete',
        DISPATCH: 'install.dispatch',
        MANAGE: 'install.manage',
    },

    // 测量模块 - 扩展为完整 CRUD
    MEASURE: {
        VIEW: 'measure.view',
        CREATE: 'measure.create',
        EDIT: 'measure.edit',
        DELETE: 'measure.delete',
        COMPLETE: 'measure.complete',
        DISPATCH: 'measure.dispatch',
        MANAGE: 'measure.manage',
    },

    // 售后模块 - 扩展为完整 CRUD
    AFTER_SALES: {
        VIEW: 'after_sales.view',
        CREATE: 'after_sales.create',
        EDIT: 'after_sales.edit',
        DELETE: 'after_sales.delete',
        MANAGE: 'after_sales.manage',
    },

    // 渠道模块 - 新增
    CHANNEL: {
        VIEW: 'channel.view',
        CREATE: 'channel.create',
        EDIT: 'channel.edit',
        DELETE: 'channel.delete',
        MANAGE_COMMISSION: 'channel.manage_commission',  // 佣金管理权限
        MANAGE_SETTLEMENT: 'channel.manage_settlement',  // 结算单管理权限
        MANAGE: 'channel.manage',
    },

    // 管理员权限
    ADMIN: {
        SETTINGS: 'admin.settings',
        USER_MANAGE: 'admin.user_manage',
        ROLE_MANAGE: 'admin.role_manage',
        TENANT_MANAGE: 'admin.tenant_manage',
    },

    // 数据分析权限
    ANALYTICS: {
        VIEW: 'analytics.view',
        VIEW_ALL: 'analytics.view_all',
        EXPORT: 'analytics.export',
    },

    // 通知权限
    NOTIFICATION: {
        CREATE: 'notification.create',
        VIEW: 'notification.view',
        MANAGE: 'notification.manage',
    },

    // 设置权限
    SETTINGS: {
        VIEW: 'settings.view',
        USER_MANAGE: 'settings.user_manage',
        MANAGE: 'settings.manage',
    },

    // 全局权限
    GLOBAL: {
        VIEW: '*',           // 超级查看权限
        ADMIN: '**',         // 超级管理员
    },
} as const;

/**
 * 权限类型导出
 */
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];

/**
 * 权限分组（用于角色配置 UI）
 */
export const PERMISSION_GROUPS = [
    { key: 'ORDER', label: '订单管理', permissions: PERMISSIONS.ORDER },
    { key: 'CUSTOMER', label: '客户管理', permissions: PERMISSIONS.CUSTOMER },
    { key: 'QUOTE', label: '报价管理', permissions: PERMISSIONS.QUOTE },
    { key: 'LEAD', label: '线索管理', permissions: PERMISSIONS.LEAD },
    { key: 'FINANCE', label: '财务管理', permissions: PERMISSIONS.FINANCE },
    { key: 'PRODUCTS', label: '产品管理', permissions: PERMISSIONS.PRODUCTS },
    { key: 'SUPPLY_CHAIN', label: '供应链管理', permissions: PERMISSIONS.SUPPLY_CHAIN },
    { key: 'INSTALL', label: '安装服务', permissions: PERMISSIONS.INSTALL },
    { key: 'MEASURE', label: '测量服务', permissions: PERMISSIONS.MEASURE },
    { key: 'AFTER_SALES', label: '售后服务', permissions: PERMISSIONS.AFTER_SALES },
    { key: 'CHANNEL', label: '渠道管理', permissions: PERMISSIONS.CHANNEL },
    { key: 'ANALYTICS', label: '数据分析', permissions: PERMISSIONS.ANALYTICS },
    { key: 'SETTINGS', label: '系统设置', permissions: PERMISSIONS.SETTINGS },
    { key: 'ADMIN', label: '管理员', permissions: PERMISSIONS.ADMIN },
] as const;
