"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { useMemo, useCallback } from "react";

// 动态导入 Recharts 组件以减小 Bundle 体积并避免 SSR 问题
const ResponsiveContainer = dynamic(() => import("recharts").then(mod => mod.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import("recharts").then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(mod => mod.Tooltip), { ssr: false });
const Cell = dynamic(() => import("recharts").then(mod => mod.Cell), { ssr: false });

/**
 * 漏斗阶段数据
 */
interface FunnelData {
    /** 阶段名称 */
    stage: string;
    /** 数量 */
    count: number;
    /** 平均停留时长（天），可选 */
    avgDays?: number;
}

interface SalesFunnelChartProps {
    data: FunnelData[];
    className?: string;
    /** 是否显示转化率 */
    showConversionRate?: boolean;
    /** 是否显示停留时长 */
    showDuration?: boolean;
}

// 阶段颜色
const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];

// 阶段名称映射（中文）
const STAGE_LABELS: Record<string, string> = {
    leads: "线索",
    quoted: "报价",
    ordered: "成交",
    delivered: "交付",
    completed: "完成",
    // 默认使用原始值
};

/**
 * 销售漏斗图组件
 * 
 * 功能：
 * 1. 各阶段数量可视化
 * 2. 阶段间转化率计算
 * 3. 平均停留时长展示
 */
export function SalesFunnelChart({
    data,
    className,
    showConversionRate = true,
    showDuration = true,
}: SalesFunnelChartProps) {
    // 计算增强数据（转化率）
    const enhancedData = useMemo(() => {
        return data.map((item, index) => {
            const prevCount = index > 0 ? data[index - 1].count : item.count;
            const conversionRate = prevCount > 0 ? ((item.count / prevCount) * 100).toFixed(1) : '100';
            const overallRate = data[0]?.count > 0
                ? ((item.count / data[0].count) * 100).toFixed(1)
                : '100';

            return {
                ...item,
                label: STAGE_LABELS[item.stage.toLowerCase()] || item.stage,
                conversionRate,
                overallRate,
            };
        });
    }, [data]);

    // 总体转化率（首尾）
    const totalConversion = useMemo(() => {
        if (data.length < 2) return '100';
        const first = data[0]?.count || 0;
        const last = data[data.length - 1]?.count || 0;
        return first > 0 ? ((last / first) * 100).toFixed(1) : '100';
    }, [data]);

    // 自定义 Tooltip 渲染函数
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderTooltip = useCallback((props: any) => {
        const { active, payload } = props;
        if (!active || !payload || !payload.length) return null;

        const item = payload[0]?.payload;
        if (!item) return null;
        return (
            <div className="bg-background border rounded-lg p-3 shadow-lg">
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-2xl font-bold text-primary">{item.count}</p>
                {showConversionRate && (
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <p>阶段转化率: <span className="text-foreground font-medium">{item.conversionRate}%</span></p>
                        <p>总体转化率: <span className="text-foreground font-medium">{item.overallRate}%</span></p>
                    </div>
                )}
                {showDuration && item.avgDays !== undefined && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        平均停留: <span className="text-foreground font-medium">{item.avgDays} 天</span>
                    </p>
                )}
            </div>
        );
    }, [showConversionRate, showDuration]);

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>销售漏斗</CardTitle>
                        <CardDescription>线索到成交转化分析</CardDescription>
                    </div>
                    {showConversionRate && (
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">总转化率</p>
                            <p className="text-2xl font-bold text-primary">{totalConversion}%</p>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={enhancedData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="label"
                            width={70}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            content={renderTooltip}
                            cursor={{ fill: 'transparent' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                            {enhancedData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

