'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import Eye from 'lucide-react/dist/esm/icons/eye';
import { StatusBadge } from '@/shared/ui/status-badge';
import Link from 'next/link';

/**
 * 加工单数据类型
 */
interface ProcessingOrder {
    id: string;
    processingNo: string;
    status: string;
    processorName: string;
    order?: {
        id?: string;
        orderNo: string;
    };
    startedAt: string;
    createdAt: string;
}

interface ProcessingOrderTableProps {
    data: ProcessingOrder[];
}

/**
 * 加工单列表表格组件
 */
export function ProcessingOrderTable({ data }: ProcessingOrderTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>加工单号</TableHead>
                        <TableHead>关联订单</TableHead>
                        <TableHead>加工厂</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>开始时间</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                暂无加工单数据
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/supply-chain/processing-orders/${item.id}`}
                                        className="text-primary hover:underline"
                                    >
                                        {item.processingNo}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {item.order?.orderNo ? (
                                        <Link
                                            href={`/orders/${item.order.id}`}
                                            className="text-primary hover:underline"
                                        >
                                            {item.order.orderNo}
                                        </Link>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>{item.processorName}</TableCell>
                                <TableCell>
                                    <StatusBadge status={item.status} />
                                </TableCell>
                                <TableCell>{item.startedAt}</TableCell>
                                <TableCell>{item.createdAt}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/supply-chain/processing-orders/${item.id}`}>
                                            <Eye className="h-4 w-4" />
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
