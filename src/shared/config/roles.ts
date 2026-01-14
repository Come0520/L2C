export const PERMISSIONS = {
    ORDER: { VIEW: 'order.view', CREATE: 'order.create', EDIT: 'order.edit', DELETE: 'order.delete' },
    CUSTOMER: { VIEW: 'customer.view', CREATE: 'customer.create', EDIT: 'customer.edit', DELETE: 'customer.delete' },
    QUOTE: { VIEW: 'quote.view', CREATE: 'quote.create', EDIT: 'quote.edit', DELETE: 'quote.delete' },
    INSTALL: { VIEW: 'install.view', COMPLETE: 'install.complete', DISPATCH: 'install.dispatch' },
    MEASURE: { VIEW: 'measure.view', COMPLETE: 'measure.complete', DISPATCH: 'measure.dispatch' },
    PO: { VIEW: 'po.view', CREATE: 'po.create' },
    FINANCE: { VIEW: 'finance.view', LABOR_VIEW: 'finance.labor_view' },
    LEAD: { VIEW: 'lead.view', CREATE: 'lead.create' },
    AFTER_SALES: { VIEW: 'after_sales.view', CREATE: 'after_sales.create' },
};

export const ROLES = {
    ADMIN: { code: 'ADMIN', name: 'Admin', permissions: Object.values(PERMISSIONS).flatMap(Object.values) },
    SALES: { code: 'SALES', name: 'Sales', permissions: [PERMISSIONS.ORDER.VIEW, PERMISSIONS.QUOTE.VIEW] },
    WORKER: { code: 'WORKER', name: 'Worker', permissions: [PERMISSIONS.MEASURE.VIEW, PERMISSIONS.INSTALL.VIEW] },
};
