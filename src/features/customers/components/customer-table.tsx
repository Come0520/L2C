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
import { Button } from '@/shared/ui/button';
import { formatDate } from '@/shared/lib/utils';
import Link from 'next/link';
import { ArrowRight, User } from 'lucide-react';

interface CustomerTableProps {
    data: any[]; // Replace with specific type
    page: number;
    pageSize: number;
}

export function CustomerTable({ data, page, pageSize }: CustomerTableProps) {
    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 border rounded-lg bg-gray-50">
                <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>暂无客户数据</p>
            </div>
        );
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>客户编号</TableHead>
                        <TableHead>姓名/电话</TableHead>
                        <TableHead>等级/标签</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead className="text-right">累计交易</TableHead>
                        <TableHead className="text-right">订单数</TableHead>
                        <TableHead>归属销售</TableHead>
                        <TableHead>最近下单</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((customer) => (
                        <TableRow key={customer.id}>
                            <TableCell className="font-medium">
                                <Link href={`/customers/${customer.id}`} className="hover:underline text-blue-600">
                                    {customer.customerNo}
                                </Link>
                            </TableCell>
                            <TableCell>
                                <div className="font-medium text-gray-900">{customer.name}</div>
                                <div className="text-xs text-gray-500">{customer.phone}</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1 items-start">
                                    <Badge variant={
                                        customer.level === 'A' ? 'default' :
                                            customer.level === 'B' ? 'secondary' : 'outline'
                                    } className={
                                        customer.level === 'A' ? 'bg-yellow-500 hover:bg-yellow-600' : ''
                                    }>
                                        {customer.level}级
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell>
                                {customer.type === 'COMPANY' ? <Badge variant="outline">公司</Badge> : '个人'}
                            </TableCell>
                            <TableCell className="text-right">
                                ¥{Number(customer.totalAmount || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                                {customer.totalOrders}
                            </TableCell>
                            <TableCell>
                                {customer.assignedSales?.name || '-'}
                            </TableCell>
                            <TableCell>
                                {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/customers/${customer.id}`}>
                                        详情
                                        <ArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
