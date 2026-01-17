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
import Warehouse from 'lucide-react/dist/esm/icons/warehouse';

import Link from 'next/link';
import { format } from 'date-fns';
import { OrderStatusBadge } from './order-status-badge';

export interface Order {
    id: string;
    orderNo: string;
    customerName: string | null;
    totalAmount: string;
    paidAmount: string;
    status: string;
    sales: { name: string } | null;
    createdAt: Date | string;
}

interface OrderTableProps {
    data: Order[];
}

export const OrderTable = React.memo(function OrderTable({ data }: OrderTableProps) {
    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
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
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                                暂无订单。
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((order) => (
                            <TableRow key={order.id} className="hover:bg-muted/30">
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
                                    <OrderStatusBadge status={order.status} />
                                </TableCell>
                                <TableCell>{order.sales?.name || '-'}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')}
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
                                        {order.status === 'SHIPPED' && (
                                            <Button variant="ghost" size="icon" title="确认到货">
                                                <Warehouse className="h-4 w-4 text-green-600" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
});

