"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import {
    Users,
    ShoppingCart,
    DollarSign,
    Percent,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";

/**
 * 仪表盘 Tab 内容组件
 * 展示核心 KPI 卡片和图表
 */
export function DashboardTab() {
    return (
        <div className="space-y-6">
            {/* KPI 卡片网格 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="本月签约"
                    value="¥188,000"
                    change={12.5}
                    changeLabel="较上月"
                    icon={DollarSign}
                    iconColor="text-emerald-500"
                />
                <KPICard
                    title="待跟进线索"
                    value="23"
                    change={-5.2}
                    changeLabel="较上月"
                    icon={Users}
                    iconColor="text-blue-500"
                />
                <KPICard
                    title="进行中订单"
                    value="12"
                    change={8.1}
                    changeLabel="较上月"
                    icon={ShoppingCart}
                    iconColor="text-amber-500"
                />
                <KPICard
                    title="转化率"
                    value="32.5%"
                    change={2.3}
                    changeLabel="较上月"
                    icon={Percent}
                    iconColor="text-purple-500"
                />
            </div>

            {/* 财务概览 */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="glass-liquid border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium text-muted-foreground">
                            待收款
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">¥32,500</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            共 8 笔待收款项
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-liquid border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium text-muted-foreground">
                            待付款
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">¥18,200</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            共 5 笔待付款项
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 近期趋势占位 */}
            <Card className="glass-liquid border-white/10">
                <CardHeader>
                    <CardTitle className="text-base font-medium">销售趋势</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">图表加载中...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * KPI 卡片组件
 */
function KPICard({
    title,
    value,
    change,
    changeLabel,
    icon: Icon,
    iconColor,
}: {
    title: string;
    value: string;
    change: number;
    changeLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
}) {
    const isPositive = change >= 0;

    return (
        <Card className="glass-liquid border-white/10 hover:bg-white/10 dark:hover:bg-white/5 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className={cn("h-4 w-4", iconColor)} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <div className="flex items-center gap-1 mt-1">
                    {isPositive ? (
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <span
                        className={cn(
                            "text-xs font-medium",
                            isPositive ? "text-emerald-500" : "text-red-500"
                        )}
                    >
                        {isPositive ? "+" : ""}
                        {change}%
                    </span>
                    <span className="text-xs text-muted-foreground">{changeLabel}</span>
                </div>
            </CardContent>
        </Card>
    );
}
