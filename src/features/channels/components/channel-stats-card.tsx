'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { TrendingUp, Users, DollarSign, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * 渠道统计卡片属性
 */
interface ChannelStatsCardProps {
    activeChannelCount: number;
    totalDealAmount: number;
    avgConversionRate: number;
    pendingCommission: number;
}

/**
 * 格式化金额显示
 */
function formatAmount(amount: number): string {
    if (amount >= 10000) {
        return `¥${(amount / 10000).toFixed(1)}万`;
    }
    return `¥${amount.toLocaleString()}`;
}

/**
 * 渠道业绩统计卡片
 * 
 * 仅在 Dashboard 中为 ADMIN/MANAGER 显示
 */
export function ChannelStatsCard({
    activeChannelCount,
    totalDealAmount,
    avgConversionRate,
    pendingCommission,
}: ChannelStatsCardProps) {
    return (
        <Card className="glass-liquid">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    渠道业绩
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/channels/analytics" className="text-xs text-muted-foreground hover:text-primary">
                        查看详情
                        <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    {/* 活跃渠道 */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <Users className="h-3 w-3" />
                        </div>
                        <div className="text-2xl font-bold">{activeChannelCount}</div>
                        <div className="text-xs text-muted-foreground">活跃渠道</div>
                    </div>

                    {/* 本月带单 */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <DollarSign className="h-3 w-3" />
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                            {formatAmount(totalDealAmount)}
                        </div>
                        <div className="text-xs text-muted-foreground">本月带单</div>
                    </div>

                    {/* 转化率 */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <TrendingUp className="h-3 w-3" />
                        </div>
                        <div className="text-2xl font-bold">
                            {avgConversionRate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">转化率</div>
                    </div>
                </div>

                {/* 待结算佣金 */}
                <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">待结算佣金</span>
                        <span className="font-medium text-orange-600">
                            {formatAmount(pendingCommission)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
