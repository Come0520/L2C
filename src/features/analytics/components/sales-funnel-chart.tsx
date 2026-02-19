"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { cn } from "@/shared/utils";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { TrendingUp, TrendingDown, Clock, ArrowRight } from "lucide-react";

export interface FunnelStage {
    stage: string;
    count: number;
    conversionRate?: number | string | null;
    avgDaysInStage?: number | string | null;
    trend?: number | string | null;
    previousPeriodCount?: number;
}

interface SalesFunnelChartProps {
    data: FunnelStage[];
    className?: string;
    summary?: {
        overallConversion: number | string;
        avgCycleTime: number | string;
    }
}

const STAGE_COLORS = {
    '线索': '#94a3b8',
    '测量': '#60a5fa',
    '报价': '#818cf8',
    '成交': '#34d399',
};

export function SalesFunnelChart({ data, className, summary }: SalesFunnelChartProps) {
    return (
        <Card className={cn("col-span-full lg:col-span-3", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">销售漏斗分析</CardTitle>
                {summary && (
                    <div className="flex gap-3 text-xs">
                        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full text-green-700">
                            <span className="font-semibold">总转化 {summary.overallConversion}%</span>
                        </div>
                        <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full text-blue-700">
                            <Clock className="w-3 h-3" />
                            <span className="font-semibold">{summary.avgCycleTime}天</span>
                        </div>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                            barSize={32}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="stage"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                width={50}
                                fontSize={13}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const item = payload[0].payload as FunnelStage;
                                        return (
                                            <div className="bg-white border p-3 rounded-lg shadow-lg text-sm z-50">
                                                <div className="font-bold mb-1">{item.stage}</div>
                                                <div className="flex justify-between gap-4 mb-1">
                                                    <span className="text-muted-foreground">数量</span>
                                                    <span>{item.count}</span>
                                                </div>
                                                {item.trend !== undefined && item.trend !== null && (
                                                    <div className="flex justify-between gap-4 mb-1">
                                                        <span className="text-muted-foreground">环比</span>
                                                        <span className={Number(item.trend) >= 0 ? 'text-green-600' : 'text-red-500'}>
                                                            {Number(item.trend) > 0 ? '+' : ''}{item.trend}%
                                                        </span>
                                                    </div>
                                                )}
                                                {item.avgDaysInStage && (
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-muted-foreground">平均耗时</span>
                                                        <span>{item.avgDaysInStage}天</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.stage as keyof typeof STAGE_COLORS] || '#cbd5e1'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 漏斗详情列表 */}
                <div className="mt-4 space-y-4">
                    {data.map((item, index) => {
                        // prevItem removed as it was unused
                        return (
                            <div key={item.stage} className="relative">
                                {/* 转化率箭头 (仅在非第一项显示) */}
                                {index > 0 && item.conversionRate !== null && (
                                    <div className="absolute -top-3 left-14 flex items-center justify-center w-full">
                                        <div className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transform -translate-y-1/2">
                                            <ArrowRight className="w-3 h-3" />
                                            <span>转化率 {item.conversionRate}%</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-sm py-1">
                                    <div className="flex flex-col">
                                        <div className="font-medium">{item.stage}</div>
                                        {item.avgDaysInStage && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {item.avgDaysInStage}天
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="font-bold">{item.count}</div>
                                        {item.trend !== undefined && item.trend !== null && (
                                            <div className={cn("text-xs flex items-center", Number(item.trend) >= 0 ? 'text-green-600' : 'text-red-500')}>
                                                {Number(item.trend) >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                                                {Math.abs(Number(item.trend))}%
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
