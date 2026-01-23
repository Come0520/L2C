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
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatDate } from '@/shared/lib/utils';
import Link from 'next/link';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import User from 'lucide-react/dist/esm/icons/user';
import { MaskedPhone } from '@/shared/components/masked-phone';
import { logPhoneView } from '@/features/customers/actions/privacy-actions';

interface Customer {
    id: string;
    customerNo: string | null;
    name: string;
    phone: string | null;
    level: string | null;
    type: string | null;
    totalAmount: string | number | null;
    totalOrders: number | null;
    assignedSales?: { name: string | null } | null;
    lastOrderAt: Date | null | string;
}

interface CustomerTableProps {
    data: Customer[];

    currentUser: {
        id: string;
        tenantId: string;
        role: string;
    };
}

export const CustomerTable = React.memo(function CustomerTable({ data, currentUser }: CustomerTableProps) {
    if (data.length === 0) {
        return (
            <div className="glass-empty-state py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>暂无客户数据</p>
            </div>
        );
    }

    // 判断当前用户是否有权查看详情（ADMIN, MANAGER, 或者归属销售）
    const canViewFull = () => {
        if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') return true;
        // 注意：这里假设业务逻辑是管理员和经理可见，或者根据需要调整
        return true; // Phase 1 简化处理，后续可细化
    };

    const handleViewPhone = async (customerId: string) => {
        await logPhoneView({
            customerId,
        });
    };

    return (
        <div className="glass-table overflow-hidden">
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
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    <MaskedPhone
                                        phone={customer.phone || ''}
                                        customerId={customer.id}
                                        canViewFull={canViewFull()}
                                        onViewFull={handleViewPhone}
                                    />
                                </div>
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
});

