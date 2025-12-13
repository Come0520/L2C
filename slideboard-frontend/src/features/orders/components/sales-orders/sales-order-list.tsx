'use client';

import React from 'react';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';
import { OrderFormData } from '@/shared/types/order';

interface SalesOrderListProps {
  orders: OrderFormData[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

export function SalesOrderList({ orders, onView, onEdit }: SalesOrderListProps) {
  return (
    <PaperTable>
      <PaperTableHeader>
        <PaperTableCell>订单号</PaperTableCell>
        <PaperTableCell>客户姓名</PaperTableCell>
        <PaperTableCell>联系电话</PaperTableCell>
        <PaperTableCell>项目地址</PaperTableCell>
        <PaperTableCell>总金额</PaperTableCell>
        <PaperTableCell>状态</PaperTableCell>
        <PaperTableCell>创建时间</PaperTableCell>
        <PaperTableCell>操作</PaperTableCell>
      </PaperTableHeader>
      <PaperTableBody>
        {orders.map((order) => (
          <PaperTableRow key={order.id || Math.random().toString()}>
            <PaperTableCell>{order.salesNo || '-'}</PaperTableCell>
            <PaperTableCell>{order.customerName}</PaperTableCell>
            <PaperTableCell>{order.customerPhone}</PaperTableCell>
            <PaperTableCell>{order.projectAddress}</PaperTableCell>
            <PaperTableCell>¥{order.totalAmount?.toLocaleString()}</PaperTableCell>
            <PaperTableCell>
              <PaperBadge variant={order.status === 'completed' ? 'success' : 'secondary'}>
                {order.status || '草稿'}
              </PaperBadge>
            </PaperTableCell>
            <PaperTableCell>{order.createTime}</PaperTableCell>
            <PaperTableCell>
              <div className="flex space-x-2">
                <PaperButton size="sm" variant="ghost" onClick={() => order.id && onView(order.id)}>
                  查看
                </PaperButton>
                <PaperButton size="sm" variant="ghost" onClick={() => order.id && onEdit(order.id)}>
                  编辑
                </PaperButton>
              </div>
            </PaperTableCell>
          </PaperTableRow>
        ))}
        {orders.length === 0 && (
          <PaperTableRow>
            <PaperTableCell colSpan={8} className="text-center py-8 text-ink-400">
              暂无销售单
            </PaperTableCell>
          </PaperTableRow>
        )}
      </PaperTableBody>
    </PaperTable>
  );
}
