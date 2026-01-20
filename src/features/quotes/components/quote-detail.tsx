'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { QuoteItemsTable } from './quote-items-table';
import { QuoteSummary } from './quote-summary';
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
import { getQuoteAuditLogs, getQuote, getQuoteVersions } from '@/features/quotes/actions/queries';
import { format } from 'date-fns';

import { MeasureDataImportDialog } from './measure-data-import-dialog'; // Import
import { Download } from 'lucide-react'; // Import Ruler icon
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
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
type QuoteLog = Awaited<ReturnType<typeof getQuoteAuditLogs>>[number];

interface QuoteDetailProps {
    quote: QuoteData;
    versions?: QuoteVersion[];
    initialConfig?: QuoteConfig;
}

export function QuoteDetail({ quote, versions = [], initialConfig }: QuoteDetailProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('space');
    const [config, setConfig] = useState<QuoteConfig | undefined>(initialConfig);
    const [auditLogs, setAuditLogs] = useState<QuoteLog[]>([]);
    const [importDialogOpen, setImportDialogOpen] = useState(false); // Measure Import
    const [excelImportOpen, setExcelImportOpen] = useState(false); // Excel Import
    const mode = config?.mode || 'simple';
    const isReadOnly = !quote.isActive; // STRICT: Only active quote is editable

    // Update config when initialConfig changes, but avoid direct setState in render or effect if possible
    // Here we use useEffect for data fetching and state syncing
    useEffect(() => {
        const loadLogs = async () => {
            try {
                const logs = await getQuoteAuditLogs(quote.id);
                setAuditLogs(logs);
            } catch (err) {
                console.error("Failed to load logs", err);
            }
        };
        loadLogs();
    }, [quote.id]);

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

    // handlers...
    const handleAddRoom = () => { }; // Mock for now if missing
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

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <FileText className="mr-2 h-4 w-4" /> 导出 PDF
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <PDFDownloadLink
                                        document={<QuotePdfDocument quote={quote} mode="customer" />}
                                        fileName={`报价单_${quote.quoteNo}_客户版.pdf`}
                                        className="flex items-center w-full"
                                    >
                                        <Download className="mr-2 h-4 w-4" /> 客户版 (无成本)
                                    </PDFDownloadLink>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <PDFDownloadLink
                                        document={<QuotePdfDocument quote={quote} mode="internal" />}
                                        fileName={`报价单_${quote.quoteNo}_内部版.pdf`}
                                        className="flex items-center w-full"
                                    >
                                        <Download className="mr-2 h-4 w-4" /> 内部版 (含成本)
                                    </PDFDownloadLink>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Basic Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>基础信息</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">客户姓名</label>
                                <Input defaultValue={quote.customer?.name} disabled />
                            </div>
                            <div>
                                <label className="text-sm font-medium">客户电话</label>
                                <Input defaultValue={quote.customer?.phone} disabled />
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-medium">报价标题</label>
                                <Input
                                    defaultValue={quote.title || ''}
                                    onBlur={(e) => updateQuote({ id: quote.id, title: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-medium">备注</label>
                                <Input
                                    defaultValue={quote.notes || ''}
                                    onBlur={(e) => updateQuote({ id: quote.id, notes: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* View Switcher & Items */}
                    <Tabs defaultValue="space" value={activeTab} onValueChange={setActiveTab}>
                        <div className="flex items-center justify-between mb-2">
                            <TabsList>
                                <TabsTrigger value="space">空间视图</TabsTrigger>
                                <TabsTrigger value="category">品类视图</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="space">
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
                        </TabsContent>
                        <TabsContent value="versions" className="mt-4">
                            <QuoteVersionHistory
                                currentQuoteId={quote.id} // Fixed prop name from currentVersion to currentQuoteId? Check definition. 
                                version={quote.version}
                                versions={versions.map(v => ({
                                    id: v.id,
                                    version: v.version,
                                    status: v.status || 'DRAFT',
                                    createdAt: v.createdAt || new Date()
                                }))}
                            />
                        </TabsContent>
                        <TabsContent value="category">
                            <div className="p-8 text-center text-muted-foreground border rounded-md">
                                品类视图开发中...
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-6">
                    <QuoteSummary quote={quote} />

                    {/* Operation Log Placeholder */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">操作日志</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {auditLogs.length > 0 ? (
                                    auditLogs.map((log) => (
                                        <div key={log.id} className="text-sm border-l-2 border-primary/20 pl-3 py-1">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>{log.userName || 'System'}</span>
                                                <span>{format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                                            </div>
                                            <div className="mt-1 font-medium">{log.action === 'CREATE' ? '创建了报价单' : log.action === 'UPDATE' ? '修改了报价单' : log.action}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground text-center py-4">暂无操作日志</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
