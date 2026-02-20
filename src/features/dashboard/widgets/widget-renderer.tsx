'use client';

import React from 'react';
import type { WidgetType } from '../types';
import { WIDGET_REGISTRY, WIDGET_COMPONENTS, PlaceholderWidget } from './registry';
import { WidgetErrorBoundary } from "./widget-error-boundary";

interface WidgetRendererProps {
    type: WidgetType;
    className?: string;
}

/**
 * Widget 渲染器
 * 根据 WidgetType 动态渲染对应的 Widget 组件
 */
export const WidgetRenderer = React.memo(function WidgetRenderer({ type, className }: WidgetRendererProps) {
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
            <WidgetErrorBoundary title={meta?.title}>
                <React.Suspense fallback={<PlaceholderWidget type={type} title={meta?.title || '加载中...'} />}>
                    <Component />
                </React.Suspense>
            </WidgetErrorBoundary>
        </div>
    );
});
