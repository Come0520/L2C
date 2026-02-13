'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
    Users,
    Target,
    TrendingUp,
    DollarSign,
    Percent,
    ClipboardCheck,
    Truck,
    Wrench,
    Calendar,
    CreditCard,
    BarChart3,
    Award,
} from 'lucide-react';
import type { WidgetType } from '../types';

/**
 * Widget 注册表
 * 定义每个 Widget 的元数据、权限和默认尺寸
 */
export interface WidgetMeta {
    type: WidgetType;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    permissions: string[];  // 允许使用此 Widget 的角色
    defaultSize: { w: number; h: number };
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetMeta> = {
    // ===== 销售专属 =====
    'sales-target': {
        type: 'sales-target',
        title: '目标完成率',
        description: '本月销售目标 vs 已完成金额',
        icon: Target,
        iconColor: 'text-emerald-500',
        permissions: ['SALES', 'MANAGER', 'ADMIN'],
        defaultSize: { w: 2, h: 1 },
    },
    'sales-leads': {
        type: 'sales-leads',
        title: '我的线索',
        description: '待跟进/跟进中/已成交线索数',
        icon: Users,
        iconColor: 'text-blue-500',
        permissions: ['SALES', 'MANAGER', 'ADMIN'],
        defaultSize: { w: 1, h: 1 },
    },
    'sales-conversion': {
        type: 'sales-conversion',
        title: '我的转化率',
        description: '线索到成交的转化比例',
        icon: Percent,
        iconColor: 'text-purple-500',
        permissions: ['SALES', 'MANAGER', 'ADMIN'],
        defaultSize: { w: 1, h: 1 },
    },
    'sales-avg-order': {
        type: 'sales-avg-order',
        title: '我的客单价',
        description: '平均订单金额',
        icon: DollarSign,
        iconColor: 'text-amber-500',
        permissions: ['SALES', 'MANAGER', 'ADMIN'],
        defaultSize: { w: 1, h: 1 },
    },

    // ===== 管理层专属 =====
    'team-sales': {
        type: 'team-sales',
        title: '团队销售额',
        description: '本月团队总销售额',
        icon: DollarSign,
        iconColor: 'text-emerald-500',
        permissions: ['MANAGER', 'ADMIN'],
        defaultSize: { w: 1, h: 1 },
    },
    'team-target': {
        type: 'team-target',
        title: '团队目标',
        description: '团队目标完成率',
        icon: Target,
        iconColor: 'text-blue-500',
        permissions: ['MANAGER', 'ADMIN'],
        defaultSize: { w: 1, h: 1 },
    },
    'team-leaderboard': {
        type: 'team-leaderboard',
        title: '销售排行榜',
        description: '本月销售业绩排名',
        icon: Award,
        iconColor: 'text-amber-500',
        permissions: ['MANAGER', 'ADMIN'],
        defaultSize: { w: 2, h: 2 },
    },
    'conversion-funnel': {
        type: 'conversion-funnel',
        title: '销售漏斗',
        description: '线索到成交的转化漏斗',
        icon: BarChart3,
        iconColor: 'text-purple-500',
        permissions: ['MANAGER', 'ADMIN'],
        defaultSize: { w: 2, h: 2 },
    },

    // ===== 派单员专属 =====
    'pending-measure': {
        type: 'pending-measure',
        title: '待派测量',
        description: '待派发的测量任务',
        icon: ClipboardCheck,
        iconColor: 'text-amber-500',
        permissions: ['DISPATCHER', 'MANAGER', 'ADMIN'],
        defaultSize: { w: 1, h: 1 },
    },
    'pending-install': {
        type: 'pending-install',
        title: '待派安装',
        description: '待派发的安装任务',
        icon: Wrench,
        iconColor: 'text-cyan-500',
        permissions: ['DISPATCHER', 'MANAGER', 'ADMIN'],
        defaultSize: { w: 1, h: 1 },
    },
    'today-schedule': {
        type: 'today-schedule',
        title: '今日排班',
        description: '今日工人排班概览',
        icon: Calendar,
        iconColor: 'text-blue-500',
        permissions: ['DISPATCHER', 'MANAGER', 'ADMIN'],
        defaultSize: { w: 4, h: 2 },
    },

    // ===== 财务专属 =====
    'ar-summary': {
        type: 'ar-summary',
        title: '待收款',
        description: '应收账款汇总',
        icon: CreditCard,
        iconColor: 'text-rose-500',
        permissions: ['FINANCE', 'ADMIN'],
        defaultSize: { w: 2, h: 1 },
    },
    'ap-summary': {
        type: 'ap-summary',
        title: '待付款',
        description: '应付账款汇总',
        icon: Truck,
        iconColor: 'text-orange-500',
        permissions: ['FINANCE', 'ADMIN'],
        defaultSize: { w: 2, h: 1 },
    },
    'cash-flow': {
        type: 'cash-flow',
        title: '现金流',
        description: '本月现金流入流出',
        icon: TrendingUp,
        iconColor: 'text-emerald-500',
        permissions: ['FINANCE', 'ADMIN'],
        defaultSize: { w: 4, h: 2 },
    },

    // ===== 通用 =====
    'pending-approval': {
        type: 'pending-approval',
        title: '待审批',
        description: '待我审批的任务',
        icon: ClipboardCheck,
        iconColor: 'text-amber-500',
        permissions: ['SALES', 'MANAGER', 'ADMIN', 'FINANCE', 'DISPATCHER'],
        defaultSize: { w: 1, h: 1 },
    },
    'sales-trend': {
        type: 'sales-trend',
        title: '销售趋势',
        description: '近期销售趋势图表',
        icon: TrendingUp,
        iconColor: 'text-blue-500',
        permissions: ['MANAGER', 'ADMIN'],
        defaultSize: { w: 2, h: 2 },
    },
    'channel-performance': {
        type: 'channel-performance',
        title: '渠道业绩',
        description: '渠道带单统计与佣金概览',
        icon: TrendingUp,
        iconColor: 'text-primary',
        permissions: ['MANAGER', 'ADMIN'],
        defaultSize: { w: 2, h: 2 },
    },
};

/**
 * 根据用户角色过滤可用的 Widget
 */
export function getAvailableWidgets(role: string): WidgetMeta[] {
    return Object.values(WIDGET_REGISTRY).filter(
        widget => widget.permissions.includes(role) || widget.permissions.includes('ALL')
    );
}

/**
 * 通用 Widget 占位组件
 * 用于尚未实现的 Widget 类型
 */
export function PlaceholderWidget({
    type,
    title
}: {
    type: WidgetType;
    title: string;
}) {
    const meta = WIDGET_REGISTRY[type];
    const Icon = meta?.icon || ClipboardCheck;
    const iconColor = meta?.iconColor || 'text-muted-foreground';

    return (
        <Card className="glass-liquid border-white/10 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${iconColor}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">--</div>
                <p className="text-xs text-muted-foreground mt-1">
                    数据加载中...
                </p>
            </CardContent>
        </Card>
    );
}
