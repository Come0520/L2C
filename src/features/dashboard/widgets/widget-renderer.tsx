'use client';

import React from 'react';
import type { WidgetType } from '../types';
import { WIDGET_REGISTRY, PlaceholderWidget } from './registry';
import {
    SalesTargetWidget,
    SalesLeadsWidget,
    SalesConversionWidget,
    SalesAvgOrderWidget,
} from './sales-widgets';
import {
    TeamSalesWidget,
    TeamTargetWidget,
    TeamLeaderboardWidget,
    PendingApprovalWidget,
    SalesTrendWidget,
} from './manager-widgets';
import {
    PendingMeasureWidget,
    PendingInstallWidget,
    TodayScheduleWidget,
    ARSummaryWidget,
    APSummaryWidget,
    CashFlowWidget,
    ConversionFunnelWidget,
} from './service-widgets';
import { ChannelPerformanceWidget } from './channel-widgets';

/**
 * Widget 组件映射表
 */
const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType> = {
    // 销售专属
    'sales-target': SalesTargetWidget,
    'sales-leads': SalesLeadsWidget,
    'sales-conversion': SalesConversionWidget,
    'sales-avg-order': SalesAvgOrderWidget,

    // 管理层
    'team-sales': TeamSalesWidget,
    'team-target': TeamTargetWidget,
    'team-leaderboard': TeamLeaderboardWidget,
    'conversion-funnel': ConversionFunnelWidget,

    // 派单员
    'pending-measure': PendingMeasureWidget,
    'pending-install': PendingInstallWidget,
    'today-schedule': TodayScheduleWidget,

    // 财务
    'ar-summary': ARSummaryWidget,
    'ap-summary': APSummaryWidget,
    'cash-flow': CashFlowWidget,

    // 通用
    'pending-approval': PendingApprovalWidget,
    'sales-trend': SalesTrendWidget,
    'channel-performance': ChannelPerformanceWidget,
};

interface WidgetRendererProps {
    type: WidgetType;
    className?: string;
}

/**
 * Widget 渲染器
 * 根据 WidgetType 动态渲染对应的 Widget 组件
 */
export function WidgetRenderer({ type, className }: WidgetRendererProps) {
    const Component = WIDGET_COMPONENTS[type];
    const meta = WIDGET_REGISTRY[type];

    if (!Component) {
        // 未找到对应组件，显示占位符
        return (
            <div className={className}>
                <PlaceholderWidget type={type} title={meta?.title || '未知组件'} />
            </div>
        );
    }

    return (
        <div className={className}>
            <Component />
        </div>
    );
}
