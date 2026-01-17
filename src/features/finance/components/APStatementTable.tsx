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
import Plus from 'lucide-react/dist/esm/icons/plus';
import Eye from 'lucide-react/dist/esm/icons/eye';
import { useState } from 'react';
import { PaymentBillDialog } from './PaymentBillDialog';
import { format } from 'date-fns';
import Link from 'next/link';

interface APStatementTableProps {
    data: any[];
    type: 'SUPPLIER' | 'LABOR';
}

export function APStatementTable({ data, type }: APStatementTableProps) {
    const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
    const [selectedStatement, setSelectedStatement] = useState<any>(null);

    const handleCreatePayment = (statement: any) => {
        setSelectedStatement(statement);
        setIsBillDialogOpen(true);
    };

    const getStatusVariant = (status: string): "success" | "info" | "warning" | "error" | "secondary" | "default" => {
        const variants: Record<string, any> = {
            CALCULATED: 'secondary',
            CONFIRMED: 'info',
            PARTIAL: 'warning',
            COMPLETED: 'success',
            VOIDED: 'error',
        };
        return variants[status] || 'secondary';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            CALCULATED: '已试算',
            CONFIRMED: '已确认',
            PARTIAL: '部分付款',
            COMPLETED: '已付完',
            VOIDED: '已作废',
        };
        return labels[status] || status;
    };

    const title = type === 'SUPPLIER' ? '供应商应付' : '劳务结算';

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{title}</h3>
                <Button size="sm" onClick={() => handleCreatePayment(null)}>
                    <Plus className="w-4 h-4 mr-1" />
                    新建付款单
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>账单编号</TableHead>
                            <TableHead>{type === 'SUPPLIER' ? '供应商' : '安装工'}</TableHead>
                            <TableHead>期间/订单</TableHead>
                            <TableHead>总额</TableHead>
                            <TableHead>已付</TableHead>
                            <TableHead>待付</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>日期</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                    暂无应付记录
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.statementNo}</TableCell>
                                    <TableCell>{type === 'SUPPLIER' ? (item.supplier?.name || item.supplierName) : (item.worker?.name || item.workerName)}</TableCell>
                                    <TableCell>
                                        {type === 'SUPPLIER' ? (
                                            <Link href={`/purchase-orders/${item.purchaseOrderId}`} className="text-blue-500 hover:underline">
                                                {item.purchaseOrder?.orderNo || '查看采购单'}
                                            </Link>
                                        ) : item.settlementPeriod}
                                    </TableCell>
                                    <TableCell>¥{parseFloat(item.totalAmount).toLocaleString()}</TableCell>
                                    <TableCell className="text-blue-600">¥{parseFloat(item.paidAmount).toLocaleString()}</TableCell>
                                    <TableCell className="font-semibold text-orange-600">¥{parseFloat(item.pendingAmount).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(item.status)}>
                                            {getStatusLabel(item.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{format(new Date(item.createdAt), 'yyyy-MM-dd')}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" title="查看明细" asChild>
                                            <Link href={`/finance/ap/${type.toLowerCase()}/${item.id}`}>
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                        {parseFloat(item.pendingAmount) > 0 && (
                                            <Button variant="ghost" size="icon" title="提交付款" onClick={() => handleCreatePayment(item)}>
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

            <PaymentBillDialog
                open={isBillDialogOpen}
                onOpenChange={setIsBillDialogOpen}
                initialStatement={selectedStatement}
                statementType={type === 'SUPPLIER' ? 'AP_SUPPLIER' : 'AP_LABOR'}
            />
        </div>
    );
}
