/**
 * 权限定义
 */

export const PERMISSIONS = {
    SUPPLY_CHAIN: {
        VIEW: 'supply_chain:view',
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
