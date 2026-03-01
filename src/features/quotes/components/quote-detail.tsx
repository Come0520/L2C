'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';

import { QuoteItemsTable, type QuoteItem } from './quote-items-table/index';
import { VersionQuote } from '../types';

import { QuoteVersionDropdown } from './quote-version-dropdown';
import { QuoteToOrderButton } from './quote-to-order-button';
import {
  updateQuote,
  submitQuote,
  approveQuote,
  rejectQuote,
  createRoom,
  copyQuote,
} from '@/features/quotes/actions/mutations';
import { Badge } from '@/shared/ui/badge';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { toast } from 'sonner';
import Ruler from 'lucide-react/dist/esm/icons/ruler';
import Save from 'lucide-react/dist/esm/icons/save';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Send from 'lucide-react/dist/esm/icons/send';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import { SendToCustomerDialog } from '@/shared/components/send-to-customer-dialog';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import { cn } from '@/shared/lib/utils';
import { checkDiscountRisk, RiskCheckResult } from '@/features/quotes/logic/risk-control';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
const QuoteVersionCompare = dynamic(
  () => import('./quote-version-compare').then((mod) => mod.QuoteVersionCompare),
  { ssr: false, loading: () => <div className="bg-muted h-96 w-full animate-pulse rounded-lg" /> }
);

import { QuoteConfig } from '@/services/quote-config.service';
import { QuoteConfigDialog } from './quote-config-dialog';

import { getQuote, getQuoteVersions } from '@/features/quotes/actions/queries';

import { QuoteBottomSummaryBar, CategoryBreakdown } from './quote-bottom-summary-bar';
import {
  QuoteCategoryTabs,
  QuoteCategory,
  ViewMode,
  CATEGORY_TO_PRODUCT_CATEGORIES,
  getCategoryLabel,
} from './quote-category-tabs';
import { QuoteSummaryTab } from './quote-summary-tab';
import { QuoteExportMenu } from './quote-export-menu';
import Layout from 'lucide-react/dist/esm/icons/layout';
import dynamic from 'next/dynamic';

import { QuoteExpirationBanner } from './quote-expiration-banner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';

const MeasureDataImportDialog = dynamic(
  () => import('./measure-data-import-dialog').then((mod) => mod.MeasureDataImportDialog),
  { ssr: false }
);
const QuoteExcelImportDialog = dynamic(
  () => import('./quote-excel-import-dialog').then((mod) => mod.QuoteExcelImportDialog),
  { ssr: false }
);
const SaveAsTemplateDialog = dynamic(
  () => import('./save-as-template-dialog').then((mod) => mod.SaveAsTemplateDialog),
  { ssr: false }
);
const RejectQuoteDialog = dynamic(
  () => import('./reject-quote-dialog').then((mod) => mod.RejectQuoteDialog),
  { ssr: false }
);
const CustomerInfoDrawer = dynamic(
  () => import('./customer-info-drawer').then((mod) => mod.CustomerInfoDrawer),
  { ssr: false }
);
const PriceReferencePanel = dynamic(
  () =>
    import('@/features/pricing/components/price-reference-panel').then(
      (mod) => mod.PriceReferencePanel
    ),
  { ssr: false }
);

type QuoteData = NonNullable<Awaited<ReturnType<typeof getQuote>>['data']>;
type QuoteVersion = Awaited<ReturnType<typeof getQuoteVersions>>[number];

interface QuoteDetailProps {
  quote: QuoteData;
  versions?: QuoteVersion[];
  initialConfig?: QuoteConfig;
}

export function QuoteDetail({ quote, versions = [], initialConfig }: QuoteDetailProps) {
  const router = useRouter();
  const [config, _setConfig] = useState<QuoteConfig | undefined>(initialConfig);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [excelImportOpen, setExcelImportOpen] = useState(false);
  // 品类和视图模式状态
  const [activeCategory, setActiveCategory] = useState<QuoteCategory>('SUMMARY');
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const mode = config?.mode || 'simple';
  // 只有 DRAFT（草稿）状态才允许编辑；其他状态（待审批、已接受、已拒绝、已过期）均为只读
  // 注意：isActive 是版本管理字段，表示是否为最新版本，与编辑权限无关，不应用于此处
  const isReadOnly = quote.status !== 'DRAFT';

  // 添加空间对话框状态
  // Create Room Dialog State
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('新空间');
  // Save as Template Dialog State
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  // Smart Pricing Engine State
  const [selectedItemForPricing, setSelectedItemForPricing] = useState<QuoteItem | null>(null);

  // Dialog State
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Real-time Risk Control
  const riskResult = useMemo<RiskCheckResult | null>(() => {
    if (!quote) return null;

    const allItems = [...(quote.items || []), ...(quote.rooms || []).flatMap((r) => r.items || [])];

    return checkDiscountRisk(
      allItems as Parameters<typeof checkDiscountRisk>[0],
      Number(quote.finalAmount) || 0,
      Number(quote.totalAmount) || 0,
      {
        quoteConfig: {
          minDiscountRate: config?.discountControl?.minDiscountRate,
          minProfitMargin: 0.15, // Default as it's not in QuoteConfigService yet
        },
      }
    );
  }, [quote, config]);

  // 创建空间处理函数
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error('请输入空间名称');
      return;
    }
    setAddRoomOpen(false);
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
  };

  // 计算品类汇总
  const categoryBreakdown = useMemo<CategoryBreakdown[]>(() => {
    const allItems = [
      ...(quote.items || []),
      ...(quote.rooms || []).flatMap((r) => r.items || []),
    ].filter((item) => !item.parentId); // 只计算主商品，不计算附件

    const categoryMap = new Map<string, { label: string; count: number; subtotal: number }>();

    allItems.forEach((item) => {
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
  }, [quote.items, quote.rooms]);

  const handleItemUpdate = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleAddRoomEvent = useCallback(
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

  const allRawItems = useMemo(
    () => [...(quote.items || []), ...(quote.rooms || []).flatMap((r) => r.items || [])],
    [quote.items, quote.rooms]
  );

  const summaryItems = useMemo(
    () =>
      allRawItems.map((item) => ({
        id: item.id,
        category: item.category,
        roomId: item.roomId,
        parentId: item.parentId,
        subtotal: item.subtotal,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unit: item.unit ?? undefined,
        width: item.width ?? undefined,
        height: item.height ?? undefined,
        foldRatio: item.foldRatio ?? undefined,
        processFee: item.processFee ?? undefined,
        remark: item.remark ?? undefined,
      })),
    [allRawItems]
  );

  const summaryRooms = useMemo(
    () => (quote.rooms || []).map((r) => ({ id: r.id, name: r.name })),
    [quote.rooms]
  );

  const categoryViewItems = useMemo(() => {
    if (activeCategory === 'SUMMARY') return [];
    const cat = activeCategory as Exclude<QuoteCategory, 'SUMMARY'>;
    const allowedCategories = CATEGORY_TO_PRODUCT_CATEGORIES[cat];
    return allRawItems
      .filter((item) => allowedCategories.includes(item.category))
      .map((item) => ({
        ...item,
        productId: item.productId || '',
        width: item.width || 0,
        height: item.height || 0,
        foldRatio: item.foldRatio ?? undefined,
        processFee: item.processFee ?? undefined,
        remark: item.remark ?? undefined,
        roomId: item.roomId || null,
        parentId: item.parentId || null,
        unit: item.unit || undefined,
        attributes: (item.attributes as NonNullable<QuoteItem['attributes']>) ?? undefined,
      })) as QuoteItem[];
  }, [allRawItems, activeCategory]);

  const roomViewItems = useMemo(() => {
    return allRawItems.map((item) => ({
      ...item,
      productId: item.productId || '',
      width: item.width || 0,
      height: item.height || 0,
      foldRatio: item.foldRatio ?? undefined,
      processFee: item.processFee ?? undefined,
      remark: item.remark ?? undefined,
      roomId: item.roomId || null,
      parentId: item.parentId || null,
      unit: item.unit || undefined,
      attributes: (item.attributes as NonNullable<QuoteItem['attributes']>) ?? undefined,
    })) as QuoteItem[];
  }, [allRawItems]);

  // Mode toggle logic removed - mode is now derived from config on line 72

  const handleSave = () => toast.success('Saved');

  return (
    <div className="bg-muted/5 relative flex min-h-screen">
      <div
        className={cn(
          'min-w-0 flex-1 space-y-6 p-8 transition-all duration-300',
          selectedItemForPricing && 'mr-80'
        )}
      >
        {/* Risk Alert Bar */}
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
        {/* Simple Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/quotes')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">报价单详情: {quote.quoteNo}</h2>
                <QuoteVersionDropdown
                  currentQuoteId={quote.id}
                  currentVersion={quote.version || 1}
                  versions={versions.map((v) => ({
                    ...v,
                    status: v.status || 'DRAFT',
                    createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
                    totalAmount: (v as { totalAmount?: number | string }).totalAmount,
                    finalAmount: (v as { finalAmount?: number | string }).finalAmount,
                  }))}
                  onCopy={async () => {
                    toast.promise(
                      (async () => {
                        const res = await copyQuote({ quoteId: quote.id });
                        if (res?.error) throw new Error(res.error);
                        if (res?.data?.id) {
                          router.push(`/quotes/${res.data.id}`);
                        }
                      })(),
                      {
                        loading: '正在复制报价单...',
                        success: '复制成功！',
                        error: (err) => err.message || '复制失败',
                      }
                    );
                  }}
                />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-muted-foreground text-sm">{quote.customer?.name}</span>
                <Badge
                  variant={
                    quote.status === 'ACCEPTED'
                      ? 'success'
                      : quote.status === 'REJECTED'
                        ? 'destructive' // 'error' -> 'destructive' usually in shadcn
                        : quote.status === 'PENDING_APPROVAL'
                          ? 'secondary' // warning -> secondary
                          : 'secondary'
                  }
                >
                  {quote.status === 'DRAFT' && '草稿'}
                  {quote.status === 'PENDING_APPROVAL' && '待审批'}
                  {quote.status === 'PENDING_CUSTOMER' && '待客户确认'}
                  {quote.status === 'ACCEPTED' && '已接受'}
                  {quote.status === 'REJECTED' && '已拒绝'}
                  {quote.status === 'EXPIRED' && '已过期'}
                </Badge>
              </div>
              {quote.approvalRequired && quote.status === 'PENDING_APPROVAL' && (
                <div className="mt-1 flex items-center text-xs text-amber-600">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  风险控制: 需要审批 (毛利过低或折扣过高)
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {versions.length > 1 && (
                <QuoteVersionCompare
                  currentQuote={{
                    id: quote.id,
                    version: quote.version,
                    totalAmount: quote.totalAmount || 0,
                    discountAmount: quote.discountAmount || 0,
                    finalAmount: quote.finalAmount || 0,
                    items: quote.items as VersionQuote['items'], // Structural match but explicit for safety
                    rooms: quote.rooms as VersionQuote['rooms'],
                  }}
                  versions={versions.map((v) => ({
                    id: v.id,
                    version: v.version,
                    status: v.status || 'DRAFT',
                    createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
                  }))}
                />
              )}
              {quote.status === 'DRAFT' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                    <Ruler className="mr-2 h-4 w-4" /> 导入测量
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => setTemplateDialogOpen(true)}>
                    <Layout className="mr-2 h-4 w-4" /> 保存为模板
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    disabled={riskResult?.hardStop}
                    title={riskResult?.hardStop ? '存在严重风险，无法提交' : '提交审核'}
                    className={riskResult?.hardStop ? 'cursor-not-allowed opacity-50' : ''}
                    onClick={async () => {
                      if (riskResult?.hardStop) {
                        toast.error('报价单存在严重风险，请修正后再提交');
                        return;
                      }
                      toast.promise(
                        submitQuote({ id: quote.id }).then((res) => {
                          if (res.error) throw new Error(res.error);
                          return res.data;
                        }),
                        {
                          loading: '提交中...',
                          success: '报价单已提交',
                          error: (err) => `提交失败: ${err.message}`,
                        }
                      );
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" /> 提交审核
                  </Button>
                </>
              )}

              {/* ... other buttons ... */}

              <QuoteExportMenu quote={quote} />

              {quote.status === 'PENDING_APPROVAL' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setRejectDialogOpen(true)}>
                    <XCircle className="mr-2 h-4 w-4" /> 驳回
                  </Button>
                  <Button variant="default" size="sm" onClick={() => setApproveDialogOpen(true)}>
                    <CheckCircle className="mr-2 h-4 w-4" /> 批准
                  </Button>
                </>
              )}

              {/* 审批通过或待客户确认：显示发送给客户确认按钮 */}
              {(quote.status === 'APPROVED' || quote.status === 'PENDING_CUSTOMER') && (
                <SendToCustomerDialog
                  type="quote"
                  id={quote.id}
                  description={`将报价单 ${quote.quoteNo} 发送给客户，客户点击链接可在小程序中签字确认。`}
                />
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <QuoteToOrderButton
                  quoteId={quote.id}
                  customerId={quote.customerId}
                  defaultAmount={quote.finalAmount || undefined}
                />
              </div>

              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> 保存
              </Button>
              <QuoteConfigDialog currentConfig={config} />
            </div>
          </div>
        </div>

        <QuoteExpirationBanner
          quoteId={quote.id}
          status={quote.status || ''}
          validUntil={quote.validUntil}
          isReadOnly={isReadOnly}
        />

        <MeasureDataImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          quoteId={quote.id}
          onSuccess={() => router.refresh()}
        />

        <QuoteExcelImportDialog
          open={excelImportOpen}
          onOpenChange={setExcelImportOpen}
          quoteId={quote.id}
          onSuccess={() => router.refresh()}
        />

        <RejectQuoteDialog
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          loading={actionLoading}
          onConfirm={async (reason) => {
            try {
              setActionLoading(true);
              const res = await rejectQuote({ id: quote.id, rejectReason: reason });
              if (res?.error) throw new Error(res.error);
              toast.success('报价单已驳回');
              setRejectDialogOpen(false);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : '操作失败');
            } finally {
              setActionLoading(false);
            }
          }}
        />

        <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认批准</AlertDialogTitle>
              <AlertDialogDescription>
                批准后，报价单将标记为已批准，且不可再修改。是否继续？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading}>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    setActionLoading(true);
                    const res = await approveQuote({ id: quote.id });
                    if (res?.error) throw new Error(res.error);
                    toast.success('报价单已批准');
                    setApproveDialogOpen(false);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : '操作失败');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
              >
                {actionLoading ? '批准中...' : '确认批准'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 客户信息抽屉（默认收起） */}
        <CustomerInfoDrawer
          customer={{
            id: quote.customer?.id || '',
            name: quote.customer?.name || '未知客户',
            phone: quote.customer?.phone || undefined,
            address: undefined, // 暂无法从 quote.customer 直接获取地址
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
          onCategoryChange={setActiveCategory}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
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
              rooms={quote.rooms || []}
              items={categoryViewItems}
              mode={mode}
              visibleFields={config?.visibleFields}
              readOnly={isReadOnly}
              onItemUpdate={handleItemUpdate}
              dimensionLimits={config?.dimensionLimits}
              allowedCategories={
                CATEGORY_TO_PRODUCT_CATEGORIES[activeCategory as Exclude<QuoteCategory, 'SUMMARY'>]
              }
              activeCategory={activeCategory}
              onRowClick={setSelectedItemForPricing}
              onAddRoom={handleAddRoomEvent}
            />
          ) : (
            // 空间优先视图：按空间组织，每个空间内包含不同品类
            <QuoteItemsTable
              viewMode="room"
              quoteId={quote.id}
              rooms={quote.rooms || []}
              items={roomViewItems}
              mode={mode}
              visibleFields={config?.visibleFields}
              readOnly={isReadOnly}
              onItemUpdate={handleItemUpdate}
              dimensionLimits={config?.dimensionLimits}
              onRowClick={setSelectedItemForPricing}
              onAddRoom={handleAddRoomEvent}
            />
          )}
        </div>

        {/* 底部吸底汇总栏 */}
        <QuoteBottomSummaryBar
          totalAmount={quote.totalAmount || 0}
          discountAmount={quote.discountAmount || 0}
          finalAmount={quote.finalAmount || 0}
          categoryBreakdown={categoryBreakdown}
        />

        {/* 添加空间对话框 */}
        <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>添加空间</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="输入空间名称"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateRoom();
                }}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddRoomOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateRoom}>确定</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SaveAsTemplateDialog
          quoteId={quote.id}
          open={templateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
          onSuccess={() => router.refresh()}
        />
      </div>

      {/* Price Reference Panel Sidebar */}
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
              sku={selectedItemForPricing?.productSku || undefined} // Fallback to SKU if productId missing
              periodDays={180}
              className="border-none p-0 shadow-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
