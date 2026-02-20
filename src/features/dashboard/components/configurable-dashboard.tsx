'use client';

import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/shared/lib/utils';
import { GripVertical, X, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { WidgetConfig, UserDashboardConfig as DashboardLayoutConfig } from '../types';

interface ConfigurableDashboardProps {
    config: DashboardLayoutConfig;
    onConfigChange?: (config: DashboardLayoutConfig) => void;
    renderWidget: (widget: WidgetConfig) => React.ReactNode;
    isEditing?: boolean;
    className?: string;
}

/**
 * 可配置仪表盘组件
 * 支持拖拽布局、Widget 显示/隐藏、配置持久化
 */
export function ConfigurableDashboard({
    config,
    onConfigChange,
    renderWidget,
    isEditing = false,
    className
}: ConfigurableDashboardProps) {
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<{ x: number; y: number } | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    // 计算网格区域
    const getGridArea = (widget: WidgetConfig) => {
        return `${widget.y + 1} / ${widget.x + 1} / ${widget.y + widget.h + 1} / ${widget.x + widget.w + 1}`;
    };

    // 处理拖拽开始
    const handleDragStart = useCallback((e: React.DragEvent, widgetId: string) => {
        if (!isEditing) return;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', widgetId);
        setDraggingId(widgetId);
    }, [isEditing]);

    // 处理拖拽经过
    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (!isEditing || !gridRef.current) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const rect = gridRef.current.getBoundingClientRect();
        const colWidth = rect.width / config.columns;
        const rowHeight = 100; // 估算行高

        const x = Math.floor((e.clientX - rect.left) / colWidth);
        const y = Math.floor((e.clientY - rect.top) / rowHeight);

        setDropTarget({ x: Math.max(0, Math.min(x, config.columns - 1)), y: Math.max(0, y) });
    }, [isEditing, config.columns]);

    // 处理放置
    const handleDrop = useCallback((e: React.DragEvent) => {
        if (!isEditing || !dropTarget) return;
        e.preventDefault();

        const widgetId = e.dataTransfer.getData('text/plain');
        if (!widgetId) return;

        const newWidgets = config.widgets.map(w => {
            if (w.id === widgetId) {
                return { ...w, x: dropTarget.x, y: dropTarget.y };
            }
            return w;
        });

        onConfigChange?.({ ...config, widgets: newWidgets });
        setDraggingId(null);
        setDropTarget(null);
    }, [isEditing, dropTarget, config, onConfigChange]);

    // 处理拖拽结束
    const handleDragEnd = useCallback(() => {
        setDraggingId(null);
        setDropTarget(null);
    }, []);

    // 切换 Widget 可见性
    const toggleWidgetVisibility = useCallback((widgetId: string) => {
        const newWidgets = config.widgets.map(w => {
            if (w.id === widgetId) {
                return { ...w, visible: !w.visible };
            }
            return w;
        });
        onConfigChange?.({ ...config, widgets: newWidgets });
    }, [config, onConfigChange]);

    // 移除 Widget
    const removeWidget = useCallback((widgetId: string) => {
        const newWidgets = config.widgets.map(w => {
            if (w.id === widgetId) {
                return { ...w, visible: false };
            }
            return w;
        });
        onConfigChange?.({ ...config, widgets: newWidgets });
    }, [config, onConfigChange]);

    const visibleWidgets = config.widgets.filter(w => w.visible);
    const hiddenWidgets = config.widgets.filter(w => !w.visible);

    return (
        <div className={cn("relative", className)}>
            {/* 编辑模式下显示隐藏的 Widget 菜单 */}
            {isEditing && hiddenWidgets.length > 0 && (
                <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">添加组件：</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                选择组件
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {hiddenWidgets.map(w => (
                                <DropdownMenuItem
                                    key={w.id}
                                    onClick={() => toggleWidgetVisibility(w.id)}
                                >
                                    {w.title}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            {/* 网格容器 */}
            <div
                ref={gridRef}
                className={cn(
                    "grid gap-4 transition-all",
                    isEditing && "bg-muted/20 rounded-lg p-2 border-2 border-dashed border-muted-foreground/20"
                )}
                style={{
                    gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
                    gridAutoRows: 'minmax(100px, auto)',
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {/* 拖拽放置指示器 */}
                {isEditing && dropTarget && (
                    <div
                        className="absolute bg-primary/20 border-2 border-primary border-dashed rounded-lg pointer-events-none z-10"
                        style={{
                            gridColumn: `${dropTarget.x + 1} / span 1`,
                            gridRow: `${dropTarget.y + 1} / span 1`,
                        }}
                    />
                )}

                {/* Widget 渲染 */}
                {visibleWidgets.map(widget => (
                    <div
                        key={widget.id}
                        className={cn(
                            "relative group transition-all",
                            isEditing && "cursor-move",
                            draggingId === widget.id && "opacity-50"
                        )}
                        style={{ gridArea: getGridArea(widget) }}
                        draggable={isEditing}
                        onDragStart={(e) => handleDragStart(e, widget.id)}
                        onDragEnd={handleDragEnd}
                    >
                        {/* 编辑模式控制栏 */}
                        {isEditing && (
                            <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-background/80 backdrop-blur-sm rounded-md p-1 flex items-center gap-1 shadow-sm">
                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => removeWidget(widget.id)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )}
                        {renderWidget(widget)}
                    </div>
                ))}
            </div>
        </div>
    );
}


