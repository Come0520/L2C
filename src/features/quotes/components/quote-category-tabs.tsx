'use client';

import { cn } from '@/shared/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Button } from '@/shared/ui/button';
import ArrowLeftRight from 'lucide-react/dist/esm/icons/arrow-left-right';

/**
 * 报价单支持的品类类型（SUMMARY 为汇总页）
 */
export type QuoteCategory = 'SUMMARY' | 'CURTAIN' | 'WALLCLOTH' | 'WALLPAPER' | 'WALL_PANEL' | 'WINDOWPAD' | 'STANDARD';

/**
 * 品类配置
 */
const CATEGORY_CONFIG: Record<QuoteCategory, { label: string; icon?: string }> = {
    SUMMARY: { label: '汇总' },
    CURTAIN: { label: '窗帘' },
    WALLCLOTH: { label: '墙布' },
    WALLPAPER: { label: '墙纸' },
    WALL_PANEL: { label: '墙咔' },
    WINDOWPAD: { label: '飘窗垫' },
    STANDARD: { label: '标品' },
};

/**
 * UI 标签页到数据库商品品类的映射
 * 用于限制在某个标签页下只能添加对应品类的商品
 * 注意：SUMMARY 不需要映射，因为它是汇总页
 * 
 * 完整映射检查（对应 productCategoryEnum）:
 * - CURTAIN: 窗帘相关品类
 * - WALLCLOTH: 墙布相关品类
 * - WALLPAPER: 墙纸
 * - WALL_PANEL: 墙咔
 * - WINDOWPAD: 飘窗垫
 * - STANDARD: 标品/床垫/服务/其他
 */
export const CATEGORY_TO_PRODUCT_CATEGORIES: Record<Exclude<QuoteCategory, 'SUMMARY'>, string[]> = {
    CURTAIN: ['CURTAIN', 'CURTAIN_FABRIC', 'CURTAIN_SHEER', 'CURTAIN_TRACK', 'CURTAIN_ACCESSORY', 'MOTOR'],
    WALLCLOTH: ['WALLCLOTH', 'WALLCLOTH_ACCESSORY'],
    WALLPAPER: ['WALLPAPER'],
    WALL_PANEL: ['WALLPANEL'],
    WINDOWPAD: ['WINDOWPAD'],  // 飘窗垫独立标签页
    STANDARD: ['STANDARD', 'SERVICE', 'OTHER', 'MATTRESS'],  // 标品、床垫、服务、其他
};

/**
 * 视图模式类型
 */
export type ViewMode = 'category' | 'space';

interface QuoteCategoryTabsProps {
    /** 当前选中的品类 */
    activeCategory: QuoteCategory;
    /** 品类切换回调 */
    onCategoryChange: (category: QuoteCategory) => void;
    /** 当前视图模式 */
    viewMode: ViewMode;
    /** 视图模式切换回调 */
    onViewModeChange: (mode: ViewMode) => void;
    /** 是否显示视图切换按钮 */
    showViewToggle?: boolean;
    /** 各品类的商品数量统计 */
    categoryCounts?: Partial<Record<QuoteCategory, number>>;
    /** 额外的 className */
    className?: string;
}

/**
 * 报价单品类 Tabs 导航组件
 * 支持品类切换和视图模式切换
 */
export function QuoteCategoryTabs({
    activeCategory,
    onCategoryChange,
    viewMode,
    onViewModeChange,
    showViewToggle = true,
    categoryCounts = {},
    className,
}: QuoteCategoryTabsProps) {
    const categories = Object.keys(CATEGORY_CONFIG) as QuoteCategory[];

    return (
        <div className={cn('flex items-center justify-between', className)}>
            {/* 品类 Tabs */}
            <Tabs
                value={activeCategory}
                onValueChange={(value) => onCategoryChange(value as QuoteCategory)}
            >
                <TabsList>
                    {categories.map((category) => {
                        const config = CATEGORY_CONFIG[category];
                        const count = categoryCounts[category];
                        return (
                            <TabsTrigger
                                key={category}
                                value={category}
                                className="relative"
                            >
                                {config.label}
                                {count !== undefined && count > 0 && (
                                    <span className="ml-1.5 text-xs text-muted-foreground">
                                        ({count})
                                    </span>
                                )}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </Tabs>

            {/* 视图切换按钮 */}
            {showViewToggle && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewModeChange(viewMode === 'category' ? 'space' : 'category')}
                    className="gap-2"
                >
                    <ArrowLeftRight className="h-4 w-4" />
                    {viewMode === 'category' ? '切换到空间视图' : '切换到品类视图'}
                </Button>
            )}
        </div>
    );
}

/**
 * 获取品类的中文标签
 */
export function getCategoryLabel(category: QuoteCategory): string {
    return CATEGORY_CONFIG[category]?.label || category;
}

/**
 * 获取所有品类列表
 */
export function getAllCategories(): QuoteCategory[] {
    return Object.keys(CATEGORY_CONFIG) as QuoteCategory[];
}
