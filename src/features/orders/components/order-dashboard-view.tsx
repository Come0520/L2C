'use client';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { formatDate } from '@/shared/lib/utils';
import { PaymentEntryDialog } from './payment-entry-dialog';
import Link from 'next/link';
import { ChevronLeft, Printer, ShoppingBag } from 'lucide-react';

interface Props {
    order: any;
}

const STATUS_MAP: Record<string, string> = {
    'DRAFT': '草稿',
    'PENDING_PAYMENT': '待付款',
    'IN_PRODUCTION': '生产中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
};

export function OrderDashboardView({ order }: Props) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <Button variant="ghost" className="w-fit p-0 hover:bg-transparent" asChild>
                    <Link href="/orders" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="h-4 w-4" /> 返回订单列表
                    </Link>
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            订单 {order.orderNo}
                            <Badge variant={order.status === 'IN_PRODUCTION' ? 'default' : 'secondary'}>
                                {STATUS_MAP[order.status] || order.status}
                            </Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">创建时间: {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Printer className="h-4 w-4" /> 打印订单
                        </Button>
                        {/* More actions */}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Content (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ShoppingBag className="h-4 w-4" /> 商品清单
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-4">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0">
                                        <div>
                                            <div className="font-medium">{item.roomName} - {item.productName}</div>
                                            <div className="text-sm text-muted-foreground mt-1">{item.attributes?.sku || '标准规格'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">¥{item.subtotal}</div>
                                            <div className="text-xs text-muted-foreground">x{item.quantity}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end pt-4 border-t mt-4 gap-6 text-sm">
                                <div>总数量: <span className="font-medium">{order.items.length}</span></div>
                                <div>总金额: <span className="font-bold text-lg">¥{order.totalAmount}</span></div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Schedules */}
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base flex justify-between items-center">
                                <span>付款进度</span>
                                <span className="text-sm font-normal text-muted-foreground">
                                    已付: <span className="text-green-600 font-bold">¥{order.paidAmount}</span> /
                                    待付: <span className="text-red-500 font-bold">¥{order.balanceAmount}</span>
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <table className="w-full text-sm text-left">
                                <thead className="[&_th]:py-3 [&_th]:font-medium [&_th]:text-muted-foreground border-b">
                                    <tr>
                                        <th>款项名称</th>
                                        <th>应付金额</th>
                                        <th>状态</th>
                                        <th>实付/凭证</th>
                                        <th className="text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_td]:py-4 [&_tr]:border-b [&_tr:last-child]:border-0">
                                    {order.paymentSchedules.map((schedule: any) => (
                                        <tr key={schedule.id}>
                                            <td className="font-medium">{schedule.name}</td>
                                            <td>¥{schedule.amount}</td>
                                            <td>
                                                <Badge variant={schedule.status === 'PAID' ? 'success' : 'outline'}
                                                    className={schedule.status === 'PAID' ? 'bg-green-100 text-green-700 border-transparent' : ''}>
                                                    {schedule.status === 'PAID' ? '已支付' : '待支付'}
                                                </Badge>
                                            </td>
                                            <td>
                                                {schedule.status === 'PAID' ? (
                                                    <div className="flex items-center gap-2">
                                                        <span>¥{schedule.actualAmount}</span>
                                                        {schedule.proofImg && (
                                                            <a href={schedule.proofImg} target="_blank" className="text-xs text-blue-500 underline">凭证</a>
                                                        )}
                                                    </div>
                                                ) : '-'}
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
                        <CardContent className="text-sm space-y-3">
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
                            <div className="bg-muted/30 p-3 rounded text-muted-foreground leading-relaxed">
                                {order.deliveryAddress || '未填写地址'}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
