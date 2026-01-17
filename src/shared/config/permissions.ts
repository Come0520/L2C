/**
 * 权限定义
 */

export const PERMISSIONS = {
    ORDER: {
        VIEW: 'order.view',
        CREATE: 'order.create',
        EDIT: 'order.edit',
        DELETE: 'order.delete'
    },
    CUSTOMER: {
        VIEW: 'customer.view',
        CREATE: 'customer.create',
        EDIT: 'customer.edit',
        DELETE: 'customer.delete'
    },
    QUOTE: {
        VIEW: 'quote.view',
        CREATE: 'quote.create',
        EDIT: 'quote.edit',
        DELETE: 'quote.delete'
    },
    INSTALL: {
        VIEW: 'install.view',
        COMPLETE: 'install.complete',
        DISPATCH: 'install.dispatch'
    },
    MEASURE: {
        VIEW: 'measure.view',
        COMPLETE: 'measure.complete',
        DISPATCH: 'measure.dispatch'
    },
    FINANCE: {
        VIEW: 'finance.view',
        LABOR_VIEW: 'finance.labor_view'
    },
    AFTER_SALES: {
        VIEW: 'after_sales.view',
        CREATE: 'after_sales.create'
    },
    SUPPLY_CHAIN: {
        VIEW: 'supply_chain:view',
        MANAGE: 'supply_chain:manage',
        SUPPLIER_MANAGE: 'supply_chain:supplier_manage',
        PO_MANAGE: 'supply_chain:po_manage',
        STOCK_MANAGE: 'supply_chain:stock_manage',
    },
    PRODUCTS: {
        VIEW: 'products:view',
        MANAGE: 'products:manage',
    },
    ADMIN: {
        SETTINGS: 'admin:settings',
    },
    ANALYTICS: {
        VIEW: 'analytics:view',
        VIEW_ALL: 'analytics:view_all',
    },
    NOTIFICATION: {
        CREATE: 'notification:create',
        VIEW: 'notification:view',
    },
    SETTINGS: {
        USER_MANAGE: 'settings:user_manage',
    },
    GLOBAL: {
        VIEW: '*',
    },
    LEAD: {
        VIEW: 'lead.view',
        CREATE: 'lead.create',
        EDIT: 'lead.edit',
        DELETE: 'lead.delete',
        ASSIGN: 'lead.assign',
        TRANSFER: 'lead.transfer',
        IMPORT: 'lead.import',
        EXPORT: 'lead.export',
    }
} as const;
