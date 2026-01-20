'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';

/**
 * 品类汇总数据
 */
export interface CategoryBreakdown {
    category: string;
    label: string;
    itemCount: number;
    subtotal: number;
}

interface QuoteBottomSummaryBarProps {
    /** 商品合计金额 */
    totalAmount: number | string;
    /** 折扣金额 */
    discountAmount?: number | string;
    /** 最终报价 */
    finalAmount: number | string;
    /** 品类分类汇总（可选） */
    categoryBreakdown?: CategoryBreakdown[];
    /** 额外的 className */
    className?: string;
}

/**
 * 报价单底部吸底汇总栏组件（四层汇总增强版）
 * 固定在视口底部，显示金额汇总信息
 * 支持展开查看品类分类汇总
 */
export function QuoteBottomSummaryBar({
    totalAmount,
    discountAmount,
    finalAmount,
    categoryBreakdown,
    className,
}: QuoteBottomSummaryBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // 格式化金额显示
    const formatAmount = (amount: number | string | undefined): string => {
        if (amount === undefined || amount === null) return '0.00';
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return isNaN(num) ? '0.00' : num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const hasDiscount = discountAmount && parseFloat(String(discountAmount)) > 0;
    const hasBreakdown = categoryBreakdown && categoryBreakdown.length > 0;

    return (
        <div
            className={cn(
                // 固定在底部
                'fixed bottom-0 left-0 right-0 z-40',
                // 背景样式 - 毛玻璃效果
                'bg-background/95 backdrop-blur-md border-t shadow-lg',
                // 安全区域适配（移动端）
                'pb-safe',
                className
            )}
        >
            {/* 品类分类汇总（展开时显示） */}
            {isExpanded && hasBreakdown && (
                <div className="max-w-7xl mx-auto px-4 pt-3 pb-2 border-b border-border/50">
                    <div className="text-xs text-muted-foreground mb-2">品类汇总</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {categoryBreakdown.map((item) => (
                            <div
                                key={item.category}
                                className="flex justify-between items-center py-1.5 px-3 bg-muted/30 rounded"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{item.label}</span>
                                    <span className="text-xs text-muted-foreground">({item.itemCount})</span>
                                </div>
                                <span className="text-sm font-medium">¥{formatAmount(item.subtotal)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 主汇总栏 */}
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* 左侧：展开按钮 */}
                    <div className="flex items-center gap-2">
                        {hasBreakdown && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronUp className="h-4 w-4" />
                                )}
                                <span>{isExpanded ? '收起明细' : '查看明细'}</span>
                            </button>
                        )}
                    </div>

                    {/* 右侧：金额汇总 */}
                    <div className="flex items-center gap-6">
                        {/* 商品合计 */}
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm text-muted-foreground">商品合计</span>
                            <span className="text-base font-medium">¥{formatAmount(totalAmount)}</span>
                        </div>

                        {/* 折扣（仅在有折扣时显示） */}
                        {hasDiscount && (
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm text-muted-foreground">折扣</span>
                                <span className="text-base font-medium text-destructive">
                                    -¥{formatAmount(discountAmount)}
                                </span>
                            </div>
                        )}

                        {/* 分隔线 */}
                        <div className="h-8 w-px bg-border" />

                        {/* 最终报价 */}
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm text-muted-foreground">最终报价</span>
                            <span className="text-2xl font-bold text-primary">
                                ¥{formatAmount(finalAmount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

