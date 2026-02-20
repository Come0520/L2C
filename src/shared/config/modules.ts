import { PERMISSIONS } from './permissions';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Users from 'lucide-react/dist/esm/icons/users';
import Truck from 'lucide-react/dist/esm/icons/truck';
import Wrench from 'lucide-react/dist/esm/icons/wrench';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Settings from 'lucide-react/dist/esm/icons/settings';

export interface ModuleConfig {
    code: string;
    name: string;
    path: string;
    icon?: React.ComponentType<{ className?: string }>;
    permissions?: string[];
    children?: ModuleConfig[];
}

export const MODULES: ModuleConfig[] = [
    { code: 'DASHBOARD', name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { code: 'ORDERS', name: 'Orders', path: '/orders', icon: ShoppingCart, permissions: [PERMISSIONS.ORDER.VIEW] },
    { code: 'QUOTES', name: 'Quotes', path: '/quotes', icon: FileText, permissions: [PERMISSIONS.QUOTE.VIEW] },
    { code: 'CUSTOMERS', name: 'Customers', path: '/customers', icon: Users, permissions: [PERMISSIONS.CUSTOMER.VIEW] },
    { code: 'SUPPLY_CHAIN', name: 'Supply Chain', path: '/supply-chain', icon: Truck, permissions: [PERMISSIONS.SUPPLY_CHAIN.PO_MANAGE] },
    { code: 'SERVICE', name: 'Service', path: '/service', icon: Wrench, permissions: [PERMISSIONS.INSTALL.VIEW] },
    { code: 'FINANCE', name: 'Finance', path: '/finance', icon: Wallet, permissions: [PERMISSIONS.FINANCE.VIEW] },
    { code: 'ADMIN', name: 'Admin', path: '/admin', icon: ShieldCheck, permissions: [] }, // NOTE: Add admin perm
    { code: 'SETTINGS', name: 'Settings', path: '/settings', icon: Settings },
];
