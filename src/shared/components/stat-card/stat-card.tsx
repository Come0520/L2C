/**
 * 通用统计卡片组件
 * 用于展示数值指标、趋势变化等统计信息
 */

'use client';

import { Card, CardContent } from '@/shared/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface StatCardProps {
    /** 卡片标题 */
    title: string;
    /** 主要数�?*/
    value: string | number;
    /** 副标�?描述 */
    subtitle?: string;
    /** 趋势数据 */
    trend?: {
        /** 变化百分�?*/
        value: number;
        /** 是否正向趋势（上升为正向�?*/
        isPositive: boolean;
    };
    /** 右侧图标 */
    icon?: React.ReactNode;
    /** 图标背景颜色类名 */
    iconBgClass?: string;
    /** 图标文字颜色类名 */
    iconTextClass?: string;
    /** 自定义类�?*/
    className?: string;
    /** 卡片尺寸 */
    size?: 'sm' | 'md' | 'lg';
}

export function StatCard({
    title,
    value,
    subtitle,
    trend,
    icon,
    iconBgClass = 'bg-blue-50',
    iconTextClass = 'text-blue-600',
    className,
    size = 'md',
}: StatCardProps) {
    const paddingClass = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    }[size];

    const valueClass = {
        sm: 'text-xl',
        md: 'text-2xl',
        lg: 'text-3xl',
    }[size];

    return (
        <Card className={className}>
            <CardContent className={paddingClass}>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm text-gray-500">{title}</p>
                        <h3 className={cn("font-bold mt-2", valueClass)}>{value}</h3>
                        {subtitle && (
                            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                        )}
                        {trend && (
                            <div className={cn(
                                "flex items-center mt-2 text-sm",
                                trend.isPositive ? 'text-green-600' : 'text-red-600'
                            )}>
                                {trend.isPositive ? (
                                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                                ) : (
                                    <ArrowDownIcon className="h-4 w-4 mr-1" />
                                )}
                                <span>{Math.abs(trend.value)}%</span>
                            </div>
                        )}
                    </div>
                    {icon && (
                        <div className={cn("ml-4 p-3 rounded-lg", iconBgClass, iconTextClass)}>
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
