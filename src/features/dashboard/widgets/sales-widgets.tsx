'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Target, Users, Percent, DollarSign, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { getSalesDashboardStats, DashboardStats } from '@/features/sales/actions/dashboard';

// Helper hook to fetch stats
function useSalesStats() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            try {
                const res = await getSalesDashboardStats();
                if (res.success && res.data) {
                    setStats(res.data);
                } else {
                    console.error(res.error);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    return { stats, loading };
}

/**
 * 销售目标完成率 Widget
 * 显示：本月目标 / 已完成金额 / 完成百分比
 */
export function SalesTargetWidget() {
    const { stats, loading } = useSalesStats();

    if (loading) {
        return (
            <Card className="glass-liquid border-white/10 h-full">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    const { target } = stats || { target: { amount: 0, achieved: 0, percentage: 0 } };

    const progressColor = target.percentage >= 100 ? 'bg-emerald-500' :
        target.percentage >= 80 ? 'bg-blue-500' :
            target.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500';

    return (
        <Card className="glass-liquid border-white/10 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    目标完成率
                </CardTitle>
                <Target className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">
                        {target.percentage.toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                        已完成
                    </span>
                </div>
                <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                        className={cn("h-full transition-all", progressColor)}
                        style={{ width: `${Math.min(target.percentage, 100)}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>¥{(target.achieved / 10000).toFixed(1)}万</span>
                    <span>目标 ¥{(target.amount / 10000).toFixed(1)}万</span>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * 我的线索数 Widget
 * 显示：待跟进 / 跟进中 / 已成交
 */
export function SalesLeadsWidget() {
    const { stats, loading } = useSalesStats();

    if (loading) {
        return (
            <Card className="glass-liquid border-white/10 h-full">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    const { leadsBreakdown, leads } = stats?.stats || { leads: 0, leadsBreakdown: { pending: 0, following: 0, won: 0 } };

    return (
        <Card className="glass-liquid border-white/10 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    我的线索
                </CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">{leads}</div>
                <div className="flex gap-3 mt-2 text-xs">
                    <span className="text-amber-500">待跟进 {leadsBreakdown.pending}</span>
                    <span className="text-blue-500">跟进中 {leadsBreakdown.following}</span>
                    <span className="text-emerald-500">已成交 {leadsBreakdown.won}</span>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * 我的转化率 Widget
 */
export function SalesConversionWidget() {
    const { stats, loading } = useSalesStats();

    if (loading) {
        return (
            <Card className="glass-liquid border-white/10 h-full">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    const { conversionRate } = stats?.stats || { conversionRate: '0.0' };

    return (
        <Card className="glass-liquid border-white/10 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    转化率
                </CardTitle>
                <Percent className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">{conversionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                    线索 → 成交
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * 我的客单价 Widget
 */
export function SalesAvgOrderWidget() {
    const { stats, loading } = useSalesStats();

    if (loading) {
        return (
            <Card className="glass-liquid border-white/10 h-full">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    const { avgOrderValue } = stats?.stats || { avgOrderValue: '0' };

    return (
        <Card className="glass-liquid border-white/10 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    客单价
                </CardTitle>
                <DollarSign className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">
                    ¥{parseInt(avgOrderValue).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    平均订单金额
                </p>
            </CardContent>
        </Card>
    );
}
