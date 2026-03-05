'use client';

import React from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { ArrowUpRight as ArrowUpIcon, ArrowDownRight as ArrowDownIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface StatCardProps {
  /** 卡片标题 */
  title: string;
  /** 数值 */
  value: string | number;
  /** 图标 */
  icon?: React.ReactNode;
  /** 图标背景颜色类名 */
  iconBgClass?: string;
  /** 图标颜色类名 */
  iconTextClass?: string;
  /** 副标题/描述 */
  subtitle?: string;
  /** 趋势数据 */
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  /** 样式类名 */
  className?: string;
}

/**
 * 通用统计卡片组件
 * 用于展示数值指标、趋势变化等统计信息
 */
export const StatCard = React.memo(function StatCard({
  title,
  value,
  icon,
  iconBgClass = 'bg-blue-50',
  iconTextClass = 'text-blue-600',
  subtitle,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn('overflow-hidden transition-shadow duration-300 hover:shadow-md', className)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground mb-1 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            {subtitle && <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>}
          </div>
          {icon && <div className={cn('rounded-lg p-3', iconBgClass, iconTextClass)}>{icon}</div>}
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <div
              className={cn(
                'flex items-center font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.isPositive ? (
                <ArrowUpIcon className="mr-1 h-4 w-4" />
              ) : (
                <ArrowDownIcon className="mr-1 h-4 w-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
            {trend.label && <span className="text-muted-foreground ml-2">{trend.label}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
