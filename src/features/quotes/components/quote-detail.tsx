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
import { updateQuote, submitQuote, approveQuote, rejectQuote, convertQuoteToOrder } from '@/features/quotes/actions/mutations';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { toast } from 'sonner';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Save from 'lucide-react/dist/esm/icons/save';
import Plus from 'lucide-react/dist/esm/icons/plus';

import { QuoteConfig } from '@/services/quote-config.service';
import { toggleQuoteMode } from '@/features/quotes/actions/config-actions';
import { QuoteConfigDialog } from './quote-config-dialog';
import { getQuoteAuditLogs } from '@/features/quotes/actions/queries';
import { format } from 'date-fns';

interface QuoteDetailProps {
    quote: any;
    versions?: any[];
    initialConfig?: QuoteConfig;
}

export function QuoteDetail({ quote, versions = [], initialConfig }: QuoteDetailProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('space');
    const [config, setConfig] = useState<QuoteConfig | undefined>(initialConfig);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const mode = config?.mode || 'simple';

    // Update config when initialConfig changes, but avoid direct setState in render or effect if possible
    // Here we use useEffect for data fetching and state syncing
    useEffect(() => {
        if (initialConfig) setConfig(initialConfig);

        const loadLogs = async () => {
            try {
                const logs = await getQuoteAuditLogs(quote.id);
                setAuditLogs(logs);
            } catch (err) {
                console.error("Failed to load logs", err);
            }
        };
        loadLogs();
    }, [initialConfig, quote.id]);

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
                                quoteNo={quote.quoteNo}
                                version={quote.version || 1}
                                parentQuoteId={quote.parentQuoteId}
                                versions={versions}
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-muted-foreground text-sm">{quote.customer?.name}</span>
                            <Badge variant={
                                quote.status === 'APPROVED' ? 'success' :
                                    quote.status === 'ORDERED' ? 'default' :
                                        quote.status === 'REJECTED' ? 'error' :
                                            quote.status === 'PENDING_APPROVAL' ? 'warning' : 'secondary'
                            }>
                                {quote.status === 'DRAFT' && '草稿'}
                                {quote.status === 'SUBMITTED' && '已提交'}
                                {quote.status === 'PENDING_APPROVAL' && '待审批'}
                                {quote.status === 'APPROVED' && '已批准'}
                                {quote.status === 'REJECTED' && '已驳回'}
                                {quote.status === 'ORDERED' && '已下单'}
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
                        {quote.status === 'DRAFT' && (
                            <Button onClick={async () => {
                                toast.promise(submitQuote({ id: quote.id }), {
                                    loading: '提交中...',
                                    success: '报价单已提交',
                                    error: (err) => `提交失败: ${err.message}`
                                });
                            }}>
                                提交审核
                            </Button>
                        )}

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

                        {(quote.status === 'APPROVED' || quote.status === 'ACCEPTED') && (
                            <Button className="bg-blue-600 hover:bg-blue-700" onClick={async () => {
                                if (!confirm('确认将此报价单转换为订单?')) return;
                                toast.promise(convertQuoteToOrder({ quoteId: quote.id }), {
                                    loading: '转换中...',
                                    success: '订单创建成功',
                                    error: '转换失败'
                                });
                            }}>
                                转订单
                            </Button>
                        )}

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
                                    defaultValue={quote.title}
                                    onBlur={(e) => updateQuote({ id: quote.id, title: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-medium">备注</label>
                                <Input
                                    defaultValue={quote.notes}
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
                            <Button size="sm" variant="outline" onClick={handleAddRoom}>
                                <Plus className="mr-2 h-4 w-4" /> 添加空间
                            </Button>
                        </div>

                        <TabsContent value="space">
                            <QuoteItemsTable
                                quoteId={quote.id}
                                rooms={quote.rooms || []}
                                items={quote.items || []} // These are items WITHOUT room
                                mode={mode}
                                visibleFields={config?.visibleFields}
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
