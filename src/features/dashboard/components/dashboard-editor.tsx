'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/shared/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Settings, Plus, RotateCcw, Save, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
    getDashboardConfigAction,
    saveDashboardConfigAction,
    resetDashboardConfigAction,
} from '../actions/config';
import type { UserDashboardConfig, WidgetConfig, WidgetType } from '../types';
import { getDefaultDashboardConfig } from '../utils';
import { WIDGET_REGISTRY, getAvailableWidgets } from '../widgets/registry';
import { WidgetRenderer } from '../widgets/widget-renderer';

// 引入 react-grid-layout 样式
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// 创建响应式网格布局组件
const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardEditorProps {
    userRole: string;
    onConfigChange?: (config: UserDashboardConfig) => void;
}

/**
 * 仪表盘编辑器组件
 * 使用 react-grid-layout 支持拖拽布局和调整大小
 */
export function DashboardEditor({ userRole, onConfigChange }: DashboardEditorProps) {
    const [config, setConfig] = useState<UserDashboardConfig | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 加载用户配置
    useEffect(() => {
        async function loadConfig() {
            try {
                const savedConfig = await getDashboardConfigAction();
                if (savedConfig && savedConfig.widgets?.length > 0) {
                    setConfig(savedConfig);
                } else {
                    setConfig(getDefaultDashboardConfig(userRole));
                }
            } catch (error) {
                console.error('加载仪表盘配置失败:', error);
                setConfig(getDefaultDashboardConfig(userRole));
            } finally {
                setLoading(false);
            }
        }
        loadConfig();
    }, [userRole]);

    // 获取可用的 Widget 列表（已过滤权限）
    const availableWidgets = useMemo(() => getAvailableWidgets(userRole), [userRole]);

    // 获取已添加和未添加的 Widget
    const addedWidgetTypes = useMemo(
        () => new Set(config?.widgets.map(w => w.type) || []),
        [config?.widgets]
    );
    const hiddenWidgets = useMemo(
        () => availableWidgets.filter(w => !addedWidgetTypes.has(w.type)),
        [availableWidgets, addedWidgetTypes]
    );

    // 将 WidgetConfig 转换为 react-grid-layout 的 Layout
    const layout: Layout[] = useMemo(() => {
        if (!config) return [];
        return config.widgets
            .filter(w => w.visible)
            .map(w => ({
                i: w.id,
                x: w.x,
                y: w.y,
                w: w.w,
                h: w.h,
                minW: 1,
                minH: 1,
                maxW: 4,
                maxH: 4,
            }));
    }, [config]);

    // 处理布局变化
    const handleLayoutChange = useCallback((newLayout: Layout[]) => {
        if (!config || !isEditing) return;

        const updatedWidgets = config.widgets.map(widget => {
            const layoutItem = newLayout.find(l => l.i === widget.id);
            if (layoutItem) {
                return {
                    ...widget,
                    x: layoutItem.x,
                    y: layoutItem.y,
                    w: layoutItem.w,
                    h: layoutItem.h,
                };
            }
            return widget;
        });

        setConfig({
            ...config,
            widgets: updatedWidgets,
        });
    }, [config, isEditing]);

    // 添加 Widget
    const handleAddWidget = useCallback((type: WidgetType) => {
        if (!config) return;

        const meta = WIDGET_REGISTRY[type];
        if (!meta) return;
        const newWidget: WidgetConfig = {
            id: `w-${Date.now()}`,
            type,
            title: meta.title || 'Widget',
            x: 0,
            y: Infinity, // 放到最底部
            w: meta.defaultSize.w,
            h: meta.defaultSize.h,
            visible: true,
        };

        setConfig({
            ...config,
            widgets: [...config.widgets, newWidget],
        });
    }, [config]);

    // 移除 Widget
    const handleRemoveWidget = useCallback((widgetId: string) => {
        if (!config) return;
        setConfig({
            ...config,
            widgets: config.widgets.filter(w => w.id !== widgetId),
        });
    }, [config]);

    // 保存配置
    const handleSave = useCallback(async () => {
        if (!config) return;

        setSaving(true);
        try {
            const result = await saveDashboardConfigAction(config);
            if (result.success) {
                toast.success('仪表盘配置已保存');
                setIsEditing(false);
                onConfigChange?.(config);
            } else {
                toast.error('保存失败', { description: result.error });
            }
        } catch (error) {
            console.error('保存配置失败:', error);
            toast.error('保存失败');
        } finally {
            setSaving(false);
        }
    }, [config, onConfigChange]);

    // 重置配置
    const handleReset = useCallback(async () => {
        setSaving(true);
        try {
            await resetDashboardConfigAction({});
            const defaultConfig = getDefaultDashboardConfig(userRole);
            setConfig(defaultConfig);
            toast.success('已恢复默认配置');
        } catch (error) {
            console.error('重置配置失败:', error);
            toast.error('重置失败');
        } finally {
            setSaving(false);
        }
    }, [userRole]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">加载中...</span>
            </div>
        );
    }

    if (!config) {
        return (
            <Card className="glass-liquid border-white/10">
                <CardContent className="py-8 text-center text-muted-foreground">
                    <p>无法加载仪表盘配置</p>
                </CardContent>
            </Card>
        );
    }

    const visibleWidgets = config.widgets.filter(w => w.visible);

    return (
        <div className="space-y-4">
            {/* 工具栏 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isEditing && (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" disabled={hiddenWidgets.length === 0}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        添加组件
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
                                    {hiddenWidgets.map(widget => (
                                        <DropdownMenuItem
                                            key={widget.type}
                                            onClick={() => handleAddWidget(widget.type)}
                                        >
                                            <widget.icon className={cn("h-4 w-4 mr-2", widget.iconColor)} />
                                            {widget.title}
                                        </DropdownMenuItem>
                                    ))}
                                    {hiddenWidgets.length === 0 && (
                                        <DropdownMenuItem disabled>
                                            已添加所有可用组件
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <RotateCcw className="h-4 w-4 mr-1" />
                                        恢复默认
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>恢复默认配置</DialogTitle>
                                        <DialogDescription>
                                            确定要将仪表盘恢复为默认配置吗？当前的自定义布局将会丢失。
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">取消</Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                            <Button onClick={handleReset} disabled={saving}>
                                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                确认恢复
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                                取消
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                <Save className="h-4 w-4 mr-1" />
                                保存
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Settings className="h-4 w-4 mr-1" />
                            编辑布局
                        </Button>
                    )}
                </div>
            </div>

            {/* 网格布局 */}
            <div
                className={cn(
                    "transition-all rounded-lg",
                    isEditing && "bg-muted/20 p-2 border-2 border-dashed border-muted-foreground/20"
                )}
            >
                {visibleWidgets.length > 0 ? (
                    <ResponsiveGridLayout
                        className="layout"
                        layouts={{ lg: layout }}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 4, md: 4, sm: 2, xs: 2, xxs: 1 }}
                        rowHeight={120}
                        isDraggable={isEditing}
                        isResizable={isEditing}
                        onLayoutChange={handleLayoutChange}
                        draggableHandle=".drag-handle"
                        margin={[16, 16]}
                    >
                        {visibleWidgets.map(widget => (
                            <div key={widget.id} className="relative group">
                                {/* 编辑模式控制栏 */}
                                {isEditing && (
                                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-background/90 backdrop-blur-sm rounded-md p-1 flex items-center gap-1 shadow-md border">
                                            <div className="drag-handle cursor-grab px-1">
                                                <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                                                    <circle cx="9" cy="6" r="1.5" />
                                                    <circle cx="15" cy="6" r="1.5" />
                                                    <circle cx="9" cy="12" r="1.5" />
                                                    <circle cx="15" cy="12" r="1.5" />
                                                    <circle cx="9" cy="18" r="1.5" />
                                                    <circle cx="15" cy="18" r="1.5" />
                                                </svg>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => handleRemoveWidget(widget.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <WidgetRenderer type={widget.type} className="h-full" />
                            </div>
                        ))}
                    </ResponsiveGridLayout>
                ) : (
                    <div className="py-12 text-center text-muted-foreground">
                        <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>暂无组件</p>
                        <p className="text-sm">点击"编辑布局"然后"添加组件"开始自定义您的仪表盘</p>
                    </div>
                )}
            </div>
        </div>
    );
}
