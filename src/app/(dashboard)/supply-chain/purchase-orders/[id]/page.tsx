
import { getPoById, updatePoStatus } from '@/features/supply-chain/actions/po-actions';
import { AddLogisticsDialog as LogisticsDialog } from '@/features/supply-chain/components/add-logistics-dialog';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { ArrowLeft, Play, PackageCheck, CheckCircle, Truck } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { purchaseOrderItems } from '@/shared/api/schema';
// import { POQuoteDialog } from '@/features/supply-chain/components/po-quote-dialog';
// import { FileText, ExternalLink } from 'lucide-react';

type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
// type PoQuoteStatus = typeof poQuoteStatusEnum.enumValues[number];

// Status Badge Component
function PoStatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; className: string }> = {
        'DRAFT': { label: '草稿', className: 'bg-gray-100 text-gray-700' },
        'IN_PRODUCTION': { label: '生产中', className: 'bg-blue-100 text-blue-700' },
        'READY': { label: '备货完成', className: 'bg-indigo-100 text-indigo-700' },
        'SHIPPED': { label: '已发货', className: 'bg-purple-100 text-purple-700' },
        'DELIVERED': { label: '已到货', className: 'bg-orange-100 text-orange-700' },
        'COMPLETED': { label: '已完成', className: 'bg-green-100 text-green-700' },
        'CANCELLED': { label: '已取消', className: 'bg-red-100 text-red-700' },
    };
    const config = map[status] || { label: status, className: 'bg-gray-100' };
    return <Badge className={config.className}>{config.label}</Badge>;
}

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

    // Status check
    const isDraft = po.status === 'DRAFT';
    const isInProduction = po.status === 'IN_PRODUCTION';
    const isReady = po.status === 'READY';
    const isShipped = po.status === 'SHIPPED';
    const isDelivered = po.status === 'DELIVERED';

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
                            <PoStatusBadge status={po.status || 'DRAFT'} />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            供应商: {po.supplierName} · 关联订单: {po.order?.orderNo || '-'}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {isDraft && (
                        <form action={async () => {
                            'use server';
                            const res = await updatePoStatus({ poId: id, status: 'IN_PRODUCTION' });
                            if (!res.success) throw new Error(res.error);
                        }}>
                            <Button type="submit" className="bg-blue-600">
                                <Play className="h-4 w-4 mr-2" />
                                确认下单
                            </Button>
                        </form>
                    )}

                    {isInProduction && (
                        <form action={async () => {
                            'use server';
                            const res = await updatePoStatus({ poId: id, status: 'READY' });
                            if (!res.success) throw new Error(res.error);
                        }}>
                            <Button type="submit" className="bg-indigo-600">
                                <PackageCheck className="h-4 w-4 mr-2" />
                                备货完成
                            </Button>
                        </form>
                    )}

                    {isReady && (
                        <LogisticsDialog
                            poId={po.id}
                            trigger={
                                <Button className="bg-purple-600">
                                    <Truck className="h-4 w-4 mr-2" />
                                    发货登记
                                </Button>
                            }
                        />
                    )}

                    {isShipped && (
                        <form action={async () => {
                            'use server';
                            const res = await updatePoStatus({ poId: id, status: 'DELIVERED' });
                            if (!res.success) throw new Error(res.error);
                        }}>
                            <Button type="submit" className="bg-orange-600">
                                <PackageCheck className="h-4 w-4 mr-2" />
                                确认到货
                            </Button>
                        </form>
                    )}

                    {isDelivered && (
                        <form action={async () => {
                            'use server';
                            const res = await updatePoStatus({ poId: id, status: 'COMPLETED' });
                            if (!res.success) throw new Error(res.error);
                        }}>
                            <Button type="submit" className="bg-green-600">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                完成采购
                            </Button>
                        </form>
                    )}

                    {/* Quote Action disabled */}
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
                    {/* Quote Info Card disabled */}

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
