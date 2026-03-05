'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState, parseAsString } from 'nuqs';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import dynamic from 'next/dynamic';
import X from 'lucide-react/dist/esm/icons/x';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';

import { getQuote, getQuoteVersions } from '@/features/quotes/actions/queries';
import { createRoom } from '@/features/quotes/actions/mutations';
import { QuoteConfig } from '@/services/quote-config.service';
import { checkDiscountRisk, RiskCheckResult } from '@/features/quotes/logic/risk-control';
import { useQuoteDetail } from '../hooks/use-quote-detail';

import { QuoteDetailHeader } from './quote-detail-sections/QuoteDetailHeader';
import { QuoteDetailDialogs } from './quote-detail-sections/QuoteDetailDialogs';
import { QuoteDetailContent } from './quote-detail-sections/QuoteDetailContent';
import { QuoteExpirationBanner } from './quote-expiration-banner';
import { type QuoteItem } from './quote-items-table/index';
import { type QuoteCategory, type ViewMode } from './quote-category-tabs';

// 懒加载价格参考面板（体积较大，仅按需加载）
const PriceReferencePanel = dynamic(
  () =>
    import('@/features/pricing/components/price-reference-panel').then(
      (mod) => mod.PriceReferencePanel
    ),
  { ssr: false }
);

// 懒加载高级配置抖尉（仅需要时加载）
const QuoteItemAdvancedDrawer = dynamic(
  () => import('./quote-item-advanced-drawer').then((mod) => mod.QuoteItemAdvancedDrawer),
  { ssr: false }
);

type QuoteData = NonNullable<Awaited<ReturnType<typeof getQuote>>['data']>;
type QuoteVersion = Awaited<ReturnType<typeof getQuoteVersions>>[number];

interface QuoteDetailProps {
  quote: QuoteData;
  versions?: QuoteVersion[];
  initialConfig?: QuoteConfig;
}

/**
 * 报价单详情页 - 调度器组件（Orchestrator）
 *
 * @description 只负责：
 * 1. 状态管理（dialog URL 状态、视图模式、选中商品）
 * 2. 调用 `useQuoteDetail` 获取所有计算结果
 * 3. 组合三个子组件（Header、Dialogs、Content）
 *
 * 纯数据计算逻辑已下沉至 `useQuoteDetail` Hook，
 * UI 渲染已分解至 quote-detail-sections/ 目录下的子组件。
 */
export function QuoteDetail({ quote, versions = [], initialConfig }: QuoteDetailProps) {
  const router = useRouter();

  // URL 驱动的 Dialog 状态（通过 nuqs 管理）
  const [activeDialog, setActiveDialog] = useQueryState('dialog', parseAsString);

  // URL 驱动的高级配置抖尉状态（通过 nuqs 管理）
  const [editItemId, setEditItemId] = useQueryState('editItem', parseAsString);

  // 本地 UI 状态
  const [config] = useState<QuoteConfig | undefined>(initialConfig);
  const [activeCategory, setActiveCategory] = useState<QuoteCategory>('SUMMARY');
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const [newRoomName, setNewRoomName] = useState('新空间');
  const [selectedItemForPricing, setSelectedItemForPricing] = useState<QuoteItem | null>(null);

  // 只有草稿状态可编辑
  const isReadOnly = quote.status !== 'DRAFT';

  // 委托 Hook 处理所有纯数据计算（allRawItems / categoryBreakdown / summaryItems 等）
  const {
    allRawItems,
    categoryBreakdown,
    summaryItems,
    summaryRooms,
    roomViewItems,
    categoryViewItems,
  } = useQuoteDetail({
    quote: {
      id: quote.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: quote.items as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rooms: quote.rooms as any,
    },
    activeCategory,
    viewMode,
  });

  // 风控检查（依赖聚合后的 allRawItems）
  const riskResult = useMemo<RiskCheckResult | null>(() => {
    if (!quote) return null;
    return checkDiscountRisk(
      allRawItems as Parameters<typeof checkDiscountRisk>[0],
      Number(quote.finalAmount) || 0,
      Number(quote.totalAmount) || 0,
      {
        quoteConfig: {
          minDiscountRate: config?.discountControl?.minDiscountRate,
          minProfitMargin: 0.15,
        },
      }
    );
  }, [allRawItems, quote, config]);

  // 通过 editItemId URL 参数查找当前需要高级编辑的 item
  const editingItem = useMemo(() => {
    if (!editItemId) return null;
    return (allRawItems as unknown as QuoteItem[]).find((item) => item.id === editItemId) ?? null;
  }, [editItemId, allRawItems]);

  // =============================================
  // 回调函数（使用 useCallback 保持引用稳定）
  // =============================================

  const handleSave = useCallback(() => toast.success('已保存'), []);

  const handleItemUpdate = useCallback(() => router.refresh(), [router]);

  /** 从 QuoteItemsTable 内部触发添加空间（传入名称） */
  const handleAddRoom = useCallback(
    (name: string) => {
      toast.promise(
        createRoom({ quoteId: quote.id, name }).then((res) => {
          if (res.error) throw new Error(res.error);
          return res.data;
        }),
        {
          loading: '创建空间中...',
          success: () => {
            router.refresh();
            return '空间创建成功';
          },
          error: (err) => err.message || '创建失败',
        }
      );
    },
    [quote.id, router]
  );

  /** 从添加空间 Dialog 内部触发创建空间（使用 newRoomName state） */
  const handleCreateRoom = useCallback(async () => {
    if (!newRoomName.trim()) {
      toast.error('请输入空间名称');
      return;
    }
    setActiveDialog(null);
    toast.promise(
      createRoom({ quoteId: quote.id, name: newRoomName.trim() }).then((res) => {
        if (res.error) throw new Error(res.error);
        return res.data;
      }),
      {
        loading: '创建空间中...',
        success: () => {
          setNewRoomName('新空间');
          router.refresh();
          return '空间创建成功';
        },
        error: (err) => err.message || '创建失败',
      }
    );
  }, [newRoomName, quote.id, router, setActiveDialog]);

  return (
    <div className="bg-muted/5 relative flex min-h-screen">
      {/* 主内容区（价格参考面板展开时向左缩进） */}
      <div
        className={cn(
          'min-w-0 flex-1 space-y-6 p-8 transition-all duration-300',
          selectedItemForPricing && 'mr-80'
        )}
      >
        {/* 风险提示栏 */}
        {riskResult?.isRisk && (
          <Alert
            variant={riskResult.hardStop ? 'destructive' : 'default'}
            className="mb-4 border-l-4 shadow-sm"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-bold">风险提示</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                {riskResult.reason.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              {riskResult.hardStop && (
                <div className="text-destructive-foreground mt-2 font-bold">
                  此报价单包含严重风险，必须修正后才能提交。
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* 顶部标题 + 操作按钮区 */}
        <QuoteDetailHeader
          quote={quote}
          versions={versions}
          config={config}
          riskResult={riskResult}
          setActiveDialog={setActiveDialog}
          onSave={handleSave}
        />

        {/* 过期提示条 */}
        <QuoteExpirationBanner
          quoteId={quote.id}
          status={quote.status || ''}
          validUntil={quote.validUntil}
          isReadOnly={isReadOnly}
        />

        {/* 所有 Dialogs 集中管理（不占布局空间） */}
        <QuoteDetailDialogs
          quoteId={quote.id}
          activeDialog={activeDialog}
          onClose={() => setActiveDialog(null)}
          newRoomName={newRoomName}
          onRoomNameChange={setNewRoomName}
          onCreateRoom={handleCreateRoom}
        />

        {/* 主体内容区（客户信息、备注、Tab 导航、视图内容、汇总栏） */}
        <QuoteDetailContent
          quote={quote}
          isReadOnly={isReadOnly}
          config={config}
          categoryBreakdown={categoryBreakdown}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          categoryViewItems={categoryViewItems}
          roomViewItems={roomViewItems}
          summaryItems={summaryItems}
          summaryRooms={summaryRooms}
          onItemUpdate={handleItemUpdate}
          onAddRoom={handleAddRoom}
          onRowClick={setSelectedItemForPricing}
          onAdvancedEdit={(item) => setEditItemId(item.id)}
        />

        {/* URL 驱动的高级配置 Drawer（通过 ?editItem=<id> 控制开关） */}
        <QuoteItemAdvancedDrawer
          open={!!editItemId}
          onOpenChange={(open) => {
            if (!open) setEditItemId(null);
          }}
          item={editingItem}
          onSuccess={handleItemUpdate}
        />
      </div>

      {/* 右侧滑出式价格参考面板 */}
      <div
        className={cn(
          'bg-background fixed top-[64px] right-0 bottom-0 z-20 w-80 transform border-l shadow-xl transition-transform duration-300 ease-in-out',
          selectedItemForPricing ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">💡 价格参考</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelectedItemForPricing(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="-mx-4 flex-1 overflow-y-auto px-4">
            <PriceReferencePanel
              productId={selectedItemForPricing?.productId || undefined}
              sku={selectedItemForPricing?.productSku || undefined}
              periodDays={180}
              className="border-none p-0 shadow-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
