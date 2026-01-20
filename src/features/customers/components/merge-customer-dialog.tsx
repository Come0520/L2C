'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { toast } from 'sonner';
import { Search, AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';
import { mergeCustomersAction, previewMergeAction } from '../actions/mutations';
import { getCustomers } from '../actions/queries';
import { Input } from '@/shared/ui/input';
import { ScrollArea } from '@/shared/ui/scroll-area';

interface Customer {
    id: string;
    customerNo: string;
    name: string;
    phone: string;
    level: string | null;
}

interface MergeCustomerDialogProps {
    targetCustomer: Customer;
    userId: string;
    trigger?: React.ReactNode;
}

interface MergePreview {
    primary: Customer;
    secondary: Customer;
    conflicts: Record<string, { primary: unknown; secondary: unknown }>;
    affectedData: {
        orders: number;
        quotes: number;
        leads: number;
    };
}

export function MergeCustomerDialog({ targetCustomer, userId, trigger }: MergeCustomerDialogProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
    const [preview, setPreview] = useState<MergePreview | null>(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // 搜索客户
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length < 2) {
                setSearchResults([]);
                return;
            }

            setSearching(true);
            try {
                const res = await getCustomers({ search: searchTerm, page: 1, pageSize: 5 } as any);
                // 排除目标客户自己
                setSearchResults(res.data.filter((c: any) => c.id !== targetCustomer.id));
            } catch (err) {
                console.error('Search failed:', err);
                toast.error('搜索客户失败');
            } finally {
                setSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, targetCustomer.id]);

    // 预览合并
    useEffect(() => {
        if (!selectedSourceId) {
            setPreview(null);
            return;
        }

        const fetchPreview = async () => {
            try {
                const res = await previewMergeAction(selectedSourceId, targetCustomer.id);
                setPreview(res);
            } catch (err) {
                toast.error('获取预览失败');
            }
        };

        fetchPreview();
    }, [selectedSourceId, targetCustomer.id]);

    const handleMerge = async () => {
        if (!selectedSourceId) return;

        setLoading(true);
        try {
            await mergeCustomersAction({
                targetCustomerId: targetCustomer.id,
                sourceCustomerIds: [selectedSourceId],
                fieldPriority: 'PRIMARY',
            }, userId);
            toast.success('客户合并成功');
            setOpen(false);
        } catch (err: any) {
            toast.error(err.message || '合并失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">合并客户</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>合并客户档案</DialogTitle>
                    <DialogDescription>
                        将其他客户的订单、线索等数据迁移到主档案 <strong>{targetCustomer.name} ({targetCustomer.customerNo})</strong> 中。
                        注意：被合并的档案将被标记为已合并并停用。
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
                    {!selectedSourceId ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="输入姓名、电话或编号搜索要合并的客户..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <ScrollArea className="h-[300px] border rounded-md p-2">
                                {searching ? (
                                    <div className="text-center py-8 text-muted-foreground">搜索中...</div>
                                ) : searchResults.length > 0 ? (
                                    <div className="space-y-2">
                                        {searchResults.map((c) => (
                                            <div
                                                key={c.id}
                                                className="flex justify-between items-center p-3 border rounded hover:bg-muted/10 cursor-pointer transition-colors"
                                                onClick={() => setSelectedSourceId(c.id)}
                                            >
                                                <div>
                                                    <div className="font-medium">{c.name}</div>
                                                    <div className="text-xs text-muted-foreground">{c.phone} | {c.customerNo}</div>
                                                </div>
                                                <Button size="sm" variant="ghost">选择</Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {searchTerm.length < 2 ? '请输入搜索关键词' : '未找到匹配客户'}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="space-y-4 overflow-y-auto pr-2">
                            <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-lg">
                                <div className="text-center flex-1">
                                    <div className="text-xs text-destructive font-semibold mb-1">被合并档案 (将被删除)</div>
                                    <div className="font-bold text-foreground">{preview?.secondary?.name}</div>
                                    <div className="text-xs text-muted-foreground">{preview?.secondary?.customerNo}</div>
                                </div>
                                <ArrowRight className="h-6 w-6 text-muted-foreground mx-4" />
                                <div className="text-center flex-1">
                                    <div className="text-xs text-green-600 font-semibold mb-1">主档案 (保留)</div>
                                    <div className="font-bold text-foreground">{targetCustomer.name}</div>
                                    <div className="text-xs text-muted-foreground">{targetCustomer.customerNo}</div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-4 text-xs h-7"
                                    onClick={() => setSelectedSourceId(null)}
                                >
                                    重新选择
                                </Button>
                            </div>

                            {preview && (
                                <div className="space-y-4">
                                    <Alert>
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>即将迁移的数据统计</AlertTitle>
                                        <AlertDescription className="mt-2 grid grid-cols-3 gap-2">
                                            <div className="text-center p-2 rounded border glass-empty-state">
                                                <div className="text-lg font-bold">{preview.affectedData.orders}</div>
                                                <div className="text-xs text-muted-foreground">订单</div>
                                            </div>
                                            <div className="text-center p-2 rounded border glass-empty-state">
                                                <div className="text-lg font-bold">{preview.affectedData.quotes}</div>
                                                <div className="text-xs text-muted-foreground">报价</div>
                                            </div>
                                            <div className="text-center p-2 rounded border glass-empty-state">
                                                <div className="text-lg font-bold">{preview.affectedData.leads}</div>
                                                <div className="text-xs text-muted-foreground">线索</div>
                                            </div>
                                        </AlertDescription>
                                    </Alert>

                                    {Object.keys(preview.conflicts).length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold">字段冲突说明 (将保留主档案值)</h4>
                                            <div className="text-xs border rounded-md divide-y">
                                                {Object.entries(preview.conflicts).map(([field, vals]) => (
                                                    <div key={field} className="grid grid-cols-2 p-2 gap-4">
                                                        <div>
                                                            <span className="text-gray-400 mr-2">{field}:</span>
                                                            <span className="line-through text-red-400">{(vals as any).secondary || '空'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <ArrowRight className="h-3 w-3 text-gray-400" />
                                                            <span className="text-green-600 font-medium">{(vals as any).primary || '空'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>取消</Button>
                    <Button
                        disabled={!selectedSourceId || loading}
                        onClick={handleMerge}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {loading ? '处理中...' : (
                            <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                确认合并
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
