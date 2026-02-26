'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { formatDate } from '@/shared/lib/utils';

/**
 * 调拨状态样式
 */
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    'PENDING': { label: '待执行', variant: 'secondary' },
    'COMPLETED': { label: '已完成', variant: 'default' },
    'CANCELLED': { label: '已取消', variant: 'destructive' },
};

interface Transfer {
    id: string;
    transferNo: string;
    fromAccount?: { accountName: string } | null;
    toAccount?: { accountName: string } | null;
    amount: string;
    status: string;
    remark?: string | null;
    createdAt: Date | string | null;
    creator?: { name: string } | null;
}

interface TransfersListProps {
    data: Transfer[];
}

/**
 * 资金调拨列表组件
 */
export function TransfersList({ data }: TransfersListProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[140px]">调拨单号</TableHead>
                        <TableHead>转出账户</TableHead>
                        <TableHead>转入账户</TableHead>
                        <TableHead className="text-right">金额</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>创建人</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead>备注</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                暂无调拨记录
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => {
                            const statusConfig = STATUS_CONFIG[item.status] || { label: item.status, variant: 'outline' as const };

                            return (
                                <TableRow key={item.id}>
                                    <TableCell className="font-mono text-sm">
                                        {item.transferNo}
                                    </TableCell>
                                    <TableCell>
                                        {item.fromAccount?.accountName || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {item.toAccount?.accountName || '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        ¥{Number(item.amount).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusConfig.variant}>
                                            {statusConfig.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {item.creator?.name || '-'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {item.createdAt ? formatDate(new Date(item.createdAt)) : '-'}
                                    </TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={item.remark || ''}>
                                        {item.remark || '-'}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
