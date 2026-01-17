'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';

interface InstallTask {
    id: string;
    customerName: string | null;
    address: string | null;
    status: string;
    scheduledDate: Date | string | null;
}

interface InstallTaskTableProps {
    data: InstallTask[];
}

export function InstallTaskTable({ data }: InstallTaskTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>客户 (Customer)</TableHead>
                        <TableHead>安装地址 (Address)</TableHead>
                        <TableHead>状态 (Status)</TableHead>
                        <TableHead>预约时间 (Scheduled)</TableHead>
                        <TableHead className="text-right">操作 (Actions)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                暂无安装任务 (No installation tasks found).
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.customerName || '未知客户'}</TableCell>
                                <TableCell>{item.address || '无地址'}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{item.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    {item.scheduledDate
                                        ? new Date(item.scheduledDate).toLocaleDateString()
                                        : '未预约'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                        <a href={`/service/installation/${item.id}`}>详情</a>
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

