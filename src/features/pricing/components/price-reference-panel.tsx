'use client';


import { logger } from '@/shared/lib/logger';
import React, { useEffect, useState } from 'react';
import { getPricingHints } from '@/features/pricing/actions/pricing-hints';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Loader2, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Separator } from '@/shared/ui/separator';

interface PriceReferencePanelProps {
    productId?: string;
    sku?: string;
    periodDays?: number;
    className?: string;
}

export function PriceReferencePanel({ productId, sku, periodDays, className }: PriceReferencePanelProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null); // Use any for now, or define interface
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!productId && !sku) return;

        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await getPricingHints({
                    productId,
                    sku,
                    periodDays: periodDays ?? 90
                });
                if (res?.data?.success) {
                    setData(res.data.data);
                } else {
                    setError('无法获取定价建议');
                }
            } catch (err) {
                logger.error(err);
                setError('加载失败');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [productId, sku, periodDays]);

    if (!productId && !sku) {
        return (
            <Card className={cn("bg-muted/30 border-dashed", className)}>
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                    请选择商品以查看定价建议
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center p-6 h-[200px]">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error || !data) {
        return (
            <Card className={className}>
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                    {error || '暂无数据'}
                </CardContent>
            </Card>
        );
    }

    const { product, stats, analysis, trends, categoryAnalysis } = data;
    const isBelowCost = Number(analysis.suggestedPrice) < Number(product.cost);
    const isBelowFloor = Number(analysis.suggestedPrice) < Number(product.floorPrice);

    return (
        <Card className={cn("w-full shadow-sm", className)}>
            <CardHeader className="pb-2 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        定价参考
                    </CardTitle>
                    <Badge variant={isBelowFloor ? "destructive" : "secondary"} className="text-xs">
                        {isBelowFloor ? '低于底价' : '建议区间'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {/* 核心建议价格 */}
                <div className="text-center py-2 bg-primary/5 rounded-lg border border-primary/10">
                    <span className="text-xs text-muted-foreground block mb-1">建议成交价</span>
                    <div className="text-2xl font-bold text-primary">
                        ¥{Number(analysis.suggestedPrice).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex justify-center items-center gap-2">
                        <span>指导价 ¥{product.guidancePrice}</span>
                        {Number(analysis.suggestedPrice) < product.guidancePrice ? (
                            <span className="text-red-500 text-[10px] bg-red-50 px-1 rounded flex items-center">
                                <TrendingDown className="h-3 w-3 mr-0.5" /> 低于指导
                            </span>
                        ) : (
                            <span className="text-green-600 text-[10px] bg-green-50 px-1 rounded flex items-center">
                                <TrendingUp className="h-3 w-3 mr-0.5" /> 高于指导
                            </span>
                        )}
                    </div>
                </div>

                {/* 关键指标网格 */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 rounded bg-muted/40">
                        <span className="text-xs text-muted-foreground block">历史最低</span>
                        <span className="font-semibold block mt-0.5">¥{stats.minSoldPrice}</span>
                    </div>
                    <div className="p-2 rounded bg-muted/40">
                        <span className="text-xs text-muted-foreground block">历史最高</span>
                        <span className="font-semibold block mt-0.5">¥{stats.maxSoldPrice}</span>
                    </div>
                    <div className="p-2 rounded bg-muted/40">
                        <span className="text-xs text-muted-foreground block">平均成交</span>
                        <span className="font-semibold block mt-0.5">¥{stats.avgSoldPrice}</span>
                    </div>
                </div>

                <Separator />

                {/* 价格趋势 */}
                {trends && trends.length > 0 && (
                    <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">近6期价格趋势</span>
                        <div className="flex items-end justify-between h-12 gap-1 px-1">
                            {trends.map((t: any, i: number) => {
                                const maxPrice = Math.max(...trends.map((x: any) => Number(x.avgPrice)), 1);
                                const height = `${(Number(t.avgPrice) / maxPrice) * 100}%`;
                                return (
                                    <div key={i} className="flex flex-col items-center flex-1 group relative">
                                        <div className="w-full bg-primary/20 rounded-t-sm group-hover:bg-primary/40 transition-colors" style={{ height: height || '10%' }} />
                                        <span className="text-[10px] text-muted-foreground mt-1 scale-90">{t.month.slice(-2)}月</span>
                                        <div className="absolute -top-6 bg-black text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                            ¥{t.avgPrice}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {categoryAnalysis && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <span className="text-xs font-medium text-muted-foreground">同品类参考水位 ({categoryAnalysis.productCount}款)</span>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="bg-muted/30 p-1.5 rounded">
                                    <span className="block text-muted-foreground mb-0.5">最低</span>
                                    <span className="font-medium">¥{categoryAnalysis.minPrice}</span>
                                </div>
                                <div className="bg-muted/30 p-1.5 rounded">
                                    <span className="block text-muted-foreground mb-0.5">平均</span>
                                    <span className="font-medium text-primary">¥{categoryAnalysis.avgPrice}</span>
                                </div>
                                <div className="bg-muted/30 p-1.5 rounded">
                                    <span className="block text-muted-foreground mb-0.5">最高</span>
                                    <span className="font-medium">¥{categoryAnalysis.maxPrice}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <Separator />

                {/* 成本与底价信息 (仅特定权限或 sales 可见?) */}
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">销售底价</span>
                        <span className="font-medium">¥{product.floorPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">近90天销量</span>
                        <span className="font-medium">{stats.totalVolume} {product.unit || '件'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">历史毛利率</span>
                        <span className={cn("font-medium", Number(analysis.margin.actual) < 20 ? "text-red-500" : "text-green-600")}>
                            {analysis.margin.actual}%
                        </span>
                    </div>
                    {analysis.margin.estimated && (
                        <div className="flex justify-between items-center bg-primary/5 p-1.5 -mx-1.5 rounded">
                            <span className="font-medium">基于建议价预估毛利</span>
                            <span className={cn("font-bold text-sm", Number(analysis.margin.estimated) < 20 ? "text-red-500" : "text-green-600")}>
                                {analysis.margin.estimated}%
                            </span>
                        </div>
                    )}
                </div>

                {isBelowCost && (
                    <div className="flex items-start gap-2 text-xs bg-red-50 text-red-600 p-2 rounded border border-red-100">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>警告：当前建议价格低于成本价，请谨慎报价。</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
