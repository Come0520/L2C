'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';


import { QuoteItemsTable } from './quote-items-table';

import { QuoteVersionHistory } from './quote-version-history';
import { QuoteToOrderButton } from './quote-to-order-button';
import { updateQuote, submitQuote, approveQuote, rejectQuote } from '@/features/quotes/actions/mutations';
import { Badge } from '@/shared/ui/badge';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { toast } from 'sonner';
import { Ruler, FileText, Save } from 'lucide-react';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { QuoteVersionCompare } from './quote-version-compare';

import { QuoteConfig } from '@/services/quote-config.service';
import { toggleQuoteMode } from '@/features/quotes/actions/config-actions';
import { QuoteConfigDialog } from './quote-config-dialog';
import { getQuote, getQuoteVersions } from '@/features/quotes/actions/queries';


import { MeasureDataImportDialog } from './measure-data-import-dialog';
import { QuoteBottomSummaryBar } from './quote-bottom-summary-bar';
import { CustomerInfoDrawer } from './customer-info-drawer';
import { QuoteCategoryTabs, QuoteCategory, ViewMode } from './quote-category-tabs';
import { QuoteExportMenu } from './quote-export-menu';
import { Download } from 'lucide-react';
import { DropdownMenuItem } from '@/shared/ui/dropdown-menu';
import dynamic from 'next/dynamic';
import { QuotePdfDocument } from './quote-pdf';

import { QuoteExcelImportDialog } from './quote-excel-import-dialog';
import { QuoteExpirationBanner } from './quote-expiration-banner';

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false, loading: () => <span className="text-xs">Loading PDF...</span> }
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
    const [config, setConfig] = useState<QuoteConfig | undefined>(initialConfig);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [excelImportOpen, setExcelImportOpen] = useState(false);
    // 品类和视图模式状态
    const [activeCategory, setActiveCategory] = useState<QuoteCategory>('CURTAIN');
    const [viewMode, setViewMode] = useState<ViewMode>('category');
    const mode = config?.mode || 'simple';
    const isReadOnly = !quote.isActive;

    const handleToggleMode = async () => {
        const newMode = mode === 'simple' ? 'advanced' : 'simple';

        // Optimistic Update
        if (config) {
            setConfig({ ...config, mode: newMode });
        }

        toast.promise(
            (async () => {
                await toggleQuoteMode({ mode: newMode });
                router.refresh();
            })(),
            {
                loading: 'Switching mode...',
                success: 'Mode updated',
                error: 'Failed to update mode'
            }
        );
    };

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
                            <QuoteVersionHistory
                                currentQuoteId={quote.id}
                                version={quote.version || 1}
                                versions={versions.map(v => ({
                                    ...v,
                                    status: v.status || 'DRAFT',
                                    createdAt: v.createdAt || new Date()
                                }))}
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
                                {quote.status === 'SUBMITTED' && '已提交'}
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
                                    createdAt: v.createdAt || new Date()
                                }))}
                            />
                        )}
                        {quote.status === 'DRAFT' && (
                            <>
                                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                                    <Ruler className="mr-2 h-4 w-4" /> 导入测量
                                </Button>
                                <Button variant="outline" onClick={() => setExcelImportOpen(true)}>
                                    <FileText className="mr-2 h-4 w-4" /> 批量导入
                                </Button>
                                <Button onClick={async () => {
                                    toast.promise(submitQuote({ id: quote.id }), {
                                        loading: '提交中...',
                                        success: '报价单已提交',
                                        error: (err) => `提交失败: ${err.message}`
                                    });
                                }}>
                                    提交审核
                                </Button>
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
                                    productName: item.productName,
                                    width: item.width,
                                    height: item.height,
                                    quantity: item.quantity,
                                    unitPrice: item.unitPrice,
                                    subtotal: item.subtotal,
                                    roomId: item.roomId,
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
                                        <PDFDownloadLink
                                            document={<QuotePdfDocument quote={quote} mode="customer" />}
                                            fileName={`报价单_${quote.quoteNo}_客户版.pdf`}
                                            className="flex items-center w-full"
                                        >
                                            <Download className="mr-2 h-4 w-4" /> 客户版 PDF
                                        </PDFDownloadLink>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <PDFDownloadLink
                                            document={<QuotePdfDocument quote={quote} mode="internal" />}
                                            fileName={`报价单_${quote.quoteNo}_内部版.pdf`}
                                            className="flex items-center w-full"
                                        >
                                            <Download className="mr-2 h-4 w-4" /> 内部版 PDF
                                        </PDFDownloadLink>
                                    </DropdownMenuItem>
                                </>
                            }
                        />

                        {quote.status === 'PENDING_APPROVAL' && (
                            <>
                                <Button variant="destructive" onClick={async () => {
                                    const reason = prompt("请输入驳回原因:");
                                    if (!reason) return;
                                    toast.promise(rejectQuote({ id: quote.id, rejectReason: reason }), {
                                        loading: '驳回中...',
                                        success: '报价单已驳回',
                                        error: '操作失败'
                                    });
                                }}>
                                    驳回
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700" onClick={async () => {
                                    if (!confirm('确认批准此报价单?')) return;
                                    toast.promise(approveQuote({ id: quote.id }), {
                                        loading: '审批中...',
                                        success: '报价单已批准',
                                        error: '操作失败'
                                    });
                                }}>
                                    批准
                                </Button>
                            </>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            <QuoteToOrderButton
                                quoteId={quote.id}
                                defaultAmount={quote.finalAmount || undefined}
                            />
                        </div>

                        <QuoteConfigDialog currentConfig={config} />

                        <Button variant="ghost" size="icon" onClick={handleSave} title="保存">
                            <Save className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleToggleMode}
                        >
                            {mode === 'simple' ? '高级模式' : '极简模式'}
                        </Button>
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
                    address: quote.customer?.address || undefined,
                }}
                className="mb-6"
            />

            {/* 报价标题和备注 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="text-sm font-medium block mb-1">报价标题</label>
                    <Input
                        defaultValue={quote.title || ''}
                        placeholder="输入报价标题"
                        onBlur={(e) => updateQuote({ id: quote.id, title: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium block mb-1">备注</label>
                    <Input
                        defaultValue={quote.notes || ''}
                        placeholder="输入备注信息"
                        onBlur={(e) => updateQuote({ id: quote.id, notes: e.target.value })}
                    />
                </div>
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
                {viewMode === 'category' ? (
                    // 品类优先视图：当前品类下的所有空间
                    <QuoteItemsTable
                        quoteId={quote.id}
                        rooms={quote.rooms || []}
                        items={[
                            ...(quote.items || []),
                            ...(quote.rooms || []).flatMap((r) => r.items || [])
                        ].filter(item => {
                            // 按品类筛选商品（暂时显示全部，后续根据 item.category 过滤）
                            return true;
                        })}
                        mode={mode}
                        visibleFields={config?.visibleFields}
                        readOnly={isReadOnly}
                        dimensionLimits={config?.dimensionLimits}
                    />
                ) : (
                    // 空间优先视图：按空间组织，每个空间内包含不同品类
                    <QuoteItemsTable
                        quoteId={quote.id}
                        rooms={quote.rooms || []}
                        items={[
                            ...(quote.items || []),
                            ...(quote.rooms || []).flatMap((r) => r.items || [])
                        ]}
                        mode={mode}
                        visibleFields={config?.visibleFields}
                        readOnly={isReadOnly}
                        dimensionLimits={config?.dimensionLimits}
                    />
                )}
            </div>

            {/* 底部吸底汇总栏 */}
            <QuoteBottomSummaryBar
                totalAmount={quote.totalAmount || 0}
                discountAmount={quote.discountAmount || 0}
                finalAmount={quote.finalAmount || 0}
            />
        </div >
    );
}
