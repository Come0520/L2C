'use client';

import { useMemo, ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { QuoteCategory, getCategoryLabel } from './quote-category-tabs';

/**
 * 报价项数据结构（用于汇总计算）
 */
export interface QuoteSummaryItem {
    id: string;
    category: QuoteCategory | string;
    roomId: string | null;
    parentId: string | null;
    subtotal: number | string;
    children?: QuoteSummaryItem[];
}

/**
 * 空间汇总数据
 */
export interface RoomSummary {
    roomId: string;
    roomName: string;
    itemCount: number;
    subtotal: number;
}

/**
 * 品类汇总数据
 */
export interface CategorySummary {
    category: QuoteCategory | string;
    categoryLabel: string;
    roomCount: number;
    itemCount: number;
    subtotal: number;
}

/**
 * 完整汇总数据
 */
export interface QuoteSummaryData {
    /** 按商品的小计映射（含附件） */
    itemSubtotals: Map<string, number>;
    /** 按空间的小计 */
    roomSummaries: RoomSummary[];
    /** 按品类的小计 */
    categorySummaries: CategorySummary[];
    /** 总计 */
    grandTotal: number;
    /** 商品总数 */
    totalItemCount: number;
}

interface QuoteSummaryCalculatorProps {
    /** 所有报价项 */
    items: QuoteSummaryItem[];
    /** 空间列表 */
    rooms: { id: string; name: string }[];
    /** 渲染函数 */
    children: (summary: QuoteSummaryData) => ReactNode;
}

/**
 * 计算商品小计（包含附件）
 */
function calculateItemSubtotal(item: QuoteSummaryItem, allItems: QuoteSummaryItem[]): number {
    const mainSubtotal = parseFloat(String(item.subtotal || 0));

    // 找到所有附件
    const accessories = allItems.filter(i => i.parentId === item.id);
    const accessoriesTotal = accessories.reduce((sum, acc) => {
        return sum + parseFloat(String(acc.subtotal || 0));
    }, 0);

    return mainSubtotal + accessoriesTotal;
}

/**
 * 计算四层汇总数据
 */
export function calculateQuoteSummary(
    items: QuoteSummaryItem[],
    rooms: { id: string; name: string }[]
): QuoteSummaryData {
    // 1. 计算每个主商品的小计（含附件）
    const itemSubtotals = new Map<string, number>();
    const mainItems = items.filter(i => !i.parentId); // 只处理主商品

    mainItems.forEach(item => {
        itemSubtotals.set(item.id, calculateItemSubtotal(item, items));
    });

    // 2. 按空间汇总
    const roomMap = new Map<string, RoomSummary>();
    rooms.forEach(room => {
        roomMap.set(room.id, {
            roomId: room.id,
            roomName: room.name,
            itemCount: 0,
            subtotal: 0,
        });
    });

    // 未分配空间
    roomMap.set('__unassigned__', {
        roomId: '__unassigned__',
        roomName: '未分配空间',
        itemCount: 0,
        subtotal: 0,
    });

    mainItems.forEach(item => {
        const roomId = item.roomId || '__unassigned__';
        const roomSummary = roomMap.get(roomId);
        if (roomSummary) {
            roomSummary.itemCount += 1;
            roomSummary.subtotal += itemSubtotals.get(item.id) || 0;
        }
    });

    const roomSummaries = Array.from(roomMap.values()).filter(r => r.itemCount > 0);

    // 3. 按品类汇总
    const categoryMap = new Map<string, CategorySummary>();

    mainItems.forEach(item => {
        const category = item.category || 'OTHER';
        let categorySummary = categoryMap.get(category);

        if (!categorySummary) {
            categorySummary = {
                category,
                categoryLabel: getCategoryLabel(category as QuoteCategory) || category,
                roomCount: 0,
                itemCount: 0,
                subtotal: 0,
            };
            categoryMap.set(category, categorySummary);
        }

        categorySummary.itemCount += 1;
        categorySummary.subtotal += itemSubtotals.get(item.id) || 0;
    });

    // 计算每个品类涉及的空间数
    categoryMap.forEach((summary, category) => {
        const roomsInCategory = new Set(
            mainItems.filter(i => i.category === category).map(i => i.roomId || '__unassigned__')
        );
        summary.roomCount = roomsInCategory.size;
    });

    const categorySummaries = Array.from(categoryMap.values());

    // 4. 计算总计
    const grandTotal = Array.from(itemSubtotals.values()).reduce((sum, v) => sum + v, 0);
    const totalItemCount = mainItems.length;

    return {
        itemSubtotals,
        roomSummaries,
        categorySummaries,
        grandTotal,
        totalItemCount,
    };
}

/**
 * 四层汇总计算器组件
 * 接收报价项和空间数据，计算汇总并通过 render props 传递
 */
export function QuoteSummaryCalculator({
    items,
    rooms,
    children,
}: QuoteSummaryCalculatorProps) {
    const summary = useMemo(
        () => calculateQuoteSummary(items, rooms),
        [items, rooms]
    );

    return <>{children(summary)}</>;
}

/**
 * 空间小计显示组件
 */
export function RoomSubtotalDisplay({
    roomName,
    itemCount,
    subtotal,
    className,
}: {
    roomName: string;
    itemCount: number;
    subtotal: number;
    className?: string;
}) {
    return (
        <div className={cn('flex justify-between items-center py-2 px-4 bg-muted/50 rounded', className)}>
            <div className="flex items-center gap-2">
                <span className="font-medium">{roomName}</span>
                <span className="text-sm text-muted-foreground">({itemCount}件)</span>
            </div>
            <span className="font-medium">
                ¥{subtotal.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
    );
}

/**
 * 品类小计显示组件
 */
export function CategorySubtotalDisplay({
    categoryLabel,
    roomCount,
    itemCount,
    subtotal,
    className,
}: {
    categoryLabel: string;
    roomCount: number;
    itemCount: number;
    subtotal: number;
    className?: string;
}) {
    return (
        <div className={cn('flex justify-between items-center py-3 px-4 bg-primary/5 rounded-lg border', className)}>
            <div className="flex items-center gap-3">
                <span className="font-semibold">{categoryLabel}</span>
                <span className="text-sm text-muted-foreground">
                    {roomCount}个空间 · {itemCount}件商品
                </span>
            </div>
            <span className="text-lg font-bold text-primary">
                ¥{subtotal.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
    );
}

/**
 * 商品小计显示组件（含附件）
 */
export function ItemSubtotalDisplay({
    label,
    subtotal,
    hasAccessories,
    className,
}: {
    label?: string;
    subtotal: number;
    hasAccessories?: boolean;
    className?: string;
}) {
    return (
        <div className={cn('flex justify-end items-baseline gap-2 text-sm', className)}>
            <span className="text-muted-foreground">
                {label || (hasAccessories ? '商品小计（含附件）' : '商品小计')}
            </span>
            <span className="font-medium">
                ¥{subtotal.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
    );
}
