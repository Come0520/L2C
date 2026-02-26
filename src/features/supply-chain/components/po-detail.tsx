'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import Truck from 'lucide-react/dist/esm/icons/truck';
import Package from 'lucide-react/dist/esm/icons/package';
import Clock from 'lucide-react/dist/esm/icons/clock';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import { AddLogisticsDialog } from './add-logistics-dialog';
import { format } from 'date-fns';
import { PurchaseOrderDetail, PurchaseOrderAuditLog, PurchaseOrderItem } from '../types';

interface PODetailProps {
    data: PurchaseOrderDetail;
    onUpdateStatus?: (poId: string, newStatus: string) => void;
}

export function PODetail({ data, onUpdateStatus }: PODetailProps) {
    const [showLogisticsDialog, setShowLogisticsDialog] = useState(false);
    const [showQuoteUpload, setShowQuoteUpload] = useState(false);

    const statusSteps = data.type === 'FABRIC' ? [
        { key: 'DRAFT', label: '草稿', icon: FileText },
        { key: 'IN_PRODUCTION', label: '采购中', icon: Package },
        { key: 'DELIVERED', label: '已到货', icon: Truck },
        { key: 'STOCKED', label: '已入库', icon: CheckCircle },
    ] : [
        { key: 'DRAFT', label: '草稿', icon: FileText },
        { key: 'IN_PRODUCTION', label: '生产中', icon: Package },
        { key: 'READY', label: '备货完成', icon: Clock },
        { key: 'SHIPPED', label: '已发货', icon: Truck },
        { key: 'DELIVERED', label: '已到货', icon: CheckCircle },
    ];

    const getCurrentStepIndex = () => {
        return statusSteps.findIndex(step => step.key === data.status);
    };

    // 使用 useCallback 稳定回调引用，避免子组件重渲染
    const handleStatusChange = useCallback((newStatus: string) => {
        onUpdateStatus?.(data.id, newStatus);
    }, [onUpdateStatus, data.id]);

    const handleConfirmOrder = useCallback(() => handleStatusChange('IN_PRODUCTION'), [handleStatusChange]);
    const handleMarkReady = useCallback(() => handleStatusChange('READY'), [handleStatusChange]);
    const handleConfirmDelivered = useCallback(() => handleStatusChange('DELIVERED'), [handleStatusChange]);
    const handleOpenLogistics = useCallback(() => setShowLogisticsDialog(true), []);
    const handleOpenQuoteUpload = useCallback(() => setShowQuoteUpload(true), []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">采购单详情</h1>
                    <p className="text-muted-foreground">{data.poNo}</p>
                </div>
                <div className="flex gap-2">
                    {data.status === 'DRAFT' && (
                        <Button onClick={handleConfirmOrder}>
                            确认下单
                        </Button>
                    )}
                    {data.status === 'IN_PRODUCTION' && (
                        <Button onClick={handleMarkReady}>
                            备货完成
                        </Button>
                    )}
                    {data.status === 'READY' && (
                        <Button onClick={handleOpenLogistics}>
                            <Truck className="mr-2 h-4 w-4" />
                            填写物流
                        </Button>
                    )}
                    {data.status === 'SHIPPED' && (
                        <Button variant="outline" onClick={handleConfirmDelivered}>
                            确认到货
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>状态进度</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        {statusSteps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isActive = index <= getCurrentStepIndex();
                            const isCurrent = index === getCurrentStepIndex();

                            return (
                                <div key={step.key} className="flex flex-col items-center flex-1">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                        } ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                                        <StepIcon className="h-5 w-5" />
                                    </div>
                                    <span className={`text-xs mt-2 ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                                        {step.label}
                                    </span>
                                    {index < statusSteps.length - 1 && (
                                        <div className={`absolute top-5 left-1/2 w-full h-0.5 ${index < getCurrentStepIndex() ? 'bg-primary' : 'bg-muted'
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>基础信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-muted-foreground">采购单号</label>
                                <p className="font-medium">{data.poNo}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">关联订单</label>
                                <p className="font-medium">{data.orderNo || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">供应商</label>
                                <p className="font-medium">{data.supplierName}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">类型</label>
                                <Badge variant="outline">
                                    {data.type === 'FINISHED' ? '成品采购' :
                                        data.type === 'FABRIC' ? '面料采购' : '内部备货'}
                                </Badge>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">采购成本</label>
                                <p className="font-medium">¥{data.totalAmount}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">付款状态</label>
                                <Badge variant={data.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                                    {data.paymentStatus === 'PAID' ? '已付款' :
                                        data.paymentStatus === 'PARTIAL' ? '部分付款' : '待付款'}
                                </Badge>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <div>
                                <label className="text-sm text-muted-foreground">外部单号</label>
                                <Input
                                    defaultValue={data.externalPoNo || ''}
                                    placeholder="工厂方单号"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">备注</label>
                                <Textarea
                                    defaultValue={data.remark || ''}
                                    placeholder="备注信息"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>供应商确认</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground">供应商确认截图</label>
                            {data.supplierQuoteImg ? (
                                <div className="mt-2 relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={data.supplierQuoteImg}
                                        alt="供应商确认截图"
                                        className="w-full h-40 object-cover rounded-md"
                                    />
                                </div>
                            ) : (
                                <div className="mt-2 border-2 border-dashed rounded-md p-8 text-center">
                                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        暂无确认截图
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        onClick={() => setShowQuoteUpload(true)}
                                    >
                                        上传截图
                                    </Button>
                                </div>
                            )}
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-muted-foreground">发送方式</label>
                                <p className="font-medium">{data.sentMethod || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">发送时间</label>
                                <p className="font-medium">
                                    {data.sentAt ? format(new Date(data.sentAt), 'yyyy-MM-dd HH:mm') : '-'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">生产完成时间</label>
                                <p className="font-medium">
                                    {data.producedAt ? format(new Date(data.producedAt), 'yyyy-MM-dd HH:mm') : '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {data.status === 'SHIPPED' && (
                <Card>
                    <CardHeader>
                        <CardTitle>物流信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm text-muted-foreground">物流公司</label>
                                <p className="font-medium">{data.logisticsCompany}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">物流单号</label>
                                <p className="font-medium">{data.logisticsNo}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">发货时间</label>
                                <p className="font-medium">
                                    {data.shippedAt ? format(new Date(data.shippedAt), 'yyyy-MM-dd HH:mm') : '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>商品明细</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>商品名称</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>品类</TableHead>
                                <TableHead>规格</TableHead>
                                <TableHead>成本单价</TableHead>
                                <TableHead>数量</TableHead>
                                <TableHead>成本小计</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.items?.map((item: PurchaseOrderItem) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell>{item.productSku || '-'}</TableCell>
                                    <TableCell>{item.category || '-'}</TableCell>
                                    <TableCell>
                                        {item.width && item.height ? `${item.width} × ${item.height}` : '-'}
                                    </TableCell>
                                    <TableCell>¥{item.unitPrice}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell className="font-medium">¥{item.subtotal}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Tabs defaultValue="logs">
                <TabsList>
                    <TabsTrigger value="logs">操作日志</TabsTrigger>
                </TabsList>
                <TabsContent value="logs">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {data.auditLogs?.map((log: PurchaseOrderAuditLog, index: number) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                            {index < (data.auditLogs?.length || 0) - 1 && (
                                                <div className="w-0.5 flex-1 bg-muted" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{log.action}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {log.createdBy} · {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm')}
                                            </p>
                                            {log.changes && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {JSON.stringify(log.changes)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {(!data.auditLogs || data.auditLogs.length === 0) && (
                                    <p className="text-center text-muted-foreground">暂无操作日志</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <AddLogisticsDialog
                poId={data.id}
                open={showLogisticsDialog}
                onClose={() => setShowLogisticsDialog(false)}
            />
        </div>
    );
}