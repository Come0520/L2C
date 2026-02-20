"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { toast } from "sonner";
import { Loader2, TrendingUp, TrendingDown, AlertCircle, Wallet, DollarSign, Percent } from "lucide-react";
import { cn } from "@/shared/utils";
import { createLogger } from "@/shared/lib/logger";
import useSWR from 'swr';
import { fetcher } from '@/shared/lib/fetcher';

const logger = createLogger('ExecutiveSummaryWidget');

interface DashboardWidgetProps {
    className?: string;
    startDate?: Date;
    endDate?: Date;
}

export function ExecutiveSummaryWidget({ className, startDate, endDate }: DashboardWidgetProps) {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate.toISOString());
    if (endDate) query.append('endDate', endDate.toISOString());

    const { data: swrData, isLoading } = useSWR(
        `/api/workbench/executive-summary?${query.toString()}`,
        fetcher,
        {
            refreshInterval: 300000,
            revalidateOnFocus: false,
            onError: (err) => {
                logger.error("Failed to load executive summary via SWR", {}, err);
                toast.error("加载核心指标失败");
            }
        }
    );

    const data = swrData?.success ? swrData.data : null;
    const loading = isLoading;

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
