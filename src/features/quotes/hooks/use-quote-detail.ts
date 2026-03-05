'use client';

import { useMemo } from 'react';
import {
  CATEGORY_TO_PRODUCT_CATEGORIES,
  getCategoryLabel,
  type QuoteCategory,
  type ViewMode,
} from '../components/quote-category-tabs';
import { type QuoteItem } from '../components/quote-items-table/index';
import { type QuoteSummaryItem } from '../components/quote-summary-calculator';

// =============================================
// 类型定义
// =============================================

/**
 * 品类汇总数据
 */
export interface CategoryBreakdown {
  category: string;
  label: string;
  itemCount: number;
  subtotal: number;
}

/**
 * 报价明细原始数据（宽松类型，以 index signature 的方式兼容所有传入数据）
 * 使用宽松类型以便接受来自 ORM 的任意数据库字段组合
 */
interface RawItem {
  id: string;
  category?: string | null;
  roomId?: string | null;
  parentId?: string | null;
  subtotal?: string | number | null;
  productName?: string | null;
  productId?: string | null;
  quantity?: string | number | null;
  unitPrice?: string | number | null;
  unit?: string | null;
  width?: number | string | null;
  height?: number | string | null;
  foldRatio?: number | string | null;
  processFee?: string | number | null;
  remark?: string | null;
  attributes?: Record<string, unknown> | null;
  productSku?: string | null;
  // 允许额外字段传入（如 ORM 生成的时间戳等）
  [key: string]: unknown;
}

/**
 * `useQuoteDetail` 的输入参数类型
 */
export interface UseQuoteDetailProps {
  /**
   * 报价单数据（只需要 items 和 rooms 字段）
   */
  quote: {
    id: string;
    items?: RawItem[] | null;
    rooms?: Array<{
      id: string;
      name: string;
      items?: RawItem[] | null;
    }> | null;
  };
  /**
   * 当前激活的品类 tab（默认为 SUMMARY）
   */
  activeCategory?: QuoteCategory;
  /**
   * 当前视图模式（默认为 category）
   */
  viewMode?: ViewMode;
}

// =============================================
// Hook 实现
// =============================================

/**
 * useQuoteDetail - 报价单详情页计算逻辑 Hook
 *
 * @description 将 `quote-detail.tsx` 中所有纯数据计算逻辑剥离，
 * 包括 items 聚合、品类汇总、品类/空间视图数据映射。
 * 本 Hook 不包含任何副作用（无 API 调用），全部为确定性计算，便于单元测试。
 */
export function useQuoteDetail({
  quote,
  activeCategory = 'SUMMARY',
  viewMode: _viewMode = 'category',
}: UseQuoteDetailProps) {
  // 1. 聚合所有 items（顶级 + 所有 room.items）
  const allRawItems = useMemo(
    () => [...(quote.items || []), ...(quote.rooms || []).flatMap((r) => r.items || [])],
    [quote.items, quote.rooms]
  );

  // 2. 品类汇总（排除 parentId != null 的附件）
  const categoryBreakdown = useMemo<CategoryBreakdown[]>(() => {
    const mainItems = allRawItems.filter((item) => !item.parentId);
    const categoryMap = new Map<string, { label: string; count: number; subtotal: number }>();

    mainItems.forEach((item) => {
      const cat = item.category || 'OTHER';
      const existing = categoryMap.get(cat);
      if (existing) {
        existing.count += 1;
        existing.subtotal += Number(item.subtotal || 0);
      } else {
        categoryMap.set(cat, {
          label: getCategoryLabel(cat),
          count: 1,
          subtotal: Number(item.subtotal || 0),
        });
      }
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      label: data.label,
      itemCount: data.count,
      subtotal: data.subtotal,
    }));
  }, [allRawItems]);

  // 3. 汇总视图的数据格式（与 QuoteSummaryItem 完全兼容）
  const summaryItems = useMemo<QuoteSummaryItem[]>(
    () =>
      allRawItems.map((item) => ({
        id: item.id,
        category: item.category ?? 'OTHER',
        roomId: item.roomId ?? null,
        parentId: item.parentId ?? null,
        subtotal: item.subtotal ?? 0,
        productName: item.productName ?? undefined,
        quantity: item.quantity ?? undefined,
        unitPrice: item.unitPrice ?? undefined,
        unit: item.unit ?? undefined,
        width: item.width ?? undefined,
        height: item.height ?? undefined,
        foldRatio: item.foldRatio ?? undefined,
        processFee: item.processFee ?? undefined,
        remark: item.remark ?? undefined,
      })),
    [allRawItems]
  );

  // 4. 空间视图数据（直接透传原始 QuoteItem，不做字段映射）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomViewItems = allRawItems as any as QuoteItem[];

  // 5. 品类视图数据（按当前激活品类过滤）
  const categoryViewItems = useMemo(() => {
    if (activeCategory === 'SUMMARY') return [] as QuoteItem[];
    const cat = activeCategory as Exclude<QuoteCategory, 'SUMMARY'>;
    const allowedCategories = CATEGORY_TO_PRODUCT_CATEGORIES[cat] || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return allRawItems.filter((item) =>
      allowedCategories.includes(item.category || '')
    ) as any as QuoteItem[];
  }, [allRawItems, activeCategory]);

  // 6. 空间列表（供 summaryTab 使用）
  const summaryRooms = useMemo(
    () => (quote.rooms || []).map((r) => ({ id: r.id, name: r.name })),
    [quote.rooms]
  );

  return {
    allRawItems,
    categoryBreakdown,
    summaryItems,
    summaryRooms,
    roomViewItems,
    categoryViewItems,
  };
}
