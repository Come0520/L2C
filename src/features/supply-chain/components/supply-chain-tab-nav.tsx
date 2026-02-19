'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { cn } from '@/shared/lib/utils';
import Package from 'lucide-react/dist/esm/icons/package';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import Factory from 'lucide-react/dist/esm/icons/factory';
import Warehouse from 'lucide-react/dist/esm/icons/warehouse';
import Users from 'lucide-react/dist/esm/icons/users';
import Cog from 'lucide-react/dist/esm/icons/cog';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Ruler from 'lucide-react/dist/esm/icons/ruler';

// 定义 Tab 类型
interface TabItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
}

// 模块 A：采购作业 (Operations)
const OPERATION_TABS: TabItem[] = [
    {
        label: '工作台',
        href: '/supply-chain/overview',
        icon: LayoutDashboard,
        description: '采购任务概览与预警',
    },
    {
        label: '采购单',
        href: '/supply-chain/purchase-orders',
        icon: ShoppingCart,
        description: '采购订单全流程管理',
    },
    {
        label: '加工单',
        href: '/supply-chain/processing-orders',
        icon: Factory,
        description: '外协加工任务管理',
    },
    {
        label: '库存',
        href: '/supply-chain/inventory',
        icon: Warehouse,
        description: '库存查询与作业',
    },
];

// 模块 B：供应链基础 (Foundation)
const FOUNDATION_TABS: TabItem[] = [
    {
        label: '商品中心',
        href: '/supply-chain/products',
        icon: Package,
        description: '商品库与SKU管理',
    },
    {
        label: '供应商',
        href: '/supply-chain/suppliers',
        icon: Users,
        description: '供应商资源库',
    },
    {
        label: '加工厂',
        href: '/supply-chain/processors',
        icon: Cog,
        description: '加工合作伙伴',
    },
    {
        label: '规则配置',
        href: '/supply-chain/rules',
        icon: Ruler,
        description: '拆单与业务规则',
    },
];

type ModuleType = 'operations' | 'foundation';

export function SupplyChainTabNav() {
    const pathname = usePathname();
    const router = useRouter();

    // Determine current module based on path
    const isFoundation = FOUNDATION_TABS.some(tab => pathname.startsWith(tab.href));
    const currentModule: ModuleType = isFoundation ? 'foundation' : 'operations';

    const currentTabs = currentModule === 'operations' ? OPERATION_TABS : FOUNDATION_TABS;
    const activeTab = currentTabs.find(tab => pathname.startsWith(tab.href)) || currentTabs[0];

    // Module Switcher Handler
    const handleModuleSwitch = (module: ModuleType) => {
        if (module === 'operations') {
            router.push('/supply-chain/overview');
        } else {
            router.push('/supply-chain/products');
        }
    };

    const handleTabChange = (value: string) => {
        router.push(value);
    };

    return (
        <div className="w-full space-y-4">
            {/* Module Switcher (Top Level) */}
            <div className="flex items-center space-x-2 bg-muted/50 p-1 rounded-lg w-fit">
                <button
                    onClick={() => handleModuleSwitch('operations')}
                    className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                        currentModule === 'operations'
                            ? "bg-white text-primary shadow-sm"
                            : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                    )}
                >
                    采购作业
                </button>
                <button
                    onClick={() => handleModuleSwitch('foundation')}
                    className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                        currentModule === 'foundation'
                            ? "bg-white text-primary shadow-sm"
                            : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                    )}
                >
                    基础设置
                </button>
            </div>

            {/* Sub Tabs (Second Level) */}
            <AnimatedTabs
                tabs={currentTabs.map(tab => ({
                    value: tab.href,
                    label: tab.label,
                    icon: <tab.icon className="h-4 w-4" />
                }))}
                activeTab={activeTab.href}
                onChange={handleTabChange}
                layoutId="supply-chain-sub-nav"
                tabClassName="px-4 py-2"
            />
        </div>
    );
}
