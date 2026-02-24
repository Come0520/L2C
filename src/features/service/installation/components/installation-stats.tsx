'use client';

import React from 'react';
import {
    ClipboardList,
    UserPlus,
    Truck,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * 安装模块统计卡片组件属性
 */
interface InstallationStatsProps {
    /** 统计数据数组：包含状态及其对应的任务数量 */
    stats: Array<{ status: string; count: number }>;
}

/**
 * 安装模块统计卡片组件
 * 
 * 展示各状态安装任务的数量分布，提升系统可观测性。
 */
export function InstallationStats({ stats }: InstallationStatsProps) {
    const getCount = (status: string) => stats.find(s => s.status === status)?.count || 0;
    const totalCount = stats.reduce((acc, curr) => acc + curr.count, 0);

    const statItems = [
        {
            label: '全部任务',
            value: totalCount,
            icon: ClipboardList,
            color: 'text-zinc-400',
            bgColor: 'bg-zinc-500/10',
            borderColor: 'border-zinc-500/20'
        },
        {
            label: '待分配',
            value: getCount('PENDING_DISPATCH'),
            icon: UserPlus,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20'
        },
        {
            label: '待上门',
            value: getCount('DISPATCHING'),
            icon: Truck,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20'
        },
        {
            label: '待确认',
            value: getCount('PENDING_CONFIRM'),
            icon: Clock,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20'
        },
        {
            label: '已完成',
            value: getCount('COMPLETED'),
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statItems.map((item) => (
                <div
                    key={item.label}
                    className={cn(
                        "p-4 rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.02]",
                        "glass-liquid bg-white/5",
                        item.borderColor
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className={cn("p-2 rounded-xl", item.bgColor)}>
                            <item.icon className={cn("h-5 w-5", item.color)} />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">
                            {item.value}
                        </span>
                    </div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        {item.label}
                    </p>
                </div>
            ))}
        </div>
    );
}
