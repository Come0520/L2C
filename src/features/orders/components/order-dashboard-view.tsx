'use client';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { formatDate } from '@/shared/lib/utils';
import { PaymentEntryDialog } from './payment-entry-dialog';
import Link from 'next/link';
import { ChevronLeft, Printer, ShoppingBag } from 'lucide-react';

export interface OrderItem {
  id: string;
  roomName?: string;
  productName?: string;
  attributes?: { sku?: string } | unknown;
  subtotal?: string;
  quantity?: number | string;
}

export interface PaymentScheduleItem {
  id: string;
  name: string;
  amount: string;
  actualAmount?: string | null;
  status?: string | null;
  expectedDate?: string | null;
  proofImg?: string | null;
}

export interface OrderData {
  id: string;
  orderNo: string;
  status: string | null;
  createdAt: string | Date | null;
  totalAmount?: string | null;
  paidAmount?: string | null;
  balanceAmount?: string | null;
  items: OrderItem[];
  paymentSchedules: PaymentScheduleItem[];
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  customer?: {
    name: string;
    phone: string;
  } | null;
}

interface Props {
  order: OrderData;
}

const STATUS_MAP: Record<string, string> = {
  DRAFT: '草稿',
  PENDING_PAYMENT: '待付款',
  IN_PRODUCTION: '生产中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

export function OrderDashboardView({ order }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Button variant="ghost" className="w-fit p-0 hover:bg-transparent" asChild>
          <Link
            href="/orders"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> 返回订单列表
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold">
              订单 {order.orderNo}
              <Badge variant={order.status === 'IN_PRODUCTION' ? 'default' : 'secondary'}>
                {STATUS_MAP[order.status || ''] || order.status}
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              创建时间: {order.createdAt ? formatDate(order.createdAt) : '-'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" /> 打印订单
            </Button>
            {/* More actions */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Content (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="h-4 w-4" /> 商品清单
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium">
                        {item.roomName} - {item.productName}
                      </div>
                      <div className="text-muted-foreground mt-1 text-sm">
                        {(item.attributes as Record<string, string>)?.sku || '标准规格'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">¥{item.subtotal}</div>
                      <div className="text-muted-foreground text-xs">x{item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end gap-6 border-t pt-4 text-sm">
                <div>
                  总数量: <span className="font-medium">{order.items.length}</span>
                </div>
                <div>
                  总金额: <span className="text-lg font-bold">¥{order.totalAmount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Schedules */}
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>付款进度</span>
                <span className="text-muted-foreground text-sm font-normal">
                  已付: <span className="font-bold text-green-600">¥{order.paidAmount}</span> /
                  待付: <span className="font-bold text-red-500">¥{order.balanceAmount}</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <table className="w-full text-left text-sm">
                <thead className="[&_th]:text-muted-foreground border-b [&_th]:py-3 [&_th]:font-medium">
                  <tr>
                    <th>款项名称</th>
                    <th>应付金额</th>
                    <th>状态</th>
                    <th>实付/凭证</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="[&_td]:py-4 [&_tr]:border-b [&_tr:last-child]:border-0">
                  {order.paymentSchedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td className="font-medium">{schedule.name}</td>
                      <td>¥{schedule.amount}</td>
                      <td>
                        <Badge
                          variant={schedule.status === 'PAID' ? 'success' : 'outline'}
                          className={
                            schedule.status === 'PAID'
                              ? 'border-transparent bg-green-100 text-green-700'
                              : ''
                          }
                        >
                          {schedule.status === 'PAID' ? '已支付' : '待支付'}
                        </Badge>
                      </td>
                      <td>
                        {schedule.status === 'PAID' ? (
                          <div className="flex items-center gap-2">
                            <span>¥{schedule.actualAmount}</span>
                            {schedule.proofImg && (
                              <a
                                href={schedule.proofImg}
                                target="_blank"
                                className="text-xs text-blue-500 underline"
                              >
                                凭证
                              </a>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="text-right">
                        {schedule.status !== 'PAID' && (
                          <PaymentEntryDialog schedule={schedule} orderId={order.id} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Right Content (1/3) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">客户信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">姓名</span>
                <span className="font-medium">{order.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">电话</span>
                <span className="font-medium">{order.customer?.phone}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">收货信息</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="bg-muted/30 text-muted-foreground rounded p-3 leading-relaxed">
                {order.deliveryAddress || '未填写地址'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
