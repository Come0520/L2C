'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';
import { useAuth } from '@/contexts/auth-context';
import { StatusBadge } from '@/features/orders/components/sales-orders/StatusBadge';
import { useSalesOrder } from '@/hooks/useSalesOrders';
import { OrderFormData, BaseOrder, CurtainItem } from '@/shared/types/order';
import { UserRole } from '@/shared/types/user';
import { SalesOrderStatus } from '@/types/sales-order-status';

interface SalesOrderDetailProps {
  initialOrder: OrderFormData;
}

interface ExtendedOrderData extends OrderFormData {
  id: string;
  salesNo?: string;
  status?: string;
}

export function SalesOrderDetail({ initialOrder }: SalesOrderDetailProps) {
  const router = useRouter();
  const { user } = useAuth();

  const { salesOrder, isLoading } = useSalesOrder(initialOrder.id as string);

  // Use realtime data if available, otherwise initial data
  const order = ((salesOrder as unknown as ExtendedOrderData) || initialOrder) as ExtendedOrderData;

  // 权限检查：是否为需要隐藏金额的角色
  const isRestrictedRole = ([
    'SERVICE_INSTALL',
    'SERVICE_MEASURE'
  ] as UserRole[]).includes(user?.role as UserRole);

  const handleBack = () => {
    router.push('/orders');
  };

  const handleEdit = () => {
    router.push(`/orders/${order.id}/edit`);
  };

  // Helper to get item description
  const getItemDescription = (item: CurtainItem) => {
    const parts = [];
    if (item.space) parts.push(item.space);
    if (item.product) parts.push(item.product);
    if (item.specifications && item.specifications.length > 0) {
      parts.push(`(${item.specifications.join(', ')})`);
    }
    return parts.join(' - ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-ink-800">销售单详情</h1>
          <StatusBadge status={order.status as SalesOrderStatus} size="lg" />
        </div>
        <div className="space-x-2">
          <PaperButton variant="outline" onClick={handleBack}>返回列表</PaperButton>
          <PaperButton variant="primary" onClick={handleEdit}>编辑订单</PaperButton>
        </div>
      </div>

      {/* Basic Info */}
      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle>基本信息</PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="text-sm text-ink-500 block mb-1">订单号</label>
              <p className="font-medium text-ink-900">{order.salesNo || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-ink-500 block mb-1">客户姓名</label>
              <p className="font-medium text-ink-900">{order.customerName}</p>
            </div>
            <div>
              <label className="text-sm text-ink-500 block mb-1">联系电话</label>
              <p className="font-medium text-ink-900">{order.customerPhone}</p>
            </div>
            <div>
              <label className="text-sm text-ink-500 block mb-1">项目地址</label>
              <p className="font-medium text-ink-900 truncate" title={order.projectAddress}>
                {order.projectAddress}
              </p>
            </div>
            <div>
              <label className="text-sm text-ink-500 block mb-1">设计师</label>
              <p className="font-medium text-ink-900">{order.designer || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-ink-500 block mb-1">销售员</label>
              <p className="font-medium text-ink-900">{order.salesPerson || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-ink-500 block mb-1">创建时间</label>
              <p className="font-medium text-ink-900">{order.createTime}</p>
            </div>
            <div>
              <label className="text-sm text-ink-500 block mb-1">期望交付</label>
              <p className="font-medium text-ink-900">{order.expectedDeliveryTime || '-'}</p>
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* Order Items */}
      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle>商品明细</PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader>
              <PaperTableRow>
                <PaperTableCell isHeader>类型</PaperTableCell>
                <PaperTableCell isHeader>空间/商品</PaperTableCell>
                <PaperTableCell isHeader>规格/描述</PaperTableCell>
                <PaperTableCell isHeader>数量</PaperTableCell>
                {/* 仅非受限角色可见单价和金额 */}
                {!isRestrictedRole && <PaperTableCell isHeader>单价</PaperTableCell>}
                {!isRestrictedRole && <PaperTableCell isHeader>金额</PaperTableCell>}
                <PaperTableCell isHeader>备注</PaperTableCell>
              </PaperTableRow>
            </PaperTableHeader>
            <PaperTableBody>
              {/* Combine all items for display */}
              {[
                ...(order.curtains || []),
                ...(order.wallcoverings || []),
                ...(order.backgroundWalls || []),
                ...(order.windowCushions || []),
                ...(order.standardProducts || [])
              ].length === 0 ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={isRestrictedRole ? 5 : 7} className="text-center py-8 text-ink-400">
                    暂无商品
                  </PaperTableCell>
                </PaperTableRow>
              ) : (
                [
                  ...(order.curtains || []).map(i => ({ ...i, _category: '窗帘' })),
                  ...(order.wallcoverings || []).map(i => ({ ...i, _category: '墙布' })),
                  ...(order.backgroundWalls || []).map(i => ({ ...i, _category: '背景墙' })),
                  ...(order.windowCushions || []).map(i => ({ ...i, _category: '飘窗垫' })),
                  ...(order.standardProducts || []).map(i => ({ ...i, _category: '标品' }))
                ].map((item, index) => (
                  <PaperTableRow key={item.id || `item-${index}`}>
                    <PaperTableCell>
                      <span className="px-2 py-1 bg-paper-bg-light rounded text-xs text-ink-600">
                        {item._category}
                      </span>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.space}</span>
                        <span className="text-sm text-ink-500">{item.product}</span>
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="text-sm text-ink-500 max-w-xs truncate">
                        {item.specifications?.join(', ') || '-'}
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      {(item.width || 0) > 0 && (item.height || 0) > 0 ? (
                        <span>{item.width} x {item.height} (x{item.quantity})</span>
                      ) : (
                        <span>{item.quantity} {item.unit}</span>
                      )}
                    </PaperTableCell>
                    {!isRestrictedRole && <PaperTableCell>¥{item.unitPrice}</PaperTableCell>}
                    {!isRestrictedRole && <PaperTableCell className="font-medium">¥{item.amount}</PaperTableCell>}
                    <PaperTableCell className="text-ink-400 text-sm max-w-xs truncate">{item.remark || '-'}</PaperTableCell>
                  </PaperTableRow>
                ))
              )}
            </PaperTableBody>
          </PaperTable>
        </PaperCardContent>
      </PaperCard>

      {/* Financial Info - 仅非受限角色可见 */}
      {!isRestrictedRole && (
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>费用汇总</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 bg-paper-bg-light rounded-lg">
                <div className="text-sm text-ink-500 mb-1">套餐总额</div>
                <div className="text-xl font-bold text-ink-800">¥{order.packageAmount?.toLocaleString() || 0}</div>
              </div>
              <div className="p-4 bg-paper-bg-light rounded-lg">
                <div className="text-sm text-ink-500 mb-1">套餐超额/升级</div>
                <div className="text-xl font-bold text-ink-800">¥{((order.packageExcessAmount || 0) + (order.upgradeAmount || 0)).toLocaleString()}</div>
              </div>
              <div className="p-4 bg-paper-bg-light rounded-lg">
                <div className="text-sm text-ink-500 mb-1">非套餐商品</div>
                <div className="text-xl font-bold text-ink-800">
                  ¥{Object.values(order.subtotals || {})
                    .filter((v, i, arr) => typeof v === 'number' && Object.keys(order.subtotals)[i] !== 'total' && Object.keys(order.subtotals)[i] !== 'discount' && Object.keys(order.subtotals)[i] !== 'tax')
                    .reduce((a: number, b: number) => a + b, 0)
                    .toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-primary-50 border border-primary-100 rounded-lg">
                <div className="text-sm text-primary-700 mb-1">订单总金额</div>
                <div className="text-2xl font-bold text-primary-700">¥{order.totalAmount?.toLocaleString() || 0}</div>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      )}
    </div>
  );
}
