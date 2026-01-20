'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Plus, Eye } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { ReceiptBillDialog } from './receipt-bill-dialog';

interface ARStatementTableProps {
    data: any[];
}

export function ARStatementTable({ data }: ARStatementTableProps) {
    console.log('🖼️ ARStatementTable rendering, data length:', data?.length);
    const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
    const [selectedStatement, setSelectedStatement] = useState<any>(null);

    const handleCreateReceipt = (statement: any) => {
        setSelectedStatement(statement);
        setIsReceiptDialogOpen(true);
    };

    const getStatusVariant = (status: string): "success" | "info" | "warning" | "error" | "secondary" | "default" => {
        const variants: Record<string, any> = {
            PENDING_RECON: 'warning',
            RECONCILED: 'info',
            PARTIAL: 'warning',
            PAID: 'success',
            COMPLETED: 'success',
            BAD_DEBT: 'error',
        };
        return variants[status] || 'secondary';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING_RECON: '待对账',
            RECONCILED: '已对账',
            INVOICED: '已开票',
            PARTIAL: '部分收款',
            PAID: '已收完',
            PENDING_DELIVER: '等通知发货',
            COMPLETED: '已结案',
            BAD_DEBT: '呆坏账',
        };
        return labels[status] || status;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">应收对账单</h3>
                <Button size="sm" onClick={() => handleCreateReceipt(null)}>
                    <Plus className="w-4 h-4 mr-1" />
                    新建收款单
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>账单编号</TableHead>
                            <TableHead>关联订单</TableHead>
                            <TableHead>客户姓名</TableHead>
                            <TableHead>总额</TableHead>
                            <TableHead>已收</TableHead>
                            <TableHead>待收</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>创建日期</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                    暂无应收记录
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.statementNo}</TableCell>
                                    <TableCell>
                                        <Link href={`/orders/${item.orderId}`} className="text-blue-500 hover:underline">
                                            {item.order?.orderNo || '查看订单'}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{item.customerName}</TableCell>
                                    <TableCell>¥{parseFloat(item.totalAmount).toLocaleString()}</TableCell>
                                    <TableCell className="text-green-600">¥{parseFloat(item.receivedAmount).toLocaleString()}</TableCell>
                                    <TableCell className="font-semibold text-orange-600">¥{parseFloat(item.pendingAmount).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(item.status)}>
                                            {getStatusLabel(item.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{format(new Date(item.createdAt), 'yyyy-MM-dd')}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" title="查看详情" asChild>
                                            <Link href={`/finance/ar/${item.id}`}>
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                        {parseFloat(item.pendingAmount) > 0 && (
                                            <Button variant="ghost" size="icon" title="登记收款" onClick={() => handleCreateReceipt(item)}>
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ReceiptBillDialog
                open={isReceiptDialogOpen}
                onOpenChange={setIsReceiptDialogOpen}
                initialStatement={selectedStatement}
            />
        </div>
    );
}
