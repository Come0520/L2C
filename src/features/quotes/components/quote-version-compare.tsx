'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
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

    if (Math.abs(diff) < 0.01)
      return (
        <span className="font-mono">
          {prefix}
          {currVal.toFixed(2)}
        </span>
      );

    const isPositive = diff > 0;
    return (
      <div className="flex flex-col items-end">
        <span className="font-mono font-bold">
          {prefix}
          {currVal.toFixed(2)}
        </span>
        <span
          className={cn(
            'flex items-center text-[10px] font-medium',
            isPositive ? 'text-destructive' : 'text-green-600'
          )}
        >
          {isPositive ? '↑' : '↓'} {prefix}
          {Math.abs(diff).toFixed(2)}
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

    return allKeys
      .map((key) => {
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
      })
      .filter((d) => d.status !== 'UNCHANGED');
  }, [currentQuote, compareQuote]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          版本差异比对
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-layout-card flex h-[85vh] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border-none p-0 shadow-2xl">
        <div className="bg-muted/30 border-border/60 sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="from-primary bg-linear-to-r to-blue-600 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              方案版本智能对比
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-4">
            <div className="bg-card/50 border-border/50 flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-inner">
              <span className="text-muted-foreground text-xs font-medium">对比基准:</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                V{currentQuote.version} (当前)
              </Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <div className="w-64">
              <Select value={compareId} onValueChange={handleVersionChange}>
                <SelectTrigger className="bg-card focus:ring-primary/20 h-9 rounded-full shadow-sm transition-all focus:ring-2">
                  <SelectValue placeholder="对比版本..." />
                </SelectTrigger>
                <SelectContent className="border-border/60 rounded-xl shadow-xl">
                  {versions
                    .filter((v) => v.id !== currentQuote.id)
                    .map((v) => (
                      <SelectItem key={v.id} value={v.id} className="rounded-lg">
                        V{v.version} - {new Date(v.createdAt).toLocaleDateString()} (
                        {v.status === 'ORDERED' ? '已下单' : '历史方案'})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-card/50 flex flex-1 flex-col items-center justify-center">
            <Loader2 className="text-primary/60 mb-4 h-10 w-10 animate-spin" />
            <p className="text-muted-foreground animate-pulse text-sm">
              正在提取历史数据并进行对齐分析...
            </p>
          </div>
        ) : compareQuote ? (
          <ScrollArea className="bg-muted/10 flex-1">
            <div className="mx-auto max-w-6xl space-y-8 p-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  {
                    label: '原始总额',
                    current: currentQuote.totalAmount,
                    prev: compareQuote.totalAmount,
                  },
                  {
                    label: '折扣让利',
                    current: currentQuote.discountAmount,
                    prev: compareQuote.discountAmount,
                  },
                  {
                    label: '最终报价',
                    current: currentQuote.finalAmount,
                    prev: compareQuote.finalAmount,
                    highlight: true,
                  },
                ].map((stat, i) => (
                  <Card
                    key={i}
                    className={cn(
                      'relative overflow-hidden border-none p-5 shadow-md transition-all hover:shadow-lg',
                      stat.highlight ? 'bg-primary text-primary-foreground' : 'bg-card glass-panel'
                    )}
                  >
                    <div
                      className={cn(
                        'mb-2 text-xs font-semibold tracking-wider uppercase opacity-80',
                        stat.highlight ? 'text-primary-foreground/80' : 'text-slate-500'
                      )}
                    >
                      {stat.label}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-2xl font-black">
                        ¥{Number(stat.current).toFixed(2)}
                      </span>
                      {renderDiffValue(stat.current, stat.prev, '')}
                    </div>
                    <div
                      className={cn(
                        'mt-4 flex justify-between border-t pt-4 text-xs',
                        stat.highlight ? 'border-white/10' : 'border-slate-100'
                      )}
                    >
                      <span className="opacity-70">对比版本 V{compareQuote.version}:</span>
                      <span className="font-mono font-medium">¥{Number(stat.prev).toFixed(2)}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Detailed Diff View */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                    明细变动细节
                    <Badge
                      variant="outline"
                      className="ml-1 border-slate-200 font-mono text-[10px]"
                    >
                      {diffResult?.length || 0} CHANGES
                    </Badge>
                  </h3>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-green-600">
                      <div className="h-2 w-2 rounded-sm border border-green-500/50 bg-green-500/20" />{' '}
                      新增
                    </span>
                    <span className="text-destructive flex items-center gap-1">
                      <div className="bg-destructive/10 border-destructive/50 h-2 w-2 rounded-sm border" />{' '}
                      删除
                    </span>
                    <span className="flex items-center gap-1 text-amber-600">
                      <div className="h-2 w-2 rounded-sm border border-amber-500/50 bg-amber-500/10" />{' '}
                      修改
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pb-10">
                  {diffResult?.length === 0 ? (
                    <div className="glass-empty-state border-border border-dashed py-20 text-center">
                      <div className="bg-muted mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full">
                        <ArrowRightLeft className="text-muted-foreground h-6 w-6" />
                      </div>
                      <p className="text-muted-foreground text-sm">两个版本明细完全一致</p>
                    </div>
                  ) : (
                    diffResult?.map((item) => {
                      const { key, curr, prev, status } = item;
                      return (
                        <div
                          key={key}
                          className={cn(
                            'group relative overflow-hidden rounded-xl border transition-all hover:shadow-md',
                            status === 'ADDED'
                              ? 'border-green-500/20 bg-green-500/5'
                              : status === 'REMOVED'
                                ? 'border-red-500/20 bg-red-500/5'
                                : 'bg-card border-border'
                          )}
                        >
                          <div className="flex">
                            {/* Side Indicator */}
                            <div
                              className={cn(
                                'w-1 shrink-0',
                                status === 'ADDED'
                                  ? 'bg-green-500'
                                  : status === 'REMOVED'
                                    ? 'bg-destructive'
                                    : 'bg-amber-400'
                              )}
                            />

                            <div className="grid flex-1 grid-cols-12 items-center gap-4 p-4">
                              <div className="col-span-4">
                                <div className="mb-1 text-xs font-medium tracking-tighter text-slate-400 uppercase">
                                  {curr?._roomName || prev?._roomName || '全局项目'}
                                </div>
                                <div className="truncate font-bold text-slate-800 dark:text-slate-100">
                                  {curr?.productName || prev?.productName}
                                </div>
                              </div>

                              <div className="col-span-8 grid grid-cols-2 items-center gap-8">
                                {/* Current (Left) */}
                                <div className="flex items-center justify-between border-r border-slate-100 pr-4">
                                  {curr ? (
                                    <>
                                      <div className="space-y-0.5">
                                        <div className="text-[10px] text-slate-400">单价/数量</div>
                                        <div className="font-mono text-xs">
                                          ¥{curr.unitPrice} × {curr.quantity}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-[10px] text-slate-400">小额小计</div>
                                        <div className="font-mono text-sm font-black">
                                          ¥{Number(curr.subtotal).toFixed(2)}
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <span className="ml-auto text-xs text-slate-300 italic">
                                      已移除
                                    </span>
                                  )}
                                </div>

                                {/* Comparison (Right) */}
                                <div className="flex items-center justify-between opacity-60 transition-opacity group-hover:opacity-100">
                                  {prev ? (
                                    <>
                                      <div className="space-y-0.5">
                                        <div className="text-[10px] text-slate-400">旧版数值</div>
                                        <div className="font-mono text-xs line-through decoration-slate-300 underline-offset-4">
                                          ¥{prev.unitPrice} × {prev.quantity}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-[10px] text-slate-400">旧版小计</div>
                                        <div className="strike rounded bg-slate-100 px-1 font-mono text-sm">
                                          ¥{Number(prev.subtotal).toFixed(2)}
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <span className="ml-auto rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                                      NEW ITEM
                                    </span>
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
          <div className="flex flex-1 flex-col items-center justify-center bg-slate-50/50">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl">
              <ArrowRightLeft className="text-primary/40 h-8 w-8 animate-pulse" />
            </div>
            <p className="font-medium tracking-tight text-slate-400">
              请在右上角选取一个版本进行透视对比
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
