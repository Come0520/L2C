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
import { Button } from '@/shared/ui/button';
import Eye from 'lucide-react/dist/esm/icons/eye';
import ClipboardEdit from 'lucide-react/dist/esm/icons/clipboard-edit';
import Truck from 'lucide-react/dist/esm/icons/truck';

import Link from 'next/link';
import { format } from 'date-fns';
import { OrderStatusBadge } from './order-status-badge';
import { EmptyTableRow } from '@/shared/ui/empty-table-row';

export interface Order {
    id: string;
    orderNo: string;
    customerName: string | null;
    totalAmount: string | null;
    paidAmount: string | null;
    status: string | null;
    sales: { name: string | null } | null;
    createdAt: Date | string | null;
}

interface OrderTableProps {
    data: Order[];
}

interface OrderTableRowProps {
    order: Order;
}

const OrderTableRow = React.memo(function OrderTableRow({ order }: OrderTableRowProps) {
    return (
        <TableRow key={order.id} className="glass-row-hover">
            <TableCell className="font-mono font-medium">
                <Link href={`/orders/${order.id}`} className="text-blue-600 hover:underline">
                    {order.orderNo}
                </Link>
            </TableCell>
            <TableCell>{order.customerName || '-'}</TableCell>
            <TableCell className="text-right font-medium">
                ¥{Number(order.totalAmount).toLocaleString()}
            </TableCell>
            <TableCell className="text-right text-green-600">
                ¥{Number(order.paidAmount).toLocaleString()}
            </TableCell>
            <TableCell className="text-center">
                <OrderStatusBadge status={order.status || 'DRAFT'} />
            </TableCell>
            <TableCell>{order.sales?.name || '-'}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
                {order.createdAt ? format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm') : '-'}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild title="查看详情">
                        <Link href={`/orders/${order.id}`}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                    {order.status === 'PENDING_PO' && (
                        <Button variant="ghost" size="icon" title="拆单">
                            <ClipboardEdit className="h-4 w-4 text-orange-600" />
                        </Button>
                    )}
                    {order.status === 'PENDING_DELIVERY' && (
                        <Button variant="ghost" size="icon" title="申请发货">
                            <Truck className="h-4 w-4 text-blue-600" />
                        </Button>
                    )}
                    {/* SHIPPED 状态已废弃，发货后直接进入 PENDING_INSTALL */}
                </div>
            </TableCell>
        </TableRow>
    );
});

export const OrderTable = React.memo(function OrderTable({ data }: OrderTableProps) {
    return (
        <div className="glass-table overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="glass-table-header">
                        <TableHead className="w-[180px]">订单号</TableHead>
                        <TableHead>客户姓名</TableHead>
                        <TableHead className="text-right">订单金额</TableHead>
                        <TableHead className="text-right">已收金额</TableHead>
                        <TableHead className="text-center">状态</TableHead>
                        <TableHead>归属销售</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <EmptyTableRow colSpan={8} message="暂无订单。" />
                    ) : (
                        data.map((order) => (
                            <OrderTableRow key={order.id} order={order} />
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
});

