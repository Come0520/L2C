'use client';

import React from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatDate } from '@/shared/lib/utils';
import Link from 'next/link';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { MaskedPhone } from '@/shared/components/masked-phone';
import { logPhoneView } from '@/features/customers/actions/privacy-actions';

import { CustomerListItem } from '@/features/customers/types';

import { EmptyUI } from '@/shared/ui/empty-ui';

interface CustomerTableProps {
  data: CustomerListItem[];

  currentUser: {
    id: string;
    tenantId: string;
    role: string;
  };
}

export const CustomerTable = React.memo(function CustomerTable({
  data,
  currentUser,
}: CustomerTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-muted/20 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12">
        <EmptyUI message="暂无符合条件的客户数据，请调整筛选条件或新建客户。" />
        <Button className="mt-4" asChild>
          <Link href="/customers/new">新建客户</Link>
        </Button>
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
                <Link href={`/customers/${customer.id}`} className="text-blue-600 hover:underline">
                  {customer.customerNo}
                </Link>
              </TableCell>
              <TableCell>
                <div className="font-medium">{customer.name}</div>
                <div className="text-muted-foreground text-xs">
                  <MaskedPhone
                    phone={customer.phone || ''}
                    customerId={customer.id}
                    canViewFull={canViewFull()}
                    onViewFull={handleViewPhone}
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <Badge
                    variant={
                      customer.level === 'A'
                        ? 'default'
                        : customer.level === 'B'
                          ? 'secondary'
                          : 'outline'
                    }
                    className={customer.level === 'A' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                  >
                    {customer.level}级
                  </Badge>
                </div>
              </TableCell>

              <TableCell className="text-right">
                ¥{Number(customer.totalAmount || 0).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">{customer.totalOrders}</TableCell>
              <TableCell>{customer.assignedSales?.name || '-'}</TableCell>
              <TableCell>{customer.lastOrderAt ? formatDate(customer.lastOrderAt) : '-'}</TableCell>
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
