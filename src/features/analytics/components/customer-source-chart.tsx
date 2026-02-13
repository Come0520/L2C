'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { cn } from '@/shared/lib/utils';

// 动态导入 Recharts 组件以减小 Bundle 体积并避免 SSR 问题
const ResponsiveContainer = dynamic(() => import("recharts").then(mod => mod.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(mod => mod.Cell), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then(mod => mod.Legend), { ssr: false });

export interface SourceData {
    name: string;      // 渠道名称 (如: 线上-抖音, 线下-装饰公司)
    value: number;     // 客户/线索数量
    color?: string;    // 可选自定义颜色
    [key: string]: string | number | undefined; // Index signature for Recharts
}

interface CustomerSourceChartProps {
    data: SourceData[];
    title?: string;
    description?: string;
    className?: string;
}

// 默认调色板
const COLORS = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#10b981', // green
    '#f59e0b', // amber
    '#06b6d4', // cyan
    '#ef4444', // red
    '#84cc16', // lime
];

/**
 * 客户来源分布图
 * 展示各渠道客户/线索占比
 */
export function CustomerSourceChart({
    data,
    title = "客户来源分布",
    description = "各渠道获客占比分析",
    className
}: CustomerSourceChartProps) {
    // 计算总数用于显示百分比
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    // 如果没有数据，显示空状态
    if (data.length === 0 || total === 0) {
        return (
            <Card className={cn("overflow-hidden", className)}>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    暂无数据
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader>
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            innerRadius={40}
                            fill="#8884d8"
                            dataKey="value"
                            paddingAngle={2}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color || COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => [`${value} (${((Number(value) / total) * 100).toFixed(1)}%)`, '数量']}
                            contentStyle={{
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
