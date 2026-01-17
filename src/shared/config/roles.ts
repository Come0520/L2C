import { PERMISSIONS } from './permissions';

export { PERMISSIONS };

export const ROLES = {
    ADMIN: { code: 'ADMIN', name: 'Admin', permissions: Object.values(PERMISSIONS).flatMap(obj => typeof obj === 'object' ? Object.values(obj) : []) },
    SALES: { code: 'SALES', name: 'Sales', permissions: [PERMISSIONS.ORDER.VIEW, PERMISSIONS.QUOTE.VIEW] },
    WORKER: { code: 'WORKER', name: 'Worker', permissions: [PERMISSIONS.MEASURE.VIEW, PERMISSIONS.INSTALL.VIEW] },
};
