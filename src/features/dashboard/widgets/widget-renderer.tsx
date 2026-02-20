'use client';

import React from 'react';
import type { WidgetType } from '../types';
import { WIDGET_REGISTRY, PlaceholderWidget } from './registry';
/**
 * Widget 组件映射表 - 使用 React.lazy 实现懒加载
 */
const WIDGET_COMPONENTS: Record<WidgetType, React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>> = {
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
            <React.Suspense fallback={<PlaceholderWidget type={type} title={meta?.title || '加载中...'} />}>
                <Component />
            </React.Suspense>
        </div>
    );
}
