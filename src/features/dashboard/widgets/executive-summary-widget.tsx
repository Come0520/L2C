"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
    getDashboardStats,
    getProfitMarginAnalysis,
    getCashFlowForecast,
    getDeliveryEfficiency
} from "@/features/analytics/actions";
import { toast } from "sonner";
import { Loader2, TrendingUp, TrendingDown, AlertCircle, Wallet, DollarSign, Percent } from "lucide-react";
import { cn } from "@/shared/utils";

interface DashboardWidgetProps {
    className?: string;
    startDate?: Date;
    endDate?: Date;
}

export function ExecutiveSummaryWidget({ className, startDate, endDate }: DashboardWidgetProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        revenue: { total: number; trend: number };
        margin: { current: number; trend: number };
        cashFlow: { expected: number; collectionRate: number };
        alerts: { total: number; breakdown: { overdue: number; approval: number; complaint: number } };
    } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const start = startDate?.toISOString();
                const end = endDate?.toISOString();

                // 并行请求数据
                const [statsRes, marginRes, cashFlowRes, efficiencyRes] = await Promise.all([
                    getDashboardStats({ startDate: start, endDate: end }),
                    getProfitMarginAnalysis({ groupBy: 'category', startDate: start, endDate: end }),
                    getCashFlowForecast({ forecastDays: 30 }),
                    getDeliveryEfficiency({ startDate: start, endDate: end }) // 用于预警计数示例
                ]);

                // 处理营收数据
                const revenue = statsRes?.data?.success ? {
                    total: parseFloat(statsRes.data.data.totalSales || '0'),
                    trend: 12.3 // 示例环比，后续需对接真实环比接口
                } : { total: 0, trend: 0 };

                // 处理毛利率
                const margin = marginRes?.data?.success ? {
                    current: parseFloat(marginRes.data.data.grossMargin || '0'),
                    trend: -1.2 // 示例环比
                } : { current: 0, trend: 0 };

                // 处理现金流
                const cashFlow = cashFlowRes?.data?.success ? {
                    expected: parseFloat(cashFlowRes.data.data.summary.totalForecastAmount || '0'),
                    collectionRate: 100 // 现金流 Action 暂无 collectionRate，设为默认值
                } : { expected: 0, collectionRate: 0 };

                // 处理预警 (示例逻辑，实际需对接 workbench 或具体业务接口)
                const alerts = {
                    total: efficiencyRes?.data?.success ? efficiencyRes.data.data.overdueTaskCount : 0,
                    breakdown: {
                        overdue: efficiencyRes?.data?.success ? efficiencyRes.data.data.overdueTaskCount : 0,
                        approval: 5,
                        complaint: 4
                    }
                };

                setData({ revenue, margin, cashFlow, alerts });

            } catch (error) {
                console.error("Failed to load executive summary", error);
                toast.error("加载核心指标失败");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [startDate, endDate]);

    if (loading) {
        return (
            <Card className={cn("h-full", className)}>
                <CardContent className="flex h-full items-center justify-center p-6">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    return (
        <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
            {/* 营收卡片 */}
            <SummaryCard
                title="本月营收"
                value={`¥${data.revenue.total.toLocaleString()}`}
                trend={data.revenue.trend}
                icon={DollarSign}
                trendLabel="vs 上月"
            />

            {/* 毛利率卡片 */}
            <SummaryCard
                title="毛利率"
                value={`${data.margin.current.toFixed(1)}%`}
                trend={data.margin.trend}
                icon={Percent}
                trendLabel="vs 上月"
            />

            {/* 现金流卡片 */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">30日预测回款</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">¥{data.cashFlow.expected.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        回款率 {data.cashFlow.collectionRate.toFixed(1)}%
                    </div>
                </CardContent>
            </Card>

            {/* 预警卡片 */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">待处理预警</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.alerts.total}</div>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                        <span>逾期{data.alerts.breakdown.overdue}</span>
                        <span className="text-border">|</span>
                        <span>审批{data.alerts.breakdown.approval}</span>
                        <span className="text-border">|</span>
                        <span>客诉{data.alerts.breakdown.complaint}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

interface SummaryCardProps {
    title: string;
    value: string;
    trend: number;
    icon: React.ComponentType<{ className?: string }>;
    trendLabel: string;
}

function SummaryCard({ title, value, trend, icon: Icon, trendLabel }: SummaryCardProps) {
    const isPositive = trend > 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const trendColor = isPositive ? "text-green-500" : "text-red-500";

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <TrendIcon className={cn("h-3 w-3", trendColor)} />
                    <span className={trendColor}>{Math.abs(trend)}%</span>
                    <span>{trendLabel}</span>
                </div>
            </CardContent>
        </Card>
    );
}
