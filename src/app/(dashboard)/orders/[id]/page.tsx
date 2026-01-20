import { auth, checkPermission } from '@/shared/lib/auth';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardContent } from '@/shared/ui/card';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { OrderTimeline } from '@/features/orders/components/order-timeline';
import { OrderDetailActions } from '@/features/orders/components/order-detail-actions';
import { SnapshotComparison } from '@/features/orders/components/snapshot-view';
import { LogisticsCard } from '@/features/orders/components/logistics-card';
import { OrderChangeHistory } from '@/features/orders/components/order-change-history';
import { RelatedDocuments } from '@/features/orders/components/related-documents';
import { getOrderById } from '@/features/orders/actions';
import { getAvailableWorkers } from '@/features/service/measurement/actions/queries';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import User from 'lucide-react/dist/esm/icons/user';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Package from 'lucide-react/dist/esm/icons/package';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // 并行启动所有独立请求 (消除 Waterfall)
    const [result, workersResult, session] = await Promise.all([
        getOrderById(id),
        getAvailableWorkers(),
        auth()
    ]);

    if (!result.success || !result.data) {
        notFound();
    }

    const order = result.data as any;
    const workers = workersResult.success && workersResult.data ? workersResult.data : [];

    // Check Profit View Permission
    try {
        await checkPermission(session, 'finance:profit:view');
    } catch {
        // Ignored
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 px-4 pt-6">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Link href="/orders" className="hover:text-primary transition-colors">订单管理</Link>
                <span>/</span>
                <span className="text-foreground font-medium">{order.orderNo}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg text-primary">
                        <Package className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{order.orderNo}</h1>
                            <OrderStatusBadge status={order.status || 'UNKNOWN'} />
                        </div>
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-500 mt-2">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {order.createdAt ? format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm') : '-'}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <User className="h-4 w-4" />
                                销售: {order.sales?.name || '-'}
                            </div>
                        </div>
                    </div>
                </div>
                <OrderDetailActions order={order} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Section: Details & Items */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Items Table Card */}
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Package className="h-5 w-5 text-slate-400" />
                                    订单明细
                                </h2>
                                <span className="text-sm text-slate-500">共 {order.items?.length || 0} 项</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Snapshot Comparison View */}
                            {order.snapshotData && (
                                <div className="p-4 border-b border-slate-100">
                                    <SnapshotComparison
                                        currentItems={order.items || []}
                                        snapshotData={order.snapshotData}
                                    />
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50/80 text-slate-500 font-medium border-b">
                                        <tr>
                                            <th className="px-6 py-4 text-left">产品信息</th>
                                            <th className="px-4 py-4 text-center">空间/位置</th>
                                            <th className="px-4 py-4 text-center">规格尺寸</th>
                                            <th className="px-4 py-4 text-center">数量</th>
                                            <th className="px-6 py-4 text-right">小计</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 italic-none">
                                        {order.items?.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-900">{item.productName}</div>
                                                    <div className="text-xs text-slate-400 mt-0.5">{item.category}</div>
                                                </td>
                                                <td className="px-4 py-4 text-center text-slate-600">{item.roomName || '-'}</td>
                                                <td className="px-4 py-4 text-center text-slate-600">
                                                    {item.width && item.height ? `${item.width}x${item.height}` : '-'}
                                                </td>
                                                <td className="px-4 py-4 text-center text-slate-900 font-medium">{item.quantity}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-bold text-slate-900">¥{Number(item.subtotal).toLocaleString()}</div>
                                                    <div className="text-[10px] text-slate-400">单价 ¥{item.unitPrice}</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50/50 border-t">
                                        <tr>
                                            <td colSpan={4} className="px-6 py-5 text-right font-medium text-slate-500 border-r">订单总额</td>
                                            <td className="px-6 py-5 text-right text-xl font-black text-primary italic font-serif">
                                                ¥{Number(order.totalAmount || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery & Customer Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3 border-b border-slate-50">
                                <h3 className="text-md font-semibold flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                    交付与地址
                                </h3>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">收货信息</div>
                                    <div className="text-slate-700 leading-relaxed font-medium">
                                        {order.customerName} <span className="text-slate-400 ml-2">{order.customerPhone}</span>
                                    </div>
                                    <div className="text-slate-500 text-sm mt-1">{order.deliveryAddress || '未设置收货地址'}</div>
                                </div>
                                <div className="pt-2 border-t border-slate-50">
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">备注</div>
                                    <div className="text-slate-600 text-sm italic">{order.remark || '暂无特别说明'}</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-3 border-b border-slate-50">
                                <h3 className="text-md font-semibold flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-400" />
                                    客户详情
                                </h3>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">客户建档</div>
                                    <Link href={`/customers/${order.customerId}`} className="text-primary hover:underline font-bold text-lg">
                                        {order.customerName}
                                    </Link>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                    <div className="text-sm text-slate-500">结算方式</div>
                                    <div className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">{order.settlementType === 'CASH' ? '现结' : '月结'}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Section: Workflow & Timeline */}
                <div className="space-y-6">

                    {/* Finance Status Card */}
                    <Card className="shadow-sm bg-linear-to-br from-white to-slate-50">
                        <CardHeader className="pb-3">
                            <h3 className="text-md font-semibold flex items-center gap-2 uppercase tracking-wide">
                                <DollarSign className="h-4 w-4 text-green-500" />
                                财务概况
                            </h3>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-xs text-slate-400 block mb-0.5">已收金额</span>
                                        <span className="text-2xl font-black text-green-600">¥{Number(order.paidAmount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-400 block mb-0.5">回款率</span>
                                        <span className="font-bold">
                                            {order.totalAmount && Number(order.totalAmount) > 0 ?
                                                Math.floor((Number(order.paidAmount || 0) / Number(order.totalAmount)) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                        style={{ width: `${order.totalAmount && Number(order.totalAmount) > 0 ? Math.min(100, (Number(order.paidAmount || 0) / Number(order.totalAmount)) * 100) : 0}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs font-bold text-slate-400">
                                    <span>总额: ¥{Number(order.totalAmount).toLocaleString()}</span>
                                    <span className="text-orange-500">待收: ¥{(Number(order.totalAmount) - Number(order.paidAmount || 0)).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Payment Toggle Logic Simplified */}
                            <Button className="w-full bg-slate-900 hover:bg-black text-white rounded-lg py-6 shadow-md transition-all active:scale-[0.98]" variant="default">
                                登记收款流水
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Progress Timeline */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <h3 className="text-md font-semibold">订单生命周期</h3>
                        </CardHeader>
                        <CardContent>
                            <OrderTimeline currentStatus={order.status} />
                        </CardContent>
                    </Card>

                    {/* Logistics Card */}
                    <LogisticsCard orderId={order.id} logistics={order.logistics} />

                    {/* 关联单据 (GlassIcons) */}
                    <RelatedDocuments
                        orderId={order.id}
                        purchaseOrderCount={order.purchaseOrders?.length || 0}
                        installTaskCount={order.installTasks?.length || 0}
                        receiptBillCount={order.receiptBills?.length || 0}
                    />

                    {/* 变更历史 */}
                    <OrderChangeHistory changes={order.changes || []} />
                </div>
            </div>
        </div>
    );
}
