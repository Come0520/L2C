"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/utils";
import { createLogger } from "@/shared/lib/logger";

const logger = createLogger('CashFlowForecastWidget');
import useSWR from 'swr';
import { fetcher } from '@/shared/lib/fetcher';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

interface CashFlowForecastWidgetProps {
    className?: string;
}

interface CashFlowData {
    weeklyForecast: { weekStart: string; amount: string; count: number }[];
    summary: {
        totalForecastAmount: string;
        totalOverdueAmount: string;
        collectionRate?: number;
    };
}



export function CashFlowForecastWidget({ className }: CashFlowForecastWidgetProps) {
    const { data: swrData, isLoading } = useSWR<{ success: boolean; data: CashFlowData }>(
        '/api/workbench/cash-flow-forecast',
        fetcher,
        {
            refreshInterval: 600000, // 10分钟刷新一次
            revalidateOnFocus: false,
            onError: (err) => {
                logger.error("Failed to load cash flow forecast via SWR", {}, err);
                toast.error("加载现金流预测失败");
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
        <Card className={cn("flex flex-col", className)}>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
                <div>
                    <CardTitle className="text-base sm:text-lg">现金流预测 (30天)</CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        基于待回款计划及近期回款预测
                    </p>
                </div>
                <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="flex flex-col items-start sm:items-end">
                        <span className="text-muted-foreground">预计回款</span>
                        <span className="font-bold text-green-600">
                            ¥{parseFloat(data.summary.totalForecastAmount || '0').toLocaleString()}
                        </span>
                    </div>
                    <div className="flex flex-col items-start sm:items-end">
                        <span className="text-muted-foreground">已逾期</span>
                        <span className="font-bold text-red-500">
                            ¥{parseFloat(data.summary.totalOverdueAmount || '0').toLocaleString()}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data.weeklyForecast}
                        margin={{
                            top: 5,
                            right: 10,
                            left: 10,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                            dataKey="weekStart"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => format(parseISO(value), "MM/dd")}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                const val = parseFloat(value);
                                return val >= 1000 ? `¥${(val / 1000).toFixed(0)}k` : `¥${val}`;
                            }}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload;
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        周起始
                                                    </span>
                                                    <span className="font-bold text-muted-foreground">
                                                        {format(parseISO(item.weekStart), "yyyy-MM-dd")}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        预估金额
                                                    </span>
                                                    <span className="font-bold text-green-600">
                                                        ¥{parseFloat(item.amount).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#colorExpected)"
                            activeDot={{
                                r: 6,
                                style: { fill: "#10b981", opacity: 0.8 },
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
