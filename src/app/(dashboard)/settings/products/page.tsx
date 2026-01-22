'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Suspense, useCallback, useMemo } from 'react';
import { cn } from '@/shared/lib/utils';

// 已有组件
import { PackageManager } from '@/features/products/components/package-manager';
import { AttributeTemplateManager } from '@/features/products/components/attribute-template-manager';

// 待开发组件
import { ChannelPriceManager } from '@/features/products/components/channel-price-manager';
import { BundleManager } from '@/features/products/components/bundle-manager';
import { ChannelDiscountManager } from '@/features/products/components/channel-discount-manager';

/**
 * Tab 配置
 */
const TABS = [
    { value: 'packages', label: '套餐管理', description: '管理商品套餐定价策略' },
    { value: 'channel-prices', label: '渠道专属价', description: '为特定渠道设置专属结算价' },
    { value: 'bundles', label: '组合商品', description: '管理组合SKU和BOM' },
    { value: 'channel-discounts', label: '渠道等级折扣', description: '配置S/A/B/C级渠道折扣率' },
    { value: 'templates', label: '属性模板', description: '配置品类动态属性和快速报价字段' },
] as const;

type TabValue = typeof TABS[number]['value'];

/**
 * 加载骨架屏
 */
function TabSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted rounded-lg w-full" />
            <div className="h-64 bg-muted rounded-lg w-full" />
        </div>
    );
}

/**
 * Tab 按钮组件
 */
function TabButton({
    tab,
    isActive,
    onClick
}: {
    tab: typeof TABS[number];
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                "hover:bg-muted/80",
                isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
            )}
        >
            {tab.label}
        </button>
    );
}

/**
 * 产品策略配置主页面
 * 
 * 功能：
 * - 套餐管理：创建/编辑商品套餐
 * - 渠道专属价：为特定渠道设置专属价格
 * - 组合商品：管理组合SKU
 * - 渠道等级折扣：配置S/A/B/C级渠道折扣
 * - 属性模板：配置品类属性和快速报价字段
 */
function ProductSettingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // 从 URL 获取当前 Tab，默认为 packages
    const currentTab = (searchParams.get('tab') as TabValue) || 'packages';

    /**
     * 切换 Tab 时更新 URL
     */
    const handleTabChange = useCallback((value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.push(`${pathname}?${params.toString()}`);
    }, [searchParams, router, pathname]);

    /**
     * 当前 Tab 的描述
     */
    const currentTabInfo = useMemo(() => {
        return TABS.find(t => t.value === currentTab);
    }, [currentTab]);

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">产品策略配置</h1>
                <p className="text-muted-foreground mt-1">
                    管理商品套餐、渠道定价、组合商品和属性模板
                </p>
            </div>

            {/* Tab 导航 */}
            <div className="space-y-6">
                {/* Tab 按钮组 */}
                <div className="flex flex-wrap gap-2 p-1 bg-muted/50 rounded-lg">
                    {TABS.map((tab) => (
                        <TabButton
                            key={tab.value}
                            tab={tab}
                            isActive={currentTab === tab.value}
                            onClick={() => handleTabChange(tab.value)}
                        />
                    ))}
                </div>

                {/* Tab 描述 */}
                {currentTabInfo && (
                    <p className="text-sm text-muted-foreground">
                        {currentTabInfo.description}
                    </p>
                )}

                {/* Tab 内容 */}
                <div className="min-h-[400px]">
                    {currentTab === 'packages' && (
                        <Suspense fallback={<TabSkeleton />}>
                            <PackageManager />
                        </Suspense>
                    )}

                    {currentTab === 'channel-prices' && (
                        <Suspense fallback={<TabSkeleton />}>
                            <ChannelPriceManager />
                        </Suspense>
                    )}

                    {currentTab === 'bundles' && (
                        <Suspense fallback={<TabSkeleton />}>
                            <BundleManager />
                        </Suspense>
                    )}

                    {currentTab === 'channel-discounts' && (
                        <Suspense fallback={<TabSkeleton />}>
                            <ChannelDiscountManager />
                        </Suspense>
                    )}

                    {currentTab === 'templates' && (
                        <Suspense fallback={<TabSkeleton />}>
                            <AttributeTemplateManager />
                        </Suspense>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * 主页面导出
 */
export default function ProductSettingsPage() {
    return (
        <Suspense fallback={<TabSkeleton />}>
            <ProductSettingsContent />
        </Suspense>
    );
}
