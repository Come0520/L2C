'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { LiquidButton } from '@/shared/ui/liquid/liquid-button';
import { Input } from '@/shared/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';


import { QuoteItemsTable, type QuoteItem } from './quote-items-table';

import { QuoteVersionDrawer } from './quote-version-drawer';
import { QuoteToOrderButton } from './quote-to-order-button';
import { updateQuote, submitQuote, approveQuote, rejectQuote, createRoom, copyQuote } from '@/features/quotes/actions/mutations';
import { Badge } from '@/shared/ui/badge';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { toast } from 'sonner';
import { Ruler, Save } from 'lucide-react';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
const QuoteVersionCompare = dynamic(
    () => import('./quote-version-compare').then((mod) => mod.QuoteVersionCompare),
    { ssr: false, loading: () => <div className="h-96 w-full animate-pulse bg-muted rounded-lg" /> }
);

import { QuoteConfig } from '@/services/quote-config.service';
// toggleQuoteMode removed

import { getQuote, getQuoteVersions } from '@/features/quotes/actions/queries';


import { MeasureDataImportDialog } from './measure-data-import-dialog';
import { QuoteBottomSummaryBar, CategoryBreakdown } from './quote-bottom-summary-bar';
import { CustomerInfoDrawer } from './customer-info-drawer';
import { QuoteCategoryTabs, QuoteCategory, ViewMode, CATEGORY_TO_PRODUCT_CATEGORIES } from './quote-category-tabs';
import { QuoteSummaryTab } from './quote-summary-tab';
import { QuoteExportMenu } from './quote-export-menu';
import { Download, Layout } from 'lucide-react';
import { DropdownMenuItem } from '@/shared/ui/dropdown-menu';
import dynamic from 'next/dynamic';

import { QuoteExcelImportDialog } from './quote-excel-import-dialog';
import { QuoteExpirationBanner } from './quote-expiration-banner';
import { SaveAsTemplateDialog } from './save-as-template-dialog';

const QuotePdfDownloader = dynamic(
    () => import('./quote-pdf-downloader').then((mod) => mod.QuotePdfDownloader),
    { ssr: false, loading: () => <Button variant="outline" disabled><Download className="mr-2 h-4 w-4" />Loading...</Button> }
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
    const isReadOnly = !quote.isActive;

    // 添加空间对话框状态
    const [addRoomOpen, setAddRoomOpen] = useState(false);
    const [newRoomName, setNewRoomName] = useState('新空间');
    // 保存为模板对话框状态
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

    // 创建空间处理函数
    const handleCreateRoom = async () => {
        if (!newRoomName.trim()) {
            toast.error('请输入空间名称');
            return;
        }
        setAddRoomOpen(false);
        toast.promise(createRoom({ quoteId: quote.id, name: newRoomName.trim() }), {
            loading: '创建空间中...',
            success: () => {
                setNewRoomName('新空间');
                router.refresh();
                return '空间创建成功';
            },
            error: '创建失败'
        });
    };

    // 计算品类汇总
    const categoryBreakdown = useMemo<CategoryBreakdown[]>(() => {
        const allItems = [
            ...(quote.items || []),
            ...(quote.rooms || []).flatMap((r) => r.items || [])
        ].filter(item => !item.parentId); // 只计算主商品，不计算附件

        const categoryMap = new Map<string, { label: string; count: number; subtotal: number }>();

        const getCategoryLabel = (cat: string) => {
            switch (cat) {
                case 'CURTAIN': return '窗帘';
                case 'WALLCLOTH': return '墙布';
                case 'WALLPAPER': return '墙纸';
                case 'WALL_PANEL': return '墙員';
                case 'STANDARD': return '标品';
                default: return '其他';
            }
        };

        allItems.forEach(item => {
            const cat = item.category || 'OTHER';
            const existing = categoryMap.get(cat);
            if (existing) {
                existing.count += 1;
                existing.subtotal += Number(item.subtotal || 0);
            } else {
                categoryMap.set(cat, {
                    label: getCategoryLabel(cat),
                    count: 1,
                    subtotal: Number(item.subtotal || 0)
                });
            }
        });

        return Array.from(categoryMap.entries()).map(([category, data]) => ({
            category,
            label: data.label,
            itemCount: data.count,
            subtotal: data.subtotal
        }));
    }, [quote.items, quote.rooms]);

    // Mode toggle logic removed - mode is now derived from config on line 72

    const handleSave = () => toast.success("Saved");

    return (
        <div className="space-y-6 p-8">
            {/* Simple Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/quotes')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight">报价单详情: {quote.quoteNo}</h2>
                            <QuoteVersionDrawer
                                currentQuoteId={quote.id}
                                currentVersion={quote.version || 1}
                                versions={versions.map(v => ({
                                    ...v,
                                    status: v.status || 'DRAFT',
                                    createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
                                    totalAmount: (v as { totalAmount?: number | string }).totalAmount,
                                    finalAmount: (v as { finalAmount?: number | string }).finalAmount
                                }))}
                                onCopy={async () => {
                                    toast.promise(
                                        (async () => {
                                            const res = await copyQuote({ quoteId: quote.id });
                                            if (res?.data?.id) {
                                                router.push(`/quotes/${res.data.id}`);
                                            }
                                        })(),
                                        {
                                            loading: '正在复制报价单...',
                                            success: '复制成功！',
                                            error: '复制失败'
                                        }
                                    );
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-muted-foreground text-sm">{quote.customer?.name}</span>
                            <Badge variant={
                                quote.status === 'ACCEPTED' ? 'success' :
                                    quote.status === 'REJECTED' ? 'destructive' : // 'error' -> 'destructive' usually in shadcn
                                        quote.status === 'PENDING_APPROVAL' ? 'warning' : 'secondary'
                            }>
                                {quote.status === 'DRAFT' && '草稿'}
                                {quote.status === 'PENDING_APPROVAL' && '待审批'}
                                {quote.status === 'PENDING_CUSTOMER' && '待客户确认'}
                                {quote.status === 'ACCEPTED' && '已接受'}
                                {quote.status === 'REJECTED' && '已拒绝'}
                                {quote.status === 'EXPIRED' && '已过期'}
                            </Badge>
                        </div>
                        {quote.approvalRequired && quote.status === 'PENDING_APPROVAL' && (
                            <div className="text-xs text-amber-600 flex items-center mt-1">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                风险控制: 需要审批 (毛利过低或折扣过高)
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-x-2">
                    <div className="flex gap-2">
                        {versions.length > 1 && (
                            <QuoteVersionCompare
                                currentQuote={{
                                    ...quote,
                                    totalAmount: Number(quote.totalAmount || 0)
                                } as any}
                                versions={versions.map(v => ({
                                    ...v,
                                    totalAmount: (v as any).totalAmount ? Number((v as any).totalAmount) : 0,
                                    status: v.status || 'DRAFT',
                                    createdAt: v.createdAt ? new Date(v.createdAt) : new Date()
                                }))}
                            />
                        )}
                        {quote.status === 'DRAFT' && (
                            <>
                                <LiquidButton variant="ghost" size="sm" onClick={() => setImportDialogOpen(true)}>
                                    <Ruler className="h-4 w-4" /> 导入测量
                                </LiquidButton>

                                <LiquidButton variant="ghost" size="sm" onClick={() => setTemplateDialogOpen(true)}>
                                    <Layout className="h-4 w-4" /> 保存为模板
                                </LiquidButton>

                                <LiquidButton variant="secondary" size="sm" onClick={async () => {
                                    toast.promise(submitQuote({ id: quote.id }), {
                                        loading: '提交中...',
                                        success: '报价单已提交',
                                        error: (err) => `提交失败: ${err.message}`
                                    });
                                }}>
                                    提交审核
                                </LiquidButton>
                            </>
                        )}

                        {/* ... other buttons ... */}

                        <QuoteExportMenu
                            quote={{
                                id: quote.id,
                                quoteNo: quote.quoteNo,
                                title: quote.title,
                                customer: quote.customer,
                                items: quote.items?.map(item => ({
                                    productName: item.productName || '未命名商品',
                                    width: item.width,
                                    height: item.height,
                                    quantity: item.quantity,
                                    unitPrice: item.unitPrice,
                                    subtotal: item.subtotal,
                                    roomId: item.roomId || '',
                                })),
                                rooms: quote.rooms?.map(r => ({ id: r.id, name: r.name })),
                                totalAmount: quote.totalAmount,
                                discountAmount: quote.discountAmount,
                                finalAmount: quote.finalAmount,
                                notes: quote.notes,
                            }}
                            renderPdfButtons={
                                <>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <QuotePdfDownloader
                                            quote={quote}
                                            mode="customer"
                                            className="w-full justify-start text-sm font-normal px-2 py-1.5 h-auto border-0 focus:bg-accent focus:text-accent-foreground"
                                        >
                                            <div className="flex items-center w-full">
                                                <Download className="mr-2 h-4 w-4" />
                                                <span>客户版 PDF</span>
                                            </div>
                                        </QuotePdfDownloader>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <QuotePdfDownloader
                                            quote={quote}
                                            mode="internal"
                                            className="w-full justify-start text-sm font-normal px-2 py-1.5 h-auto border-0 focus:bg-accent focus:text-accent-foreground"
                                        >
                                            <div className="flex items-center w-full">
                                                <Download className="mr-2 h-4 w-4" />
                                                <span>内部版 PDF</span>
                                            </div>
                                        </QuotePdfDownloader>
                                    </DropdownMenuItem>
                                </>
                            }
                        />

                        {quote.status === 'PENDING_APPROVAL' && (
                            <>
                                <LiquidButton variant="ghost" size="sm" onClick={async () => {
                                    const reason = prompt("请输入驳回原因:");
                                    if (!reason) return;
                                    toast.promise(rejectQuote({ id: quote.id, rejectReason: reason }), {
                                        loading: '驳回中...',
                                        success: '报价单已驳回',
                                        error: '操作失败'
                                    });
                                }}>
                                    驳回
                                </LiquidButton>
                                <LiquidButton variant="secondary" size="sm" onClick={async () => {
                                    if (!confirm('确认批准此报价单?')) return;
                                    toast.promise(approveQuote({ id: quote.id }), {
                                        loading: '审批中...',
                                        success: '报价单已批准',
                                        error: '操作失败'
                                    });
                                }}>
                                    批准
                                </LiquidButton>
                            </>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            <QuoteToOrderButton
                                quoteId={quote.id}
                                defaultAmount={quote.finalAmount || undefined}
                            />
                        </div>



                        <LiquidButton variant="ghost" size="sm" onClick={handleSave}>
                            <Save className="h-4 w-4" /> 保存
                        </LiquidButton>
                        {/* Mode Toggle Button Removed */}
                    </div>
                </div >
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
                    <QuoteSummaryTab
                        items={[
                            ...(quote.items || []),
                            ...(quote.rooms || []).flatMap((r) => r.items || [])
                        ].map(item => ({
                            id: item.id,
                            category: item.category,
                            roomId: item.roomId,
                            parentId: item.parentId,
                            subtotal: item.subtotal,
                        }))}
                        rooms={(quote.rooms || []).map(r => ({ id: r.id, name: r.name }))}
                    />
                ) : viewMode === 'category' ? (
                    // 品类优先视图：当前品类下的所有空间
                    <QuoteItemsTable
                        quoteId={quote.id}
                        rooms={quote.rooms || []}
                        items={[
                            ...(quote.items || []),
                            ...(quote.rooms || []).flatMap((r) => r.items || [])
                        ].filter(item => {
                            // 按品类筛选商品（activeCategory 在此分支已排除 SUMMARY）
                            const cat = activeCategory as Exclude<QuoteCategory, 'SUMMARY'>;
                            const allowedCategories = CATEGORY_TO_PRODUCT_CATEGORIES[cat];
                            return allowedCategories.includes(item.category);
                        }).map(item => ({
                            ...item,
                            productId: item.productId || '',
                            width: item.width || 0,
                            height: item.height || 0,
                            foldRatio: item.foldRatio ?? undefined,
                            processFee: item.processFee ?? undefined,
                            remark: item.remark ?? undefined,
                            roomId: item.roomId || null,
                            parentId: item.parentId || null,
                            attributes: (item.attributes as NonNullable<QuoteItem['attributes']>) ?? undefined
                        }))}
                        mode={mode}
                        visibleFields={config?.visibleFields}
                        readOnly={isReadOnly}
                        dimensionLimits={config?.dimensionLimits}
                        allowedCategories={CATEGORY_TO_PRODUCT_CATEGORIES[activeCategory as Exclude<QuoteCategory, 'SUMMARY'>]}
                        onAddRoom={(name) => {
                            toast.promise(createRoom({ quoteId: quote.id, name }), {
                                loading: '创建空间中...',
                                success: () => { router.refresh(); return '空间创建成功'; },
                                error: '创建失败'
                            });
                        }}
                    />
                ) : (
                    // 空间优先视图：按空间组织，每个空间内包含不同品类
                    <QuoteItemsTable
                        quoteId={quote.id}
                        rooms={quote.rooms || []}
                        items={[
                            ...(quote.items || []),
                            ...(quote.rooms || []).flatMap((r) => r.items || [])
                        ].map(item => ({
                            ...item,
                            productId: item.productId || '',
                            width: item.width || 0,
                            height: item.height || 0,
                            foldRatio: item.foldRatio ?? undefined,
                            processFee: item.processFee ?? undefined,
                            remark: item.remark ?? undefined,
                            roomId: item.roomId || null,
                            parentId: item.parentId || null,
                            attributes: (item.attributes as NonNullable<QuoteItem['attributes']>) ?? undefined
                        }))}
                        mode={mode}
                        visibleFields={config?.visibleFields}
                        readOnly={isReadOnly}
                        dimensionLimits={config?.dimensionLimits}
                        onAddRoom={(name) => {
                            toast.promise(createRoom({ quoteId: quote.id, name }), {
                                loading: '创建空间中...',
                                success: () => { router.refresh(); return '空间创建成功'; },
                                error: '创建失败'
                            });
                        }}
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
                        <Button onClick={handleCreateRoom}>
                            确定
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 保存为模板对话框 */}
            <SaveAsTemplateDialog
                quoteId={quote.id}
                open={templateDialogOpen}
                onOpenChange={setTemplateDialogOpen}
                onSuccess={() => router.refresh()}
            />
        </div >
    );
}
