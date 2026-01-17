'use client';

import React from 'react';
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
import { splitOrder, requestDelivery } from '../actions';

interface OrderDetailActionsProps {
    order: any;
    workers?: any[];
}

export function OrderDetailActions({ order }: OrderDetailActionsProps) {
    const handleSplit = async () => {
        toast.info('拆单功能正在处理...');
        // Implement real logic or redirect to split page
    };

    const handleDelivery = async () => {
        try {
            await requestDelivery(order.id);
            toast.success('发货申请已提交');
        } catch {
            toast.error('申请失败');
        }
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

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>编辑订单</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">取消订单</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
