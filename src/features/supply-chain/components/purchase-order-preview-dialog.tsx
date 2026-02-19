'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/shared/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { PO_STATUS_LABELS } from '../constants';
import { format } from 'date-fns';
import { Label } from '@/shared/ui/label';
import { Separator } from '@/shared/ui/separator';

interface PurchaseOrderItem {
    id: string;
    productName: string;
    quantity: string | number;
    unitPrice: string | number;
    subtotal: string | number;
}

interface PurchaseOrder {
    id: string;
    poNo: string;
    status: string | null;
    supplierName: string;
    createdAt: string | Date | null;
    expectedDate?: string | Date;
    totalAmount: string | number;
    logisticsNo?: string;
    logisticsCompany?: string;
    shippedAt?: string | Date;
    remark?: string;
    orderId?: string | null;
    order?: { orderNo: string } | null;
    creator?: { name: string } | null;
    items?: PurchaseOrderItem[];
    type?: 'FINISHED' | 'FABRIC' | 'STOCK';
    paymentStatus?: 'PENDING' | 'PAID' | 'PARTIAL';
}

interface PurchaseOrderPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: PurchaseOrder | null;
}

export function PurchaseOrderPreviewDialog({ open, onOpenChange, data }: PurchaseOrderPreviewDialogProps) {
    if (!data) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center justify-between">
                        <span>采购单详情</span>
                        <span className={
                            data.status === 'COMPLETED' ? 'glass-alert-success px-3 py-1 rounded-full text-sm' :
                                data.status === 'CANCELLED' ? 'glass-step-inactive px-3 py-1 rounded-full text-sm' :
                                    data.status === 'PENDING_PAYMENT' || data.status === 'PENDING_CONFIRMATION' ? 'glass-alert-warning px-3 py-1 rounded-full text-sm' :
                                        data.status === 'DRAFT' ? 'glass-step-inactive px-3 py-1 rounded-full text-sm' :
                                            'glass-alert-info px-3 py-1 rounded-full text-sm'
                        }>
                            {PO_STATUS_LABELS[data.status ?? ''] || data.status || '-'}
                        </span>
                    </DialogTitle>
                    <DialogDescription>
                        采购单号: {data.poNo}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground">供应商</Label>
                                <p className="text-lg font-medium">{data.supplierName}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">创建时间</Label>
                                <p>{data.createdAt ? format(new Date(data.createdAt), 'yyyy-MM-dd HH:mm:ss') : '-'}</p>
                            </div>
                            {data.expectedDate && (
                                <div>
                                    <Label className="text-muted-foreground">预期到货日期</Label>
                                    <p>{format(new Date(data.expectedDate), 'yyyy-MM-dd')}</p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground">关联订单</Label>
                                <p>{data.order?.orderNo || '无'}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">创建人</Label>
                                <p>{data.creator?.name || '未知'}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">总金额</Label>
                                <p className="text-xl font-bold text-primary">¥{data.totalAmount}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Logistics Info (if available) */}
                    {(data.logisticsNo || data.logisticsCompany) && (
                        <>
                            <div className="space-y-3">
                                <h3 className="font-semibold">物流信息</h3>
                                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                                    <div>
                                        <Label className="text-muted-foreground">物流公司</Label>
                                        <p>{data.logisticsCompany || '-'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">单号</Label>
                                        <p className="font-mono">{data.logisticsNo || '-'}</p>
                                    </div>
                                    {data.shippedAt && (
                                        <div>
                                            <Label className="text-muted-foreground">发货时间</Label>
                                            <p>{format(new Date(data.shippedAt), 'yyyy-MM-dd HH:mm')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Items Table */}
                    <div className="space-y-3">
                        <h3 className="font-semibold">采购明细</h3>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>产品名称</TableHead>
                                        <TableHead className="text-right">数量</TableHead>
                                        <TableHead className="text-right">单价</TableHead>
                                        <TableHead className="text-right">小计</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.items?.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.productName}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">¥{item.unitPrice}</TableCell>
                                            <TableCell className="text-right font-medium">¥{item.subtotal}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Remarks */}
                    {data.remark && (
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">备注</Label>
                            <div className="bg-muted/30 p-3 rounded text-sm whitespace-pre-wrap">
                                {data.remark}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
