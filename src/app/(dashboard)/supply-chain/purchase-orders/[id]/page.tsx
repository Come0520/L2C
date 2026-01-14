
import { getPoById, updatePoStatus } from '@/features/supply-chain/actions';
import { LogisticsDialog } from '@/features/supply-chain/components/logistics-dialog';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { ArrowLeft, Play, PackageCheck, CheckCircle, Truck } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { purchaseOrderItems, poQuoteStatusEnum } from '@/shared/api/schema';
import { PoQuoteDialog } from '@/features/supply-chain/components/po-quote-dialog';
import { FileText, ExternalLink } from 'lucide-react';

type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
type PoQuoteStatus = typeof poQuoteStatusEnum.enumValues[number];

function PoStatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; className: string }> = {
        'DRAFT': { label: '草稿', className: 'bg-gray-100 text-gray-700' },
        'ORDERED': { label: '已下单', className: 'bg-blue-100 text-blue-700' },
        'SHIPPED': { label: '已发货', className: 'bg-purple-100 text-purple-700' },
        'RECEIVED': { label: '已收货', className: 'bg-orange-100 text-orange-700' },
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

    // Action Buttons Component (Server component usage limitation, might need client wrapper or simple server actions in form)
    // For simplicity using simple forms or buttons that trigger actions via client component wrapper if needed.
    // Actually, we can just use a client component for the actions bar.

    // Status check
    const isDraft = po.status === 'DRAFT';
    const isOrdered = po.status === 'ORDERED';
    const isShipped = po.status === 'SHIPPED';
    const isReceived = po.status === 'RECEIVED';

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
                            <PoStatusBadge status={po.status} />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            供应商: {po.supplierName} · 关联订单: {po.order.orderNo}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {isDraft && (
                        <form action={async () => {
                            'use server';
                            const res = await updatePoStatus({ poId: id, status: 'ORDERED' });
                            if (!res.success) throw new Error(res.error);
                        }}>
                            <Button type="submit" className="bg-blue-600">
                                <Play className="h-4 w-4 mr-2" />
                                确认下单
                            </Button>
                        </form>
                    )}

                    {isOrdered && (
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
                            const res = await updatePoStatus({ poId: id, status: 'RECEIVED' });
                            if (!res.success) throw new Error(res.error);
                        }}>
                            <Button type="submit" className="bg-orange-600">
                                <PackageCheck className="h-4 w-4 mr-2" />
                                确认收货
                            </Button>
                        </form>
                    )}

                    {isReceived && (
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

                    {/* Quote Action */}
                    { }
                    {(!po.quoteStatus || po.quoteStatus === 'PENDING_QUOTE' || po.quoteStatus === 'QUOTED') && !isDraft && po.status !== 'CANCELLED' && po.status !== 'COMPLETED' && (
                        <PoQuoteDialog
                            poId={po.id}
                            systemTotalCost={Number(po.totalCost)}
                            trigger={
                                <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                    <FileText className="h-4 w-4 mr-2" />
                                    {po.quoteStatus === 'QUOTED' ? '修改报价' : '录入报价'}
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
                                    {(po.items as PurchaseOrderItem[]).map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{item.productName}</div>
                                                <div className="text-xs text-gray-400">SKU: {item.sku}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">¥{item.unitCost}</td>
                                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right font-medium">¥{item.subtotal}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-medium border-t">
                                        <td colSpan={3} className="px-4 py-3 text-right">总成本</td>
                                        <td className="px-4 py-3 text-right text-lg">¥{po.totalCost}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Logistics Info (If Shipped) */}
                    {(po.status === 'SHIPPED' || po.status === 'RECEIVED' || po.status === 'COMPLETED') && (
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
                    {/* Quote Info Card */}
                    {po.quotedTotalCost && (
                        <Card>
                            <CardHeader title="报价信息" />
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">状态</span>
                                    <Badge variant={(po.quoteStatus as PoQuoteStatus) === 'PENDING_APPROVAL' ? 'warning' : 'success'}>
                                        {po.quoteStatus === 'PENDING_APPROVAL' ? '待审批' : po.quoteStatus === 'VERIFIED' ? '已确认' : '已报价'}
                                    </Badge>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">供应商报价</div>
                                    <div className="font-medium text-lg">¥{po.quotedTotalCost}</div>
                                </div>
                                {po.varianceReason && (
                                    <div>
                                        <div className="text-xs text-gray-400">差异说明</div>
                                        <div className="text-sm text-gray-700 mt-1">{po.varianceReason}</div>
                                    </div>
                                )}
                                {po.supplierQuoteImg && (
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">凭证</div>
                                        <a href={po.supplierQuoteImg} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                                            查看图片 <ExternalLink className="h-3 w-3 ml-1" />
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader title="基础信息" />
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-xs text-gray-400">供应商</div>
                                <div className="font-medium text-base">{po.supplierName}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    类型: {po.type === 'INTERNAL' ? '内部' : '外部'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">关联订单</div>
                                <Link href={`/orders/${po.orderId}`} className="text-blue-600 hover:underline">
                                    {po.order.orderNo}
                                </Link>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">创建人</div>
                                <div>{po.creator.name}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
