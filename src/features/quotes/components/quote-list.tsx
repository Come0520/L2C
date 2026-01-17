'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/shared/ui/table';
import { getQuotes } from '@/features/quotes/actions/queries';
import { createQuote } from '@/features/quotes/actions/mutations';
import { toast } from 'sonner';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import { format } from 'date-fns';

export function QuoteList() {
    const router = useRouter();
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuotes();
    }, []);

    const loadQuotes = async () => {
        setLoading(true);
        try {
            const { data } = await getQuotes();
            setQuotes(data || []);
        } catch (error) {
            console.error(error);
            toast.error('加载失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            toast.info('请先选择客户 (功能待完善)', { description: '点击新建应弹出客户选择' });
        } catch (error) {
            // ...
        }
    };

    return (
        <div className="space-y-4 p-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">报价单</h2>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> 新建报价
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <Input placeholder="搜索报价单..." className="max-w-[300px]" />
                <Button size="icon" variant="ghost"><Search className="h-4 w-4" /></Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>报价单号</TableHead>
                            <TableHead>客户</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead className="text-right">总金额</TableHead>
                            <TableHead>创建人</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">加载中...</TableCell>
                            </TableRow>
                        ) : quotes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">暂无报价单</TableCell>
                            </TableRow>
                        ) : (
                            quotes.map((quote) => (
                                <TableRow key={quote.id} className="cursor-pointer" onClick={() => router.push(`/quotes/${quote.id}`)}>
                                    <TableCell className="font-medium">{quote.quoteNo}</TableCell>
                                    <TableCell>{quote.customer?.name || '-'}</TableCell>
                                    <TableCell>{quote.status}</TableCell>
                                    <TableCell className="text-right">¥{quote.finalAmount}</TableCell>
                                    <TableCell>{quote.creator?.name || '-'}</TableCell>
                                    <TableCell>{quote.createdAt ? format(new Date(quote.createdAt), 'yyyy-MM-dd HH:mm') : '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/quotes/${quote.id}`); }}>编辑</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
