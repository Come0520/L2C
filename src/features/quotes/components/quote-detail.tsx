'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { QuoteItemsTable } from './quote-items-table';
import { QuoteSummary } from './quote-summary';
import { QuoteVersionHistory } from './quote-version-history';
import { createRoom, updateQuote } from '@/features/quotes/actions/mutations';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus } from 'lucide-react';

interface QuoteDetailProps {
    quote: any;
}

export function QuoteDetail({ quote }: QuoteDetailProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('space');
    const [mode, setMode] = useState<'simple' | 'advanced'>('simple');

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
                            />
                        </div>
                        <p className="text-muted-foreground text-sm">{quote.customer?.name} | {quote.status}</p>
                    </div>
                </div>
                <div className="space-x-2">
                    <Button
                        variant="ghost"
                        onClick={() => setMode(mode === 'simple' ? 'advanced' : 'simple')}
                    >
                        {mode === 'simple' ? '切换高级模式' : '切换快速模式'}
                    </Button>
                    <Button variant="outline" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> 保存
                    </Button>
                    <Button>转订单</Button>
                </div>
            </div >

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
                            <div className="text-sm text-muted-foreground">
                                2026-01-13 10:00 创建报价单<br />
                                2026-01-13 10:05 修改客户信息
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
