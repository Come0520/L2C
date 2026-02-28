'use client';

import React, { useState, useCallback } from 'react';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { cn } from '@/shared/lib/utils';

// ==================== 响应式网格容器 ====================
const ResponsiveGridLayout = WidthProvider(Responsive);

// ==================== 本地存储键名 ====================
const LAYOUT_STORAGE_KEY = 'analytics-grid-layout-v1';

// ==================== 默认布局定义（12列网格）====================

/** lg（≥1200px）默认布局 */
const DEFAULT_LAYOUT_LG: Layout[] = [
    { i: 'stat-sales', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'stat-leads', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'stat-orders', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'stat-rate', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'trend', x: 0, y: 3, w: 7, h: 8, minW: 4, minH: 5 },
    { i: 'funnel', x: 7, y: 3, w: 5, h: 8, minW: 3, minH: 5 },
    { i: 'ar-aging', x: 0, y: 11, w: 5, h: 7, minW: 3, minH: 5 },
    { i: 'payables', x: 5, y: 11, w: 7, h: 3, minW: 3, minH: 2 },
    { i: 'leaderboard', x: 5, y: 14, w: 7, h: 4, minW: 3, minH: 3 },
    { i: 'targets', x: 0, y: 18, w: 12, h: 12, minW: 6, minH: 8 },
];

/** md（≥996px）布局 */
const DEFAULT_LAYOUT_MD: Layout[] = [
    { i: 'stat-sales', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'stat-leads', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'stat-orders', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'stat-rate', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'trend', x: 0, y: 3, w: 12, h: 7, minW: 4, minH: 5 },
    { i: 'funnel', x: 0, y: 10, w: 12, h: 7, minW: 3, minH: 5 },
    { i: 'ar-aging', x: 0, y: 17, w: 6, h: 7, minW: 3, minH: 5 },
    { i: 'payables', x: 6, y: 17, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'leaderboard', x: 6, y: 20, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'targets', x: 0, y: 24, w: 12, h: 12, minW: 6, minH: 8 },
];

const DEFAULT_LAYOUTS: Layouts = { lg: DEFAULT_LAYOUT_LG, md: DEFAULT_LAYOUT_MD };

// ==================== 工具函数 ====================

/** 从 localStorage 读取布局，失败时返回默认布局 */
function loadLayoutFromStorage(): Layouts {
    if (typeof window === 'undefined') return DEFAULT_LAYOUTS;
    try {
        const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : DEFAULT_LAYOUTS;
    } catch {
        return DEFAULT_LAYOUTS;
    }
}

/** 将布局保存到 localStorage */
function saveLayoutToStorage(layouts: Layouts) {
    try {
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
    } catch {
        // localStorage 空间不足时静默失败
    }
}

// ==================== 组件 Props ====================

interface AnalyticsDraggableLayoutProps {
    /** 是否处于可编辑（拖拽）模式 */
    isEditing: boolean;
    /** 各模块的渲染内容，key 需与 DEFAULT_LAYOUT 中的 i 一一对应 */
    items: Record<string, React.ReactNode>;
    /** 布局变化后的外部回调（可选） */
    onLayoutChange?: (layouts: Layouts) => void;
}

// ==================== 主组件 ====================

/**
 * 经营分析页面可拖拽网格布局组件
 *
 * 使用 react-grid-layout 实现模块拖拽、缩放功能，
 * 布局通过 localStorage 自动持久化。
 */
export function AnalyticsDraggableLayout({
    isEditing,
    items,
    onLayoutChange,
}: AnalyticsDraggableLayoutProps) {
    const [layouts, setLayouts] = useState<Layouts>(loadLayoutFromStorage);

    /** 布局变化时保存到 localStorage 并向外通知 */
    const handleLayoutChange = useCallback(
        (_currentLayout: Layout[], allLayouts: Layouts) => {
            setLayouts(allLayouts);
            saveLayoutToStorage(allLayouts);
            onLayoutChange?.(allLayouts);
        },
        [onLayoutChange]
    );

    return (
        <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={50}
            margin={[16, 16]}
            isDraggable={isEditing}
            isResizable={isEditing}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
            useCSSTransforms={true}
        >
            {Object.entries(items).map(([key, content]) => (
                <div key={key} className={cn('relative', isEditing && 'ring-primary ring-2 ring-dashed rounded-xl')}>
                    {/* 拖拽手柄（仅编辑模式显示） */}
                    {isEditing && (
                        <div className="drag-handle absolute top-2 right-2 z-10 flex cursor-grab items-center gap-1 rounded-md bg-black/10 px-2 py-1 text-[10px] text-white backdrop-blur-sm select-none hover:bg-black/20 active:cursor-grabbing">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                <circle cx="4" cy="3" r="1.2" />
                                <circle cx="8" cy="3" r="1.2" />
                                <circle cx="4" cy="6" r="1.2" />
                                <circle cx="8" cy="6" r="1.2" />
                                <circle cx="4" cy="9" r="1.2" />
                                <circle cx="8" cy="9" r="1.2" />
                            </svg>
                            拖拽
                        </div>
                    )}
                    {/* 模块内容区 */}
                    <div className="h-full w-full overflow-auto">
                        {content}
                    </div>
                </div>
            ))}
        </ResponsiveGridLayout>
    );
}

// ==================== 重置布局工具 ====================

/** 清除 localStorage 中的布局记录，恢复默认 */
export function resetAnalyticsLayout() {
    try {
        localStorage.removeItem(LAYOUT_STORAGE_KEY);
    } catch {
        // 静默失败
    }
}
