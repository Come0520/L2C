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
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import { format } from 'date-fns';
import Link from 'next/link';

import { type InferSelectModel } from 'drizzle-orm';
import { reconciliations } from '@/shared/api/schema/finance';

type Reconciliation = InferSelectModel<typeof reconciliations>;

interface ReconciliationTableProps {
    data: Reconciliation[];
}

export function ReconciliationTable({ data }: ReconciliationTableProps) {
    const getStatusVariant = (status: string): "success" | "info" | "warning" | "error" | "secondary" | "default" => {
        const variants: Record<string, "success" | "info" | "warning" | "error" | "secondary" | "default"> = {
            DRAFT: 'secondary',
            PENDING: 'warning',
            PENDING_CONFIRM: 'warning',
            RECONCILING: 'warning',
            MATCHED: 'info',
            CONFIRMED: 'success',
            COMPLETED: 'success',
            REJECTED: 'error',
            VOIDED: 'error',
        };
        return variants[status] || 'secondary';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            DRAFT: '草稿',
            PENDING: '待处理',
            PENDING_CONFIRM: '待确认',
            RECONCILING: '对账中',
            MATCHED: '已匹配',
            CONFIRMED: '已确认',
            COMPLETED: '已完成',
            REJECTED: '已驳回',
            VOIDED: '已作废',
        };
        return labels[status] || status;
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            CUSTOMER: '客户对账',
            SUPPLIER: '供应商对账',
            CHANNEL: '渠道对账',
            INTERNAL: '内部对账',
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">对账单管理</h3>
                <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    新建对账单
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>对账单号</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead>对账单位/人</TableHead>
                            <TableHead>核对金额</TableHead>
                            <TableHead>差异金额</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>日期</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    暂无对账记录
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.reconciliationNo}</TableCell>
                                    <TableCell>{getTypeLabel(item.reconciliationType)}</TableCell>
                                    <TableCell>{item.targetName}</TableCell>
                                    <TableCell>¥{parseFloat(item.totalAmount).toLocaleString()}</TableCell>
                                    <TableCell className={parseFloat(item.unmatchedAmount) !== 0 ? 'text-red-500 font-semibold' : ''}>
                                        ¥{parseFloat(item.unmatchedAmount).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(item.status)}>
                                            {getStatusLabel(item.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{item.createdAt ? format(new Date(item.createdAt), 'yyyy-MM-dd') : '-'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" title="查看明细" asChild>
                                            <Link href={`/finance/reconciliation/${item.id}`}>
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                        {item.status === 'PENDING_CONFIRM' && (
                                            <>
                                                <Button variant="ghost" size="icon" className="text-green-600" title="确认">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-600" title="驳回">
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
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
