'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import Package from 'lucide-react/dist/esm/icons/package';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import Factory from 'lucide-react/dist/esm/icons/factory';
import Warehouse from 'lucide-react/dist/esm/icons/warehouse';
import Users from 'lucide-react/dist/esm/icons/users';
import Cog from 'lucide-react/dist/esm/icons/cog';

/**
 * 供应链模块Tab导航配置
 */
const supplyChainTabs = [
    {
        label: '商品管理',
        href: '/supply-chain/products',
        icon: Package,
        description: '管理商品主数据、SKU、价格',
    },
    {
        label: '采购单',
        href: '/supply-chain/purchase-orders',
        icon: ShoppingCart,
        description: '采购订单管理',
    },
    {
        label: '加工单',
        href: '/supply-chain/processing-orders',
        icon: Factory,
        description: '加工订单管理',
    },
    {
        label: '库存管理',
        href: '/supply-chain/inventory',
        icon: Warehouse,
        description: '库存盘点与管理',
    },
    {
        label: '供应商',
        href: '/supply-chain/suppliers',
        icon: Users,
        description: '面料/配件供应商管理',
    },
    {
        label: '加工厂',
        href: '/supply-chain/processors',
        icon: Cog,
        description: '窗帘加工厂管理',
    },
];

/**
 * 供应链模块顶部Tab导航组件
 */
export function SupplyChainTabNav() {
    const pathname = usePathname();

    return (
        <div className="space-y-2">
            <h1 className="text-2xl font-bold">供应链管理</h1>
            <nav className="flex items-center gap-1 overflow-x-auto pb-1">
                {supplyChainTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = pathname.startsWith(tab.href);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
