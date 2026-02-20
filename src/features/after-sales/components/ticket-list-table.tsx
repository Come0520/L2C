'use client';

import React from 'react';
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
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { TicketListItem } from '../types';

interface TicketListTableProps {
    tickets: TicketListItem[];
    isLoading: boolean;
}

export function TicketListTable({ tickets, isLoading }: TicketListTableProps) {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'PENDING': return 'secondary';
            case 'PROCESSING': return 'default';
            case 'CLOSED': return 'outline';
            default: return 'secondary';
        }
    };

    return (
        <div className="rounded-xl border bg-white/50 backdrop-blur-sm overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="w-[140px]">工单号</TableHead>
                        <TableHead>关联客户</TableHead>
                        <TableHead>售后类型</TableHead>
                        <TableHead>优先级 / 状态</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground animate-pulse">
                                数据加载中...
                            </TableCell>
                        </TableRow>
                    ) : tickets.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                暂无售后工单记录
                            </TableCell>
                        </TableRow>
                    ) : (
                        tickets.map((ticket) => (
                            <TableRow key={ticket.id} className="hover:bg-muted/10 transition-colors">
                                <TableCell className="font-bold text-primary">
                                    <Link href={`/after-sales/${ticket.id}`} className="hover:underline">
                                        {ticket.ticketNo}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-slate-900">{ticket.customer?.name}</div>
                                    <div className="text-xs text-slate-500">{ticket.customer?.phone}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-normal">
                                        {ticket.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1.5">
                                        <span className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(ticket.priority || '')}`}>
                                            {ticket.priority}
                                        </span>
                                        <Badge variant={getStatusVariant(ticket.status) as any} className="w-fit text-[10px]">
                                            {ticket.status}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-500 text-sm">
                                    {format(new Date(ticket.createdAt), 'yyyy-MM-dd HH:mm')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/after-sales/${ticket.id}`}>
                                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                                            详情
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
