import { PERMISSIONS } from './permissions';

export { PERMISSIONS };

export const ROLES = {
    ADMIN: { code: 'ADMIN', name: 'Admin', permissions: Object.values(PERMISSIONS).flatMap(obj => typeof obj === 'object' ? Object.values(obj) : []) },
    SALES: { code: 'SALES', name: 'Sales', permissions: [PERMISSIONS.ORDER.VIEW, PERMISSIONS.QUOTE.VIEW, PERMISSIONS.CUSTOMER.VIEW, PERMISSIONS.LEAD.VIEW, PERMISSIONS.LEAD.CREATE, PERMISSIONS.LEAD.EDIT] },
    WORKER: { code: 'WORKER', name: 'Worker', permissions: [PERMISSIONS.MEASURE.VIEW, PERMISSIONS.INSTALL.VIEW] },
    MANAGER: {
        code: 'MANAGER',
        name: 'Manager',
        permissions: [
            ...Object.values(PERMISSIONS.ORDER),
            ...Object.values(PERMISSIONS.QUOTE),
            ...Object.values(PERMISSIONS.CUSTOMER),
            ...Object.values(PERMISSIONS.INSTALL),
            ...Object.values(PERMISSIONS.MEASURE),
            PERMISSIONS.FINANCE.VIEW,
            PERMISSIONS.ADMIN.SETTINGS, // Crucial for Settings Access
            PERMISSIONS.PRODUCTS.MANAGE,
            PERMISSIONS.SUPPLY_CHAIN.MANAGE,
        ]
    },
    FINANCE: {
        code: 'FINANCE',
        name: 'Finance',
        permissions: [
            PERMISSIONS.FINANCE.VIEW,
            PERMISSIONS.ORDER.VIEW,
        ]
    },
    DISPATCHER: {
        code: 'DISPATCHER',
        name: 'Dispatcher',
        permissions: [
            PERMISSIONS.ORDER.VIEW,
            PERMISSIONS.MEASURE.DISPATCH,
            PERMISSIONS.INSTALL.DISPATCH,
        ]
    },
    INSTALLER: {
        code: 'INSTALLER',
        name: 'Installer',
        permissions: [
            PERMISSIONS.INSTALL.VIEW,
            PERMISSIONS.INSTALL.COMPLETE,
        ]
    },
    MEASURER: {
        code: 'MEASURER',
        name: 'Measurer',
        permissions: [
            PERMISSIONS.MEASURE.VIEW,
            PERMISSIONS.MEASURE.COMPLETE,
        ]
    }
};
