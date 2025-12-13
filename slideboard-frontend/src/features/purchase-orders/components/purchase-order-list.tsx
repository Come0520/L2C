'use client';

import React from 'react';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';

import { PurchaseOrder } from '../types';

interface PurchaseOrderListProps {
  orders: PurchaseOrder[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

export function PurchaseOrderList({ orders, onView, onEdit }: PurchaseOrderListProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'received': return 'success';
      case 'ordered': return 'primary';
      case 'cancelled': return 'error';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'ordered': return '已下单';
      case 'received': return '已入库';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  return (
    <PaperTable>
      <PaperTableHeader>
        <PaperTableCell>采购单号</PaperTableCell>
        <PaperTableCell>供应商</PaperTableCell>
        <PaperTableCell>关联销售单</PaperTableCell>
        <PaperTableCell>总金额</PaperTableCell>
        <PaperTableCell>状态</PaperTableCell>
        <PaperTableCell>创建时间</PaperTableCell>
        <PaperTableCell>操作</PaperTableCell>
      </PaperTableHeader>
      <PaperTableBody>
        {orders.map(order => (
          <PaperTableRow key={order.id}>
            <PaperTableCell>{order.poNumber}</PaperTableCell>
            <PaperTableCell>{order.supplierName}</PaperTableCell>
            <PaperTableCell>{order.salesOrderNo || order.salesOrderId}</PaperTableCell>
            <PaperTableCell>¥{order.totalAmount.toLocaleString()}</PaperTableCell>
            <PaperTableCell>
              <PaperBadge variant={getStatusBadgeVariant(order.status)}>
                {getStatusLabel(order.status)}
              </PaperBadge>
            </PaperTableCell>
            <PaperTableCell>{new Date(order.createdAt).toLocaleDateString()}</PaperTableCell>
            <PaperTableCell>
              <div className="flex gap-2">
                <PaperButton size="sm" variant="ghost" onClick={() => onView(order.id)}>查看</PaperButton>
                {order.status === 'draft' && (
                  <PaperButton size="sm" variant="ghost" onClick={() => onEdit(order.id)}>编辑</PaperButton>
                )}
              </div>
            </PaperTableCell>
          </PaperTableRow>
        ))}
        {orders.length === 0 && (
          <PaperTableRow>
            <PaperTableCell colSpan={7} className="text-center py-8 text-ink-400">
              暂无采购单
            </PaperTableCell>
          </PaperTableRow>
        )}
      </PaperTableBody>
    </PaperTable>
  );
}
