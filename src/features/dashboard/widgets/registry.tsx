'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import Users from 'lucide-react/dist/esm/icons/users';
import Target from 'lucide-react/dist/esm/icons/target';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Percent from 'lucide-react/dist/esm/icons/percent';
import ClipboardCheck from 'lucide-react/dist/esm/icons/clipboard-check';
import Truck from 'lucide-react/dist/esm/icons/truck';
import Wrench from 'lucide-react/dist/esm/icons/wrench';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import BarChart from 'lucide-react/dist/esm/icons/bar-chart';
import Award from 'lucide-react/dist/esm/icons/award';
import Activity from 'lucide-react/dist/esm/icons/activity';
import PieChart from 'lucide-react/dist/esm/icons/pie-chart';
import Layers from 'lucide-react/dist/esm/icons/layers';
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

export const WIDGET_REGISTRY: Partial<Record<WidgetType, WidgetMeta>> = {
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
    'executive-summary': {
        type: 'executive-summary',
        title: '核心指标',
        description: '营收/毛利/现金流/预警概览',
        icon: Activity,
        iconColor: 'text-indigo-500',
        permissions: ['MANAGER', 'ADMIN'],
        defaultSize: { w: 4, h: 1 },
    },
    'conversion-funnel': {
        type: 'conversion-funnel',
        title: '销售漏斗',
        description: '线索到成交的转化漏斗',
        icon: BarChart,
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
    'cash-flow-forecast': {
        type: 'cash-flow-forecast',
        title: '现金流预测',
        description: '未来30天回款预测',
        icon: TrendingUp,
        iconColor: 'text-emerald-600',
        permissions: ['FINANCE', 'MANAGER', 'ADMIN'],
        defaultSize: { w: 4, h: 2 },
    },
    'ar-aging': {
        type: 'ar-aging',
        title: '应收账龄',
        description: '应收账款账龄分布',
        icon: Layers,
        iconColor: 'text-orange-500',
        permissions: ['FINANCE', 'MANAGER', 'ADMIN'],
        defaultSize: { w: 2, h: 2 },
    },
    'enhanced-funnel': {
        type: 'enhanced-funnel',
        title: '销售漏斗(增强)',
        description: '转化率/耗时/环比分析',
        icon: PieChart,
        iconColor: 'text-purple-600',
        permissions: ['MANAGER', 'ADMIN'],
        defaultSize: { w: 2, h: 2 },
    },

    // ===== 通用 =====
    'pending-approval': {
        type: 'pending-approval',
        title: '待审批',
        description: '待我审批的任务',
        icon: ClipboardCheck,
        iconColor: 'text-amber-500',
        permissions: ['USER', 'SALES', 'MANAGER', 'ADMIN', 'FINANCE', 'DISPATCHER'],
        defaultSize: { w: 1, h: 1 },
    },
    'sales-trend': {
        type: 'sales-trend',
        title: '销售趋势',
        description: '近期销售趋势图表',
        icon: TrendingUp,
        iconColor: 'text-blue-500',
        permissions: ['USER', 'MANAGER', 'ADMIN'],
        defaultSize: { w: 2, h: 2 },
    },
    'channel-performance': {
        type: 'channel-performance',
        title: '渠道业绩',
        description: '渠道带单统计与佣金概览',
        icon: TrendingUp,
        iconColor: 'text-primary',
        permissions: ['USER', 'MANAGER', 'ADMIN'],
        defaultSize: { w: 2, h: 2 },
    },
};

/**
 * Widget 组件映射表 - 使用 React.lazy 实现懒加载
 */
export const WIDGET_COMPONENTS: Partial<Record<WidgetType, React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>>> = {
    // 销售专属
    'sales-target': React.lazy(() => import('./sales-widgets').then(m => ({ default: m.SalesTargetWidget }))),
    'sales-leads': React.lazy(() => import('./sales-widgets').then(m => ({ default: m.SalesLeadsWidget }))),
    'sales-conversion': React.lazy(() => import('./sales-widgets').then(m => ({ default: m.SalesConversionWidget }))),
    'sales-avg-order': React.lazy(() => import('./sales-widgets').then(m => ({ default: m.SalesAvgOrderWidget }))),

    // 管理层
    'team-sales': React.lazy(() => import('./manager-widgets').then(m => ({ default: m.TeamSalesWidget }))),
    'team-target': React.lazy(() => import('./manager-widgets').then(m => ({ default: m.TeamTargetWidget }))),
    'team-leaderboard': React.lazy(() => import('./manager-widgets').then(m => ({ default: m.TeamLeaderboardWidget }))),
    'executive-summary': React.lazy(() => import('./executive-summary-widget').then(m => ({ default: m.ExecutiveSummaryWidget }))),
    'conversion-funnel': React.lazy(() => import('./service-widgets').then(m => ({ default: m.ConversionFunnelWidget }))),
    'enhanced-funnel': React.lazy(() => import('./enhanced-funnel-widget').then(m => ({ default: m.EnhancedFunnelWidget }))),

    // 派单员
    'pending-measure': React.lazy(() => import('./service-widgets').then(m => ({ default: m.PendingMeasureWidget }))),
    'pending-install': React.lazy(() => import('./service-widgets').then(m => ({ default: m.PendingInstallWidget }))),
    'today-schedule': React.lazy(() => import('./service-widgets').then(m => ({ default: m.TodayScheduleWidget }))),

    // 财务
    'ar-summary': React.lazy(() => import('./service-widgets').then(m => ({ default: m.ARSummaryWidget }))),
    'ar-aging': React.lazy(() => import('./ar-aging-widget').then(m => ({ default: m.ARAgingWidget }))),
    'ap-summary': React.lazy(() => import('./service-widgets').then(m => ({ default: m.APSummaryWidget }))),
    'cash-flow': React.lazy(() => import('./service-widgets').then(m => ({ default: m.CashFlowWidget }))),
    'cash-flow-forecast': React.lazy(() => import('./cash-flow-forecast-widget').then(m => ({ default: m.CashFlowForecastWidget }))),

    // 通用
    'pending-approval': React.lazy(() => import('./manager-widgets').then(m => ({ default: m.PendingApprovalWidget }))),
    'sales-trend': React.lazy(() => import('./manager-widgets').then(m => ({ default: m.SalesTrendWidget }))),
    'channel-performance': React.lazy(() => import('./channel-widgets').then(m => ({ default: m.ChannelPerformanceWidget }))),
};

/**
 * 角色映射表：将系统角色映射到 Widget 权限角色
 * 支持多角色映射，确保所有用户都能访问对应的 Widget
 */
const ROLE_MAP: Record<string, string[]> = {
    'TENANT_ADMIN': ['ADMIN'],
    'SUPER_ADMIN': ['ADMIN'],
    'OWNER': ['ADMIN', 'MANAGER'],
    'ADMIN': ['ADMIN'],
    'MANAGER': ['MANAGER'],
    'SALES': ['SALES'],
    'FINANCE': ['FINANCE'],
    'DISPATCHER': ['DISPATCHER'],
    'USER': ['USER'],
};

/**
 * 根据用户角色过滤可用的 Widget
 * 通过角色映射支持 TENANT_ADMIN 等扩展角色
 */
export function getAvailableWidgets(role: string): WidgetMeta[] {
    const widgets = Object.values(WIDGET_REGISTRY).filter((widget): widget is WidgetMeta => widget !== undefined);
    // 获取映射后的权限角色列表，未匹配到时回退为 ['USER']
    const mappedRoles = ROLE_MAP[role] || ['USER'];
    return widgets.filter(
        widget =>
            mappedRoles.some(r => widget.permissions.includes(r)) ||
            widget.permissions.includes('ALL')
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
