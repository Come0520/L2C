'use client';

import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { GrowthDataPoint } from '../actions/landing-stats';

interface GrowthChartProps {
    data: GrowthDataPoint[];
    /** 当前总企业数，用于图表标题显示 */
    total: number;
}

/** 自定义 Tooltip 气泡 */
function CustomTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs shadow-lg dark:border-blue-900/30 dark:bg-slate-900">
            <p className="font-semibold text-blue-600 dark:text-blue-400">{label}</p>
            <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                累计企业：<span className="font-bold text-slate-900 dark:text-white">{payload[0].value}</span> 家
            </p>
        </div>
    );
}

/**
 * 企业增长趋势面积图
 * 类似 Skills Marketplace 的统计趋势图，数据来源于真实数据库
 */
export function GrowthChart({ data, total }: GrowthChartProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true });

    if (!data || data.length === 0) return null;

    // 将月份格式化为更短的显示（去掉年份，只保留月份，首位和末位显示完整年月）
    const chartData = data.map((d, i) => ({
        ...d,
        label: i === 0 || i === data.length - 1 ? d.month : d.month.slice(5) + '月',
    }));

    return (
        <div
            ref={ref}
            className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60"
            style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? 'translateY(0)' : 'translateY(32px)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
            }}
        >
            {/* 图表头部 */}
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-white/5">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        企业增长趋势
                    </p>
                    <p className="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {total.toLocaleString()}
                        <span className="text-lg">+</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">服务企业总数</p>
                </div>
                {/* 仿 macOS 三点装饰 */}
                <div className="flex gap-1.5 pt-0.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                </div>
            </div>

            {/* 面积图 */}
            <div className="px-2 pb-4 pt-2">
                <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="label"
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#growthGradient)"
                            dot={false}
                            activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
