
import { getProcessingOrderById } from '@/features/supply-chain/actions/processing-actions';
import { ShipmentTracker } from '@/features/supply-chain/components/shipment-tracker';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import Link from 'next/link';
import { ArrowLeft, Package, Truck, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/shared/ui/badge';
import { getShipments } from '@/features/supply-chain/actions/shipment-actions';

export default async function ProcessingOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const res = await getProcessingOrderById({ id });
    if (!res.success || !res.data) {
        return <div>Processing Order Not Found</div>;
    }
    const po = res.data;

    // Fetch related shipments
    const shipmentsRes = await getShipments({ referenceId: po.id }); // Should return shipments linked to this PO
    // Note: Shipments might be linked via referenceType='PROCESSING_ORDER'
    // But material shipments might be linked to materialPoId?
    // Let's list shipments directly linked to this PO first.
    const shipments = shipmentsRes.success ? shipmentsRes.data : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/supply-chain/processing-orders">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        {po.poNo}
                        <Badge variant="outline">{po.status}</Badge>
                    </h1>
                    <p className="text-muted-foreground">
                        关联订单: {po.order.orderNo} | 加工厂: {po.processorName}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                加工明细
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {po.items.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                                        <div>
                                            <div className="font-medium">{item.productName}</div>
                                            <div className="text-sm text-muted-foreground">SKU: {item.sku || '-'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">x {item.quantity}</div>
                                            {item.unitFee && <div className="text-sm text-muted-foreground">¥{item.unitFee} / 个</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                                <span className="text-muted-foreground">预估总费用:</span>
                                <span className="font-medium">¥{po.estimatedFee || '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">实际总费用:</span>
                                <span className="font-bold text-lg">¥{po.actualFee || '-'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipments */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                关联物流
                            </CardTitle>
                            {/* <Button size="sm" variant="outline">添加物流</Button> */}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {shipments.length > 0 ? shipments.map((shipment: any) => (
                                <ShipmentTracker
                                    key={shipment.id}
                                    company={shipment.logisticsCompany}
                                    trackingNo={shipment.trackingNo}
                                    status={shipment.status}
                                    trackingData={shipment.trackingData}
                                    updatedAt={shipment.updatedAt}
                                />
                            )) : (
                                <div className="text-center text-muted-foreground py-4">暂无关联物流</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                备注信息
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{po.remark || '无备注'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>操作</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {/* Actions to update status or edit would go here */}
                            <Button className="w-full" disabled>登记加工结果 (开发中)</Button>
                            <Button className="w-full" variant="secondary" disabled>更新状态 (开发中)</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
