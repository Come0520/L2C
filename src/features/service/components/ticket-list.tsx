'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/shared/ui/dialog';
import { Textarea } from '@/shared/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/shared/ui/select';
import { updateTicketStatus } from '@/features/service/actions/ticket-actions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar'; // Correct path for shared component
import { UrlSyncedTabs } from '@/components/ui/url-synced-tabs';
import { Edit2 } from 'lucide-react';

/** 工单数据（服务端查询返回） */
interface TicketData {
    id: string;
    ticketNo: string;
    type: string;
    description: string | null;
    status: string;
    result?: string | null;
    resolution?: string | null;
    customer?: { name?: string | null; phone?: string | null } | null;
    order?: { orderNo?: string | null } | null;
    createdAt: string | Date | null;
    [key: string]: unknown;
}

const STATUS_MAP: Record<string, string> = {
    'PENDING': '待处理',
    'PROCESSING': '处理中',
    'PENDING_VERIFY': '已解决',
    'CLOSED': '已关闭'
};

const TYPE_MAP: Record<string, string> = {
    'INSTALLATION': '安装问题',
    'QUALITY': '质量问题',
    'logistics': '物流问题',
    'other': '其他问题'
};

const TABS = [
    { value: 'all', label: '全部工单' },
    { value: 'PENDING', label: '待处理' },
    { value: 'PROCESSING', label: '处理中' },
    { value: 'PENDING_VERIFY', label: '已解决' },
];

export function TicketList({
    tickets,
    total,
    currentPage,
    totalPages
}: {
    tickets: TicketData[],
    total: number,
    currentPage: number,
    totalPages: number
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // URL Params state
    const currentStatus = searchParams.get('status') || 'all';
    const currentSearch = searchParams.get('search') || '';

    // Local state
    // We synchronize local tickets with server tickets, but allow local updates for optimistic UI
    const [localTickets, setLocalTickets] = useState(tickets);

    useEffect(() => {
        setLocalTickets(tickets);
    }, [tickets]);

    const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
    const [status, setStatus] = useState('');
    const [result, setResult] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);


    const [searchQuery, setSearchQuery] = useState(currentSearch);

    // Sync search query from URL
    useEffect(() => {
        setSearchQuery(currentSearch);
    }, [currentSearch]);

    // Create query string helper
    const createQueryString = useCallback(
        (params: Record<string, string | null | undefined>) => {
            const newSearchParams = new URLSearchParams(searchParams.toString());
            Object.entries(params).forEach(([key, value]) => {
                if (value === null || value === undefined || value === 'all' || value === '') {
                    newSearchParams.delete(key);
                } else {
                    newSearchParams.set(key, value);
                }
            });
            // Reset to page 1 when filter changes (except when page itself changes)
            if (!params.page) {
                newSearchParams.set('page', '1');
            }
            return newSearchParams.toString();
        },
        [searchParams]
    );



    // Handle Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== currentSearch) {
                router.push(`${pathname}?${createQueryString({ search: searchQuery, page: '1' })}`);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, currentSearch, pathname, router, createQueryString]);

    const handleUpdate = async () => {
        if (!selectedTicket) return;
        setIsUpdating(true);
        const res = await updateTicketStatus(selectedTicket.id, status as 'PENDING' | 'PROCESSING' | 'PENDING_VERIFY' | 'CLOSED', result);
        setIsUpdating(false);
        if (res.success) {
            toast.success('更新成功');
            setSelectedTicket(null);
            // Optimistic update
            setLocalTickets(prev => prev.map((t: TicketData) =>
                t.id === selectedTicket.id ? { ...t, status, result } : t
            ));
        } else {
            toast.error('更新失败');
        }
    };

    return (
        <div className="space-y-4">
            {/* Tabs at top level */}
            <UrlSyncedTabs
                tabs={TABS}
                paramName="status"
                defaultValue="all"
                containerClassName="w-full mb-4"
                layoutId="service-tickets-tabs"
            />

            {/* Glass Container */}
            <div className="glass-liquid-ultra p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
                <DataTableToolbar
                    searchProps={{
                        value: searchQuery,
                        onChange: setSearchQuery,
                        placeholder: "搜索工单号/客户/问题..."
                    }}
                    className="border-none shadow-none p-0 bg-transparent"
                />

                <div className="rounded-md border bg-white/50 backdrop-blur-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>工单号</TableHead>
                                <TableHead>类型</TableHead>
                                <TableHead>客户</TableHead>
                                <TableHead>关联订单</TableHead>
                                <TableHead>问题描述</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead>创建时间</TableHead>
                                <TableHead>操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {localTickets.map((ticket: TicketData) => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-mono">{ticket.ticketNo}</TableCell>
                                    <TableCell>{TYPE_MAP[ticket.type] || ticket.type}</TableCell>
                                    <TableCell>
                                        <div>{ticket.customer?.name}</div>
                                        <div className="text-xs text-muted-foreground">{ticket.customer?.phone}</div>
                                    </TableCell>
                                    <TableCell>{ticket.order?.orderNo || '-'}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={ticket.description ?? undefined}>
                                        {ticket.description}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            ticket.status === 'PENDING' ? 'destructive' :
                                                ticket.status === 'PENDING_VERIFY' ? 'success' : 'secondary'
                                        }>
                                            {STATUS_MAP[ticket.status] || ticket.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {ticket.createdAt ? format(new Date(ticket.createdAt), 'yyyy-MM-dd HH:mm') : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {ticket.status !== 'CLOSED' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedTicket(ticket);
                                                        setStatus(ticket.status);
                                                        setResult(ticket.result || '');
                                                    }}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {localTickets.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        暂无工单
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`${pathname}?${createQueryString({ page: (currentPage - 1).toString() })}`)}
                            disabled={currentPage <= 1}
                        >
                            上一页
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            共 {total} 条，第 {currentPage} 页 / 共 {totalPages} 页
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`${pathname}?${createQueryString({ page: (currentPage + 1).toString() })}`)}
                            disabled={currentPage >= totalPages}
                        >
                            下一页
                        </Button>
                    </div>
                )}
            </div>

            <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>更新工单状态</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">状态</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">待处理</SelectItem>
                                    <SelectItem value="PROCESSING">处理中</SelectItem>
                                    <SelectItem value="PENDING_VERIFY">已解决(待核销)</SelectItem>
                                    <SelectItem value="CLOSED">已关闭</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">处理结果</label>
                            <Textarea
                                value={result}
                                onChange={(e) => setResult(e.target.value)}
                                placeholder="请输入处理结果..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedTicket(null)}>取消</Button>
                        <Button onClick={handleUpdate} disabled={isUpdating}>
                            {isUpdating ? '更新中...' : '确认更新'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
