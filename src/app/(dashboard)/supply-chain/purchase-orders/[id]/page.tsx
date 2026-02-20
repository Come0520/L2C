
import { getPoById } from '@/features/supply-chain/actions/po-actions';
import { AddLogisticsDialog as LogisticsDialog } from '@/features/supply-chain/components/add-logistics-dialog';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardContent } from '@/shared/ui/card';
import { ArrowLeft, Truck } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { PoStatusActions } from '@/features/supply-chain/components/po-status-actions';

export default async function PoDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const res = await getPoById({ id });
    const po = res.success ? res.data : null;

    if (!po) {
        notFound();
    }

    const isReady = po.status === 'READY';

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/supply-chain/purchase-orders">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">{po.poNo}</h1>
                            <PoStatusActions poId={po.id} initialStatus={po.status || 'DRAFT'} />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            供应商: {po.supplierName} · 关联订单: {po.order?.orderNo || '-'}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {isReady && (
                        <LogisticsDialog
                            poId={po.id}
                            trigger={
                                <Button className="bg-purple-600 hover:bg-purple-700">
                                    <Truck className="h-4 w-4 mr-2" />
                                    发货登记
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-3 gap-6">
                {/* Left: Items */}
                <div className="col-span-2 space-y-6">
                    <Card>
                        <CardHeader title="采购明细" />
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left">商品</th>
                                        <th className="px-4 py-3 text-right">成本单价</th>
                                        <th className="px-4 py-3 text-right">数量</th>
                                        <th className="px-4 py-3 text-right">小计</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(po.items || []).map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{item.productName}</div>
                                                <div className="text-xs text-gray-400">SKU: {(item as any).productSku || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">¥{item.unitPrice}</td>
                                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right font-medium">¥{item.subtotal}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-medium border-t">
                                        <td colSpan={3} className="px-4 py-3 text-right">总成本</td>
                                        <td className="px-4 py-3 text-right text-lg">¥{po.totalAmount}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Logistics Info (If Shipped) */}
                    {(po.status === 'SHIPPED' || po.status === 'DELIVERED' || po.status === 'COMPLETED') && (
                        <Card>
                            <CardHeader title="物流信息" />
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-400">物流公司</div>
                                        <div className="font-medium">{po.logisticsCompany || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400">运单号</div>
                                        <div className="font-medium">{po.logisticsNo || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400">发货时间</div>
                                        <div>{po.shippedAt ? format(new Date(po.shippedAt), 'yyyy-MM-dd HH:mm') : '-'}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right: Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader title="基础信息" />
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-xs text-gray-400">供应商</div>
                                <div className="font-medium text-base">{po.supplierName}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    类型: {po.type === 'STOCK' ? '库存' : po.type === 'FABRIC' ? '面料' : '成品'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">关联订单</div>
                                <Link href={`/orders/${po.orderId}`} className="text-blue-600 hover:underline">
                                    {po.order?.orderNo || '-'}
                                </Link>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">创建人</div>
                                <div>{po.creator?.name || '-'}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
