'use client';

import { cn } from '@/shared/lib/utils';

interface QuoteBottomSummaryBarProps {
    /** 商品合计金额 */
    totalAmount: number | string;
    /** 折扣金额 */
    discountAmount?: number | string;
    /** 最终报价 */
    finalAmount: number | string;
    /** 额外的 className */
    className?: string;
}

/**
 * 报价单底部吸底汇总栏组件
 * 固定在视口底部，显示金额汇总信息
 */
export function QuoteBottomSummaryBar({
    totalAmount,
    discountAmount,
    finalAmount,
    className,
}: QuoteBottomSummaryBarProps) {
    // 格式化金额显示
    const formatAmount = (amount: number | string | undefined): string => {
        if (amount === undefined || amount === null) return '0.00';
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return isNaN(num) ? '0.00' : num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const hasDiscount = discountAmount && parseFloat(String(discountAmount)) > 0;

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
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-end gap-6">
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
    );
}
