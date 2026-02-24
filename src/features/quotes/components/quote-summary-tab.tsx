'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import LayoutList from 'lucide-react/dist/esm/icons/layout-list';
import Table2 from 'lucide-react/dist/esm/icons/table';
import {
    QuoteSummaryCalculator,
    QuoteSummaryData,
    CategorySubtotalDisplay,
    type QuoteSummaryItem,
} from './quote-summary-calculator';

interface QuoteSummaryTabProps {
    /** 所有报价项 */
    items: QuoteSummaryItem[];
    /** 空间列表 */
    rooms: { id: string; name: string; items?: QuoteSummaryItem[] }[];
    /** 额外的 className */
    className?: string;
}

/**
 * 报价汇总页组件
 * 支持简约版和详细版两种视图
 */
export function QuoteSummaryTab({ items, rooms, className }: QuoteSummaryTabProps) {
    // 视图模式：simple = 简约版，detailed = 详细版
    const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
    // 详细版展开的品类
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    /**
     * 切换品类展开状态
     */
    const toggleCategory = (category: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    /**
     * 获取品类下的商品列表
     */
    const getItemsByCategory = (category: string): QuoteSummaryItem[] => {
        return items.filter((item) => item.category === category && !item.parentId);
    };

    /**
     * 获取商品所属空间名称
     */
    const getRoomName = (roomId: string | null): string => {
        if (!roomId) return '未分配空间';
        const room = rooms.find((r) => r.id === roomId);
        return room?.name || '未知空间';
    };

    return (
        <QuoteSummaryCalculator items={items} rooms={rooms}>
            {(summary: QuoteSummaryData) => (
                <Card className={cn('', className)}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">报价汇总</CardTitle>
                            {/* 视图切换按钮 */}
                            <div className="flex gap-1">
                                <Button
                                    variant={viewMode === 'simple' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('simple')}
                                    className="gap-1.5"
                                >
                                    <LayoutList className="h-4 w-4" />
                                    简约版
                                </Button>
                                <Button
                                    variant={viewMode === 'detailed' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('detailed')}
                                    className="gap-1.5"
                                >
                                    <Table2 className="h-4 w-4" />
                                    详细版
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {viewMode === 'simple' ? (
                            /* ========== 简约版：品类 → 金额 ========== */
                            <div className="space-y-2">
                                {summary.categorySummaries.map((cat) => (
                                    <CategorySubtotalDisplay
                                        key={cat.category}
                                        categoryLabel={cat.categoryLabel}
                                        roomCount={cat.roomCount}
                                        itemCount={cat.itemCount}
                                        subtotal={cat.subtotal}
                                    />
                                ))}
                                {/* 总计 */}
                                <div className="flex justify-between items-center py-4 px-4 bg-primary text-primary-foreground rounded-lg mt-4">
                                    <span className="font-semibold text-lg">总计</span>
                                    <span className="text-2xl font-bold">
                                        ¥{summary.grandTotal.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            /* ========== 详细版：品类 → 空间 → 商品 → 金额 ========== */
                            <div className="space-y-3">
                                {summary.categorySummaries.map((cat) => {
                                    const isExpanded = expandedCategories.has(cat.category);
                                    const categoryItems = getItemsByCategory(cat.category);

                                    // 按空间分组
                                    const itemsByRoom = new Map<string, QuoteSummaryItem[]>();
                                    categoryItems.forEach((item) => {
                                        const roomId = item.roomId || '__unassigned__';
                                        if (!itemsByRoom.has(roomId)) {
                                            itemsByRoom.set(roomId, []);
                                        }
                                        itemsByRoom.get(roomId)!.push(item);
                                    });

                                    return (
                                        <div key={cat.category} className="border rounded-lg overflow-hidden">
                                            {/* 品类标题行（可点击展开） */}
                                            <button
                                                className="w-full flex justify-between items-center py-3 px-4 bg-primary/5 hover:bg-primary/10 transition-colors"
                                                onClick={() => toggleCategory(cat.category)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <span className="font-semibold">{cat.categoryLabel}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {cat.roomCount}个空间 · {cat.itemCount}件商品
                                                    </span>
                                                </div>
                                                <span className="text-lg font-bold text-primary">
                                                    ¥{cat.subtotal.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </button>

                                            {/* 展开的详细内容 */}
                                            {isExpanded && (
                                                <div className="border-t">
                                                    {Array.from(itemsByRoom.entries()).map(([roomId, roomItems]) => {
                                                        const roomName = getRoomName(roomId === '__unassigned__' ? null : roomId);
                                                        const roomSubtotal = roomItems.reduce(
                                                            (sum, item) => sum + (summary.itemSubtotals.get(item.id) || 0),
                                                            0
                                                        );

                                                        return (
                                                            <div key={roomId} className="border-b last:border-b-0">
                                                                {/* 空间标题 */}
                                                                <div className="flex justify-between items-center py-2 px-6 bg-muted/30">
                                                                    <span className="text-sm font-medium text-muted-foreground">
                                                                        {roomName}
                                                                    </span>
                                                                    <span className="text-sm font-medium">
                                                                        ¥{roomSubtotal.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                                {/* 商品列表 */}
                                                                <div className="divide-y">
                                                                    {roomItems.map((item) => {
                                                                        const itemSubtotal = summary.itemSubtotals.get(item.id) || 0;
                                                                        // 查找附件
                                                                        const accessories = items.filter((i) => i.parentId === item.id);

                                                                        return (
                                                                            <div key={item.id} className="py-2 px-8">
                                                                                <div className="flex justify-between items-center">
                                                                                    <span className="text-sm">商品 #{item.id.slice(-6)}</span>
                                                                                    <span className="text-sm font-medium">
                                                                                        ¥{itemSubtotal.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                        {accessories.length > 0 && (
                                                                                            <span className="text-xs text-muted-foreground ml-1">
                                                                                                (含{accessories.length}件附件)
                                                                                            </span>
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* 总计 */}
                                <div className="flex justify-between items-center py-4 px-4 bg-primary text-primary-foreground rounded-lg mt-4">
                                    <div>
                                        <span className="font-semibold text-lg">总计</span>
                                        <span className="text-sm ml-2 opacity-80">
                                            {summary.totalItemCount}件商品
                                        </span>
                                    </div>
                                    <span className="text-2xl font-bold">
                                        ¥{summary.grandTotal.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </QuoteSummaryCalculator>
    );
}
