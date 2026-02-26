'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Card } from '@/shared/ui/card';
import { getQuote } from '../actions/queries';
import { Badge } from '@/shared/ui/badge';
import { ScrollArea } from '@/shared/ui/scroll-area';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import ArrowRightLeft from 'lucide-react/dist/esm/icons/arrow-right-left';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

import { VersionQuote, VersionQuoteItem } from '../types';
import { logger } from '@/shared/lib/logger';

interface QuoteVersionCompareProps {
    currentQuote: VersionQuote;
    versions: { id: string; version: number; status: string; createdAt: string | Date }[];
}

interface DiffItem {
    key: string;
    curr?: VersionQuoteItem;
    prev?: VersionQuoteItem;
    status: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
}

export function QuoteVersionCompare({ currentQuote, versions }: QuoteVersionCompareProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [compareId, setCompareId] = useState<string>('');
    const [compareQuote, setCompareQuote] = useState<VersionQuote | null>(null);
    const [loading, setLoading] = useState(false);

    const handleVersionChange = async (versionId: string) => {
        setCompareId(versionId);
        if (!versionId) {
            setCompareQuote(null);
            return;
        }

        setLoading(true);
        try {
            const { data } = await getQuote(versionId);
            setCompareQuote((data as unknown as VersionQuote) || null);
        } catch (error) {
            logger.error('Fetch version failed', error);
            toast.error('获取版本数据失败');
        } finally {
            setLoading(false);
        }
    };

    // Helper to diff amounts with color and indicator
    const renderDiffValue = (current: number | string, previous: number | string, prefix = '¥') => {
        const currVal = Number(current);
        const prevVal = Number(previous);
        const diff = currVal - prevVal;

        if (Math.abs(diff) < 0.01) return <span className="font-mono">{prefix}{currVal.toFixed(2)}</span>;

        const isPositive = diff > 0;
        return (
            <div className="flex flex-col items-end">
                <span className="font-mono font-bold">{prefix}{currVal.toFixed(2)}</span>
                <span className={cn(
                    "text-[10px] font-medium flex items-center",
                    isPositive ? "text-destructive" : "text-green-600"
                )}>
                    {isPositive ? '↑' : '↓'} {prefix}{Math.abs(diff).toFixed(2)}
                </span>
            </div>
        );
    };

    // Advanced Diff Matching
    const diffResult = useMemo(() => {
        if (!compareQuote) return null;

        // Flatten items from both quotes
        const flatten = (q: VersionQuote) => {
            const items = [...(q.items || [])] as VersionQuoteItem[];
            q.rooms?.forEach((r) => {
                r.items?.forEach((i) => {
                    items.push({ ...i, _roomName: r.name });
                });
            });
            return items;
        };

        const currentItems = flatten(currentQuote);
        const compareItems = flatten(compareQuote as VersionQuote);

        // Matching strategy: RoomName + ProductName
        const getKey = (item: VersionQuoteItem) => `${item._roomName || '未分配'}-${item.productName}`;

        const currentMap = new Map<string, VersionQuoteItem>();
        currentItems.forEach((i) => currentMap.set(getKey(i), i));

        const compareMap = new Map<string, VersionQuoteItem>();
        compareItems.forEach((i) => compareMap.set(getKey(i), i));

        const allKeys = Array.from(new Set([...currentMap.keys(), ...compareMap.keys()]));

        return allKeys.map((key) => {
            const curr = currentMap.get(key);
            const prev = compareMap.get(key);

            let status: DiffItem['status'] = 'UNCHANGED';
            if (!prev) status = 'ADDED';
            else if (!curr) status = 'REMOVED';
            else {
                const hasChanges =
                    Number(curr.unitPrice) !== Number(prev.unitPrice) ||
                    Number(curr.quantity) !== Number(prev.quantity) ||
                    Number(curr.subtotal) !== Number(prev.subtotal) ||
                    curr.remark !== prev.remark;
                status = hasChanges ? 'MODIFIED' : 'UNCHANGED';
            }

            return { key, curr, prev, status } as DiffItem;
        }).filter((d) => d.status !== 'UNCHANGED');
    }, [currentQuote, compareQuote]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-card/50 hover:bg-card shadow-sm border-border">
                    <ArrowRightLeft className="mr-2 h-4 w-4 text-primary" />
                    版本差异比对
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-2xl glass-layout-card">
                <div className="bg-muted/30 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-border/60 sticky top-0 z-10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            方案版本智能对比
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-card/50 px-3 py-1.5 rounded-full border border-border/50 shadow-inner">
                            <span className="text-xs font-medium text-muted-foreground">对比基准:</span>
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none">V{currentQuote.version} (当前)</Badge>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <div className="w-64">
                            <Select value={compareId} onValueChange={handleVersionChange}>
                                <SelectTrigger className="h-9 rounded-full bg-card shadow-sm transition-all focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder="对比版本..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/60 shadow-xl">
                                    {versions.filter((v) => v.id !== currentQuote.id).map((v) => (
                                        <SelectItem key={v.id} value={v.id} className="rounded-lg">
                                            V{v.version} - {new Date(v.createdAt).toLocaleDateString()} ({v.status === 'ORDERED' ? '已下单' : '历史方案'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-card/50">
                        <Loader2 className="w-10 h-10 animate-spin text-primary/60 mb-4" />
                        <p className="text-sm text-muted-foreground animate-pulse">正在提取历史数据并进行对齐分析...</p>
                    </div>
                ) : compareQuote ? (
                    <ScrollArea className="flex-1 bg-muted/10">
                        <div className="p-6 space-y-8 max-w-6xl mx-auto">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-6">
                                {[
                                    { label: '原始总额', current: currentQuote.totalAmount, prev: compareQuote.totalAmount },
                                    { label: '折扣让利', current: currentQuote.discountAmount, prev: compareQuote.discountAmount },
                                    { label: '最终报价', current: currentQuote.finalAmount, prev: compareQuote.finalAmount, highlight: true }
                                ].map((stat, i) => (
                                    <Card key={i} className={cn(
                                        "relative overflow-hidden p-5 border-none shadow-md transition-all hover:shadow-lg",
                                        stat.highlight ? "bg-primary text-primary-foreground" : "bg-card glass-panel"
                                    )}>
                                        <div className={cn("text-xs font-semibold uppercase tracking-wider mb-2 opacity-80", stat.highlight ? "text-primary-foreground/80" : "text-slate-500")}>
                                            {stat.label}
                                        </div>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-2xl font-black font-mono">
                                                ¥{Number(stat.current).toFixed(2)}
                                            </span>
                                            {renderDiffValue(stat.current, stat.prev, '')}
                                        </div>
                                        <div className={cn("mt-4 pt-4 border-t text-xs flex justify-between", stat.highlight ? "border-white/10" : "border-slate-100")}>
                                            <span className="opacity-70">对比版本 V{compareQuote.version}:</span>
                                            <span className="font-mono font-medium">¥{Number(stat.prev).toFixed(2)}</span>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Detailed Diff View */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        明细变动细节
                                        <Badge variant="outline" className="ml-1 text-[10px] font-mono border-slate-200">
                                            {diffResult?.length || 0} CHANGES
                                        </Badge>
                                    </h3>
                                    <div className="flex gap-3 text-[10px] items-center">
                                        <span className="flex items-center gap-1 text-green-600"><div className="w-2 h-2 rounded-sm bg-green-500/20 border border-green-500/50" /> 新增</span>
                                        <span className="flex items-center gap-1 text-destructive"><div className="w-2 h-2 rounded-sm bg-destructive/10 border border-destructive/50" /> 删除</span>
                                        <span className="flex items-center gap-1 text-amber-600"><div className="w-2 h-2 rounded-sm bg-amber-500/10 border border-amber-500/50" /> 修改</span>
                                    </div>
                                </div>

                                <div className="space-y-2 pb-10">
                                    {diffResult?.length === 0 ? (
                                        <div className="py-20 text-center glass-empty-state border-dashed border-border">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                                                <ArrowRightLeft className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">两个版本明细完全一致</p>
                                        </div>
                                    ) : (
                                        diffResult?.map((item) => {
                                            const { key, curr, prev, status } = item;
                                            return (
                                                <div key={key} className={cn(
                                                    "group relative overflow-hidden rounded-xl border transition-all hover:shadow-md",
                                                    status === 'ADDED' ? 'bg-green-500/5 border-green-500/20' :
                                                        status === 'REMOVED' ? 'bg-red-500/5 border-red-500/20' :
                                                            'bg-card border-border'
                                                )}>
                                                    <div className="flex">
                                                        {/* Side Indicator */}
                                                        <div className={cn(
                                                            "w-1 shrink-0",
                                                            status === 'ADDED' ? 'bg-green-500' :
                                                                status === 'REMOVED' ? 'bg-destructive' :
                                                                    'bg-amber-400'
                                                        )} />

                                                        <div className="flex-1 p-4 grid grid-cols-12 gap-4 items-center">
                                                            <div className="col-span-4">
                                                                <div className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-tighter">
                                                                    {curr?._roomName || prev?._roomName || '全局项目'}
                                                                </div>
                                                                <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                                                    {curr?.productName || prev?.productName}
                                                                </div>
                                                            </div>

                                                            <div className="col-span-8 grid grid-cols-2 gap-8 items-center">
                                                                {/* Current (Left) */}
                                                                <div className="flex justify-between items-center pr-4 border-r border-slate-100">
                                                                    {curr ? (
                                                                        <>
                                                                            <div className="space-y-0.5">
                                                                                <div className="text-[10px] text-slate-400">单价/数量</div>
                                                                                <div className="text-xs font-mono">¥{curr.unitPrice} × {curr.quantity}</div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <div className="text-[10px] text-slate-400">小额小计</div>
                                                                                <div className="text-sm font-black font-mono">¥{Number(curr.subtotal).toFixed(2)}</div>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-xs italic text-slate-300 ml-auto">已移除</span>
                                                                    )}
                                                                </div>

                                                                {/* Comparison (Right) */}
                                                                <div className="flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                                                    {prev ? (
                                                                        <>
                                                                            <div className="space-y-0.5">
                                                                                <div className="text-[10px] text-slate-400">旧版数值</div>
                                                                                <div className="text-xs font-mono line-through underline-offset-4 decoration-slate-300">
                                                                                    ¥{prev.unitPrice} × {prev.quantity}
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <div className="text-[10px] text-slate-400">旧版小计</div>
                                                                                <div className="text-sm font-mono strike bg-slate-100 px-1 rounded">¥{Number(prev.subtotal).toFixed(2)}</div>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full ml-auto">NEW ITEM</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50">
                        <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center mb-4">
                            <ArrowRightLeft className="w-8 h-8 text-primary/40 animate-pulse" />
                        </div>
                        <p className="text-slate-400 font-medium tracking-tight">请在右上角选取一个版本进行透视对比</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
