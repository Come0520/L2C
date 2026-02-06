'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getAfterSalesTickets } from '../actions';
import { Button } from '@/shared/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { format } from 'date-fns';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { UrlSyncedTabs } from '@/components/ui/url-synced-tabs';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';

const TABS = [
    { value: 'all', label: '全部工单' },
    { value: 'PENDING', label: '待处理' },
    { value: 'PROCESSING', label: '处理中' }, // Simplification: Map logic needed if we want to include multiple statuses here
    { value: 'CLOSED', label: '已关闭' },
];

export function AfterSalesList() {
    const searchParams = useSearchParams();
    const status = searchParams.get('status') || 'all';

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const debouncedSearch = useDebounce(search, 500);

    // Map tab value to actual API status param
    // If 'PROCESSING', we might want to fetch multiple? 
    // For now, let's assume the API handles specific status, or we stick to exact enum matching for simplicity.
    // If user selected 'PROCESSING' tab, strictly filter by 'PROCESSING' enum for now, 
    // unless backend supports arrays.
    // Let's rely on client-side or simple mapping for now.
    // If tab is 'PROCESSING', we might be missing 'INVESTIGATING' etc. 
    // Let's try to map tab -> specific statuses if the API supports it, or just pass the tab value 
    // and let the user understand it's exact match.
    // Given the prompt "green here repeat", I will focus on the UI layout first.

    const { data, isLoading } = useQuery({
        queryKey: ['after-sales-tickets', page, status, debouncedSearch],
        queryFn: () => getAfterSalesTickets({
            page,
            status: status === 'all' ? undefined : status,
            search: debouncedSearch
        }),
    });

    const tickets = data?.data || [];

    return (
        <div className="space-y-4">
            <UrlSyncedTabs
                tabs={TABS}
                paramName="status"
                defaultValue="all"
                containerClassName="w-full mb-4"
                layoutId="after-sales-tabs"
            />

            <div className="glass-liquid-ultra p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
                <DataTableToolbar
                    searchProps={{
                        value: search,
                        onChange: setSearch,
                        placeholder: "搜索工单号/客户..."
                    }}
                    actions={
                        <Link href="/after-sales/new">
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" /> 新建工单
                            </Button>
                        </Link>
                    }
                    className="border-none shadow-none p-0 bg-transparent"
                />

                <div className="rounded-md border bg-white/50 backdrop-blur-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>工单号</TableHead>
                                <TableHead>关联客户</TableHead>
                                <TableHead>类型</TableHead>
                                <TableHead>优先级</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead>创建时间</TableHead>
                                <TableHead>操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        加载中...
                                    </TableCell>
                                </TableRow>
                            ) : tickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        暂无数据
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tickets.map((ticket: any) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/after-sales/${ticket.id}`} className="hover:underline text-blue-600">
                                                {ticket.ticketNo}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {ticket.customer?.name}
                                            {ticket.customer?.phone && <span className="text-xs text-muted-foreground block">{ticket.customer.phone}</span>}
                                        </TableCell>
                                        <TableCell>{ticket.type}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs ${ticket.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                                ticket.priority === 'LOW' ? 'bg-green-100 text-green-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {ticket.priority}
                                            </span>
                                        </TableCell>
                                        <TableCell>{ticket.status}</TableCell>
                                        <TableCell>{format(new Date(ticket.createdAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                                        <TableCell>
                                            <Link href={`/after-sales/${ticket.id}`}>
                                                <Button variant="ghost" size="sm">查看</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
