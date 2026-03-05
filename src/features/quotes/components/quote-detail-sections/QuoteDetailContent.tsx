'use client';

import { updateQuote } from '@/features/quotes/actions/mutations';
import { QuoteConfig } from '@/services/quote-config.service';
import { Input } from '@/shared/ui/input';
import {
  QuoteCategoryTabs,
  type QuoteCategory,
  type ViewMode,
  CATEGORY_TO_PRODUCT_CATEGORIES,
} from '../quote-category-tabs';
import { QuoteItemsTable, type QuoteItem } from '../quote-items-table/index';
import { QuoteSummaryTab } from '../quote-summary-tab';
import { QuoteBottomSummaryBar, type CategoryBreakdown } from '../quote-bottom-summary-bar';
import { type QuoteSummaryItem } from '../quote-summary-calculator';
import dynamic from 'next/dynamic';

const CustomerInfoDrawer = dynamic(
  () => import('../customer-info-drawer').then((mod) => mod.CustomerInfoDrawer),
  { ssr: false }
);

interface QuoteDetailContentProps {
  /** 报价单基础信息 */
  quote: {
    id: string;
    notes?: string | null;
    totalAmount?: string | number | null;
    discountAmount?: string | number | null;
    finalAmount?: string | number | null;
    customer?: {
      id?: string | null;
      name?: string | null;
      phone?: string | null;
    } | null;
    rooms?: Array<{ id: string; name: string; items?: QuoteItem[] | unknown[] }> | null;
  };
  /** 只读模式 */
  isReadOnly: boolean;
  /** 显示配置（来自 QuoteConfig） */
  config?: QuoteConfig;
  /** 品类汇总数据 */
  categoryBreakdown: CategoryBreakdown[];
  /** 当前激活的品类 Tab */
  activeCategory: QuoteCategory;
  /** 品类切换回调 */
  onCategoryChange: (category: QuoteCategory) => void;
  /** 视图模式 */
  viewMode: ViewMode;
  /** 视图模式切换回调 */
  onViewModeChange: (mode: ViewMode) => void;
  /** 品类视图 items */
  categoryViewItems: QuoteItem[];
  /** 空间视图 items */
  roomViewItems: QuoteItem[];
  /** 汇总视图 items（与 QuoteSummaryItem 兼容） */
  summaryItems: QuoteSummaryItem[];
  /** 汇总视图 rooms */
  summaryRooms: { id: string; name: string }[];
  /** item 更新回调 */
  onItemUpdate: () => void;
  /** 添加空间事件回调 */
  onAddRoom: (name: string) => void;
  /** 行点击（价格参考）回调 */
  onRowClick: (item: QuoteItem) => void;
  /** 高级配置按鈕回调（URL 驱动模式） */
  onAdvancedEdit?: (item: QuoteItem) => void;
}

/**
 * 报价单主体内容区组件
 *
 * @description 包含：客户信息抽屉、备注输入框、品类 Tab 导航、
 * 三种视图内容区（汇总/品类/空间）、底部金额汇总栏
 */
export function QuoteDetailContent({
  quote,
  isReadOnly,
  config,
  categoryBreakdown,
  activeCategory,
  onCategoryChange,
  viewMode,
  onViewModeChange,
  categoryViewItems,
  roomViewItems,
  summaryItems,
  summaryRooms,
  onItemUpdate,
  onAddRoom,
  onRowClick,
  onAdvancedEdit,
}: QuoteDetailContentProps) {
  const mode = config?.mode || 'simple';

  return (
    <>
      {/* 客户信息抽屉（默认收起） */}
      <CustomerInfoDrawer
        customer={{
          id: quote.customer?.id || '',
          name: quote.customer?.name || '未知客户',
          phone: quote.customer?.phone || undefined,
          address: undefined,
        }}
        className="mb-6"
      />

      {/* 备注 */}
      <div className="mb-6">
        <Input
          defaultValue={quote.notes || ''}
          placeholder="添加备注信息（可选）"
          className="max-w-md"
          onBlur={(e) => updateQuote({ id: quote.id, notes: e.target.value })}
        />
      </div>

      {/* 品类 Tabs 导航 */}
      <QuoteCategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        className="mb-4"
      />

      {/* 报价内容区 */}
      <div className="pb-24">
        {activeCategory === 'SUMMARY' ? (
          // 汇总视图
          <QuoteSummaryTab items={summaryItems} rooms={summaryRooms} />
        ) : viewMode === 'category' ? (
          // 品类优先视图：当前品类下的所有空间
          <QuoteItemsTable
            viewMode="category"
            quoteId={quote.id}
            rooms={(quote.rooms || []) as Parameters<typeof QuoteItemsTable>[0]['rooms']}
            items={categoryViewItems}
            mode={mode}
            visibleFields={config?.visibleFields}
            readOnly={isReadOnly}
            onItemUpdate={onItemUpdate}
            dimensionLimits={config?.dimensionLimits}
            allowedCategories={
              CATEGORY_TO_PRODUCT_CATEGORIES[activeCategory as Exclude<QuoteCategory, 'SUMMARY'>]
            }
            activeCategory={activeCategory}
            onRowClick={onRowClick}
            onAddRoom={onAddRoom}
            onAdvancedEdit={onAdvancedEdit}
          />
        ) : (
          // 空间优先视图：按空间组织，每个空间内包含不同品类
          <QuoteItemsTable
            viewMode="room"
            quoteId={quote.id}
            rooms={(quote.rooms || []) as Parameters<typeof QuoteItemsTable>[0]['rooms']}
            items={roomViewItems}
            mode={mode}
            visibleFields={config?.visibleFields}
            readOnly={isReadOnly}
            onItemUpdate={onItemUpdate}
            dimensionLimits={config?.dimensionLimits}
            onRowClick={onRowClick}
            onAddRoom={onAddRoom}
            onAdvancedEdit={onAdvancedEdit}
          />
        )}
      </div>

      {/* 底部吸底汇总栏 */}
      <QuoteBottomSummaryBar
        totalAmount={Number(quote.totalAmount) || 0}
        discountAmount={Number(quote.discountAmount) || 0}
        finalAmount={Number(quote.finalAmount) || 0}
        categoryBreakdown={categoryBreakdown}
      />
    </>
  );
}
