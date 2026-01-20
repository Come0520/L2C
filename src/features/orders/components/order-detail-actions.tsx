'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/ui/button';
import Download from 'lucide-react/dist/esm/icons/download';
import Printer from 'lucide-react/dist/esm/icons/printer';
import SplitSquareVertical from 'lucide-react/dist/esm/icons/split-square-vertical';
import Truck from 'lucide-react/dist/esm/icons/truck';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { toast } from 'sonner';
import {
    confirmInstallationAction,
    requestCustomerConfirmationAction,
    customerAcceptAction,
    customerRejectAction
} from '../actions/orders';
import { useRouter } from 'next/navigation';
import { ChangeOrderDialog } from '@/features/orders/components/change-order-dialog';
import { SplitOrderDialog } from '@/features/orders/components/split-order-dialog';
import { DeliveryRequestDialog } from '@/features/orders/components/delivery-request-dialog';
import { CancelOrderDialog } from '@/features/orders/components/cancel-order-dialog';
import FileEdit from 'lucide-react/dist/esm/icons/file-edit';

interface OrderDetailActionsProps {
    order: {
        id: string;
        orderNo?: string;
        status: string;
        items?: Array<{
            id: string;
            productName: string;
            quantity: string;
            unitPrice: string;
            subtotal: string;
            supplierId?: string;
            poId?: string;
        }>;
    };
    suppliers?: Array<{ id: string; name: string }>;
}

export function OrderDetailActions({ order, suppliers = [] }: OrderDetailActionsProps) {
    const [splitDialogOpen, setSplitDialogOpen] = useState(false);
    const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);

    const handleSplit = () => {
        setSplitDialogOpen(true);
    };

    const handleDelivery = () => {
        setDeliveryDialogOpen(true);
    };

    const router = useRouter();

    const handleConfirmInstall = async () => {
        try {
            await confirmInstallationAction(order.id);
            toast.success('安装已确认完成');
            router.refresh();
        } catch { toast.error('操作失败'); }
    };

    const handleRequestConfirmation = async () => {
        try {
            await requestCustomerConfirmationAction(order.id);
            toast.success('已通知客户验收');
            router.refresh();
        } catch { toast.error('操作失败'); }
    };

    const handleAccept = async () => {
        try {
            await customerAcceptAction(order.id);
            toast.success('订单已验收完成');
            router.refresh();
        } catch { toast.error('操作失败'); }
    };

    // Simple reject for now, ideally a dialog
    const handleReject = async () => {
        const reason = prompt('请输入驳回原因:');
        if (!reason) return;
        try {
            await customerRejectAction(order.id, reason);
            toast.success('已驳回验收');
            router.refresh();
        } catch { toast.error('操作失败'); }
    };

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" /> 打印
            </Button>
            <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> 导出
            </Button>

            {order.status === 'PENDING_PO' && (
                <Button size="sm" onClick={handleSplit}>
                    <SplitSquareVertical className="h-4 w-4 mr-2" /> 生成采购单
                </Button>
            )}

            {order.status === 'PENDING_DELIVERY' && (
                <Button size="sm" onClick={handleDelivery}>
                    <Truck className="h-4 w-4 mr-2" /> 申请发货
                </Button>
            )}

            {order.status === 'PENDING_INSTALL' && (
                <Button size="sm" onClick={handleConfirmInstall}>
                    <CheckCircle className="h-4 w-4 mr-2" /> 确认安装完成
                </Button>
            )}

            {order.status === 'INSTALLATION_COMPLETED' && (
                <Button size="sm" onClick={handleRequestConfirmation} variant="secondary">
                    <CheckCircle className="h-4 w-4 mr-2" /> 通知客户验收
                </Button>
            )}

            {order.status === 'PENDING_CONFIRMATION' && (
                <>
                    <Button size="sm" variant="default" onClick={handleAccept} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" /> 确认验收
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleReject}>
                        <XCircle className="h-4 w-4 mr-2" /> 驳回
                    </Button>
                </>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <div className="px-2 py-1.5 outline-none">
                        <ChangeOrderDialog
                            orderId={order.id}
                            trigger={
                                <div className="relative flex select-none items-center rounded-sm text-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer p-1">
                                    <FileEdit className="mr-2 h-4 w-4" />
                                    <span>发起变更</span>
                                </div>
                            }
                        />
                    </div>
                    <DropdownMenuItem>编辑订单</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* 撤单按钮 */}
            <CancelOrderDialog
                orderId={order.id}
                orderNo={order.orderNo || order.id}
                orderStatus={order.status}
                onSuccess={() => router.refresh()}
            />

            {/* 拆单对话框 */}
            <SplitOrderDialog
                open={splitDialogOpen}
                onOpenChange={setSplitDialogOpen}
                orderId={order.id}
                orderItems={order.items || []}
                suppliers={suppliers}
            />

            {/* 发货申请对话框 */}
            <DeliveryRequestDialog
                open={deliveryDialogOpen}
                onOpenChange={setDeliveryDialogOpen}
                orderId={order.id}
            />
        </div>
    );
}
