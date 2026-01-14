import { PERMISSIONS } from './roles';
import { LayoutDashboard, ShoppingCart, FileText, Users, Truck, Wrench, Wallet, ShieldCheck, Settings } from 'lucide-react';

export interface ModuleConfig {
    code: string;
    name: string;
    path: string;
    icon?: any;
    permissions?: string[];
    children?: ModuleConfig[];
}

export const MODULES: ModuleConfig[] = [
    { code: 'DASHBOARD', name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { code: 'ORDERS', name: 'Orders', path: '/orders', icon: ShoppingCart, permissions: [PERMISSIONS.ORDER.VIEW] },
    { code: 'QUOTES', name: 'Quotes', path: '/quotes', icon: FileText, permissions: [PERMISSIONS.QUOTE.VIEW] },
    { code: 'CUSTOMERS', name: 'Customers', path: '/customers', icon: Users, permissions: [PERMISSIONS.CUSTOMER.VIEW] },
    { code: 'SUPPLY_CHAIN', name: 'Supply Chain', path: '/supply-chain', icon: Truck, permissions: [PERMISSIONS.PO.VIEW] },
    { code: 'SERVICE', name: 'Service', path: '/service', icon: Wrench, permissions: [PERMISSIONS.INSTALL.VIEW] },
    { code: 'FINANCE', name: 'Finance', path: '/finance', icon: Wallet, permissions: [PERMISSIONS.FINANCE.VIEW] },
    { code: 'ADMIN', name: 'Admin', path: '/admin', icon: ShieldCheck, permissions: [] }, // TODO: Add admin perm
    { code: 'SETTINGS', name: 'Settings', path: '/settings', icon: Settings },
];
