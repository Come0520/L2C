'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAfterSalesTickets } from '../actions';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { afterSalesStatusEnum } from '@/shared/api/schema/enums';
import { format } from 'date-fns';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useDebounce } from '@/shared/hooks/use-debounce'; // Assuming this exists, if not need to check or implement simple one
import { Ticket } from '../types';

export function AfterSalesList() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('all');
    const [page, setPage] = useState(1);

    const debouncedSearch = useDebounce(search, 500);

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
        <div className="space-y-4 p-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">售后工单列表</h1>
                <Link href="/after-sales/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> 新建工单
                    </Button>
                </Link>
            </div>

            <div className="flex gap-4">
                <Input
                    placeholder="搜索工单号..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="状态筛选" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        {afterSalesStatusEnum.enumValues.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-md">
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
                            tickets.map((ticket: any) => ( // Using any temporarily for join result typing if needed, or define proper type
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

            {/* Pagination Controls could go here */}
        </div>
    );
}
