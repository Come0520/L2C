'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/shared/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';

import { ReceiptBillWithRelations } from '../types';

interface ReceiptBillTableProps {
    data: ReceiptBillWithRelations[];
}

export function ReceiptBillTable({ data }: ReceiptBillTableProps) {
    const getStatusVariant = (status: string): "success" | "info" | "warning" | "error" | "secondary" | "default" => {
        const variants: Record<string, "success" | "info" | "warning" | "error" | "secondary" | "default"> = {
            DRAFT: 'secondary',
            PENDING_APPROVAL: 'warning',
            APPROVED: 'info',
            REJECTED: 'error',
            VERIFIED: 'success',
            PARTIAL_USED: 'success',
            FULLY_USED: 'success',
        };
        return variants[status] || 'secondary';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            DRAFT: '草稿',
            PENDING_APPROVAL: '待审批',
            APPROVED: '已通过',
            REJECTED: '已驳回',
            VERIFIED: '已核销',
            PARTIAL_USED: '部分使用',
            FULLY_USED: '已用完',
        };
        return labels[status] || status;
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>收款单号</TableHead>
                        <TableHead>客户姓名</TableHead>
                        <TableHead>收款金额</TableHead>
                        <TableHead>支付方式</TableHead>
                        <TableHead>收款日期</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>创建人</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                暂无收款记录
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.receiptNo}</TableCell>
                                <TableCell>{item.customerName}</TableCell>
                                <TableCell>¥{parseFloat(item.totalAmount).toLocaleString()}</TableCell>
                                <TableCell>{item.paymentMethod}</TableCell>
                                <TableCell>{format(new Date(item.receivedAt), 'yyyy-MM-dd')}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(item.status)}>
                                        {getStatusLabel(item.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell>{item.createdBy?.name || '未知'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/finance/receipts/${item.id}`}>
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
