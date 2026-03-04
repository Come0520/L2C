'use client';

import React from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn, formatDate } from '@/shared/lib/utils';
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
      <div className="border-border/50 from-muted/30 to-muted/10 dark:from-muted/10 relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border bg-linear-to-b p-16 shadow-sm backdrop-blur-sm dark:to-transparent">
        <div className="from-primary/5 pointer-events-none absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col items-center">
          <EmptyUI message="暂无符合条件的客户数据，请调整筛选条件或新建客户。" />
          <Button
            className="mt-8 transition-all hover:scale-105 hover:shadow-md active:scale-95"
            asChild
          >
            <Link href="/customers/new">新建客户</Link>
          </Button>
        </div>
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
        <TableBody className="content-visibility-auto">
          {data.map((customer) => (
            <TableRow
              key={customer.id}
              className="group hover:bg-muted/50 cursor-pointer transition-all duration-200 active:scale-[0.995]"
            >
              <TableCell className="font-medium">
                <Link
                  href={`/customers/${customer.id}`}
                  className="text-primary group-hover:text-primary-600 transition-colors hover:underline"
                >
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
                    variant="outline"
                    className={cn(
                      'border font-semibold tracking-wide',
                      customer.level === 'A'
                        ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-900/30 dark:text-amber-400'
                        : customer.level === 'B'
                          ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    {customer.level} 级
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="group-hover:bg-primary/5 group-hover:text-primary transition-colors"
                  asChild
                >
                  <Link href={`/customers/${customer.id}`}>
                    详情
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
