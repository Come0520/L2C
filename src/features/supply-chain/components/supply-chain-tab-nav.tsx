'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
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
    const router = useRouter();

    // Find active tab based on current path
    // Default to first one if no match (though usually there should be a match or handle explicitly)
    const activeTab = supplyChainTabs.find(tab => pathname.startsWith(tab.href))?.href || supplyChainTabs[0].href;

    const handleTabChange = (value: string) => {
        router.push(value);
    };

    const formattedTabs = supplyChainTabs.map(tab => ({
        value: tab.href,
        label: tab.label,
        icon: <tab.icon className="h-4 w-4" />
    }));

    return (
        <div className="w-full">
            <AnimatedTabs
                tabs={formattedTabs}
                activeTab={activeTab}
                onChange={handleTabChange}
                layoutId="supply-chain-nav"
                tabClassName="px-4 py-2"
            />
        </div>
    );
}
