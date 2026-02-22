'use client';


import { logger } from '@/shared/lib/logger';
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { ArrowRight, ChevronDown, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';

/**
 * 图表钻取组件
 * 
 * 功能：
 * 1. 点击图表数据点展开详情
 * 2. 支持多级下钻
 * 3. 面包屑导航返回上层
 */

export interface DrilldownLevel {
    id: string;
    label: string;
    data: DrilldownItem[];
}

export interface DrilldownItem {
    id: string;
    name: string;
    value: number;
    subLabel?: string;
    canDrilldown?: boolean;
    metadata?: Record<string, unknown>;
}

interface ChartDrilldownProps {
    title: string;
    initialData: DrilldownItem[];
    onDrilldown?: (item: DrilldownItem) => Promise<DrilldownItem[]>;
    renderValue?: (value: number) => string;
    className?: string;
}

export function ChartDrilldown({
    title,
    initialData,
    onDrilldown,
    renderValue = (v) => v.toLocaleString(),
    className = '',
}: ChartDrilldownProps) {
    const [levels, setLevels] = useState<DrilldownLevel[]>([
        { id: 'root', label: title, data: initialData }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const currentLevel = levels[levels.length - 1];

    const handleDrilldown = useCallback(async (item: DrilldownItem) => {
        if (!item.canDrilldown || !onDrilldown) return;

        setIsLoading(true);
        try {
            const subData = await onDrilldown(item);
            setLevels(prev => [...prev, {
                id: item.id,
                label: item.name,
                data: subData
            }]);
        } catch (error) {
            logger.error('Drilldown failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, [onDrilldown]);

    const handleBreadcrumbClick = useCallback((index: number) => {
        setLevels(prev => prev.slice(0, index + 1));
    }, []);

    // 面包屑导航
    const Breadcrumbs = () => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            {levels.map((level, index) => (
                <div key={level.id} className="flex items-center gap-1">
                    {index > 0 && <ChevronDown className="h-3 w-3 rotate-[-90deg]" />}
                    <button
                        onClick={() => handleBreadcrumbClick(index)}
                        className={`hover:text-primary transition-colors ${index === levels.length - 1 ? 'text-foreground font-medium' : ''
                            }`}
                        disabled={index === levels.length - 1}
                    >
                        {level.label}
                    </button>
                </div>
            ))}
        </div>
    );

    // 数据表格
    const DataTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50%]">名称</TableHead>
                    <TableHead className="text-right">数值</TableHead>
                    <TableHead className="w-[100px] text-right">操作</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {currentLevel.data.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            暂无数据
                        </TableCell>
                    </TableRow>
                ) : (
                    currentLevel.data.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                            <TableCell>
                                <div>
                                    <div className="font-medium">{item.name}</div>
                                    {item.subLabel && (
                                        <div className="text-xs text-muted-foreground">{item.subLabel}</div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                                {renderValue(item.value)}
                            </TableCell>
                            <TableCell className="text-right">
                                {item.canDrilldown && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDrilldown(item)}
                                        disabled={isLoading}
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">{title}</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                            <DialogTitle>{title} - 详细数据</DialogTitle>
                        </DialogHeader>
                        <Breadcrumbs />
                        <DataTable />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {levels.length > 1 && <Breadcrumbs />}
                <div className="max-h-[300px] overflow-auto">
                    <DataTable />
                </div>
            </CardContent>
        </Card>
    );
}

// 导出钻取 Hook
export function useDrilldown<T extends DrilldownItem>(
    fetchFn: (parentId: string) => Promise<T[]>
) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const drilldown = useCallback(async (item: DrilldownItem): Promise<T[]> => {
        setIsLoading(true);
        setError(null);
        try {
            return await fetchFn(item.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载失败');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [fetchFn]);

    return { drilldown, isLoading, error };
}
