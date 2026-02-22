'use client';
import { logger } from '@/shared/lib/logger';

import { useOptimistic, useTransition } from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Play, PackageCheck, CheckCircle, Loader2 } from 'lucide-react';
import { updatePoStatus } from '../actions/po-actions';
import { toast } from 'sonner';

interface PoStatusActionsProps {
    poId: string;
    initialStatus: string;
}

const PO_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    'DRAFT': { label: '草稿', className: 'bg-gray-100 text-gray-700' },
    'PENDING_CONFIRMATION': { label: '待确认', className: 'bg-yellow-100 text-yellow-700' },
    'PENDING_PAYMENT': { label: '待付款', className: 'bg-orange-100 text-orange-700' },
    'IN_PRODUCTION': { label: '生产中', className: 'bg-blue-100 text-blue-700' },
    'READY': { label: '备货完成', className: 'bg-indigo-100 text-indigo-700' },
    'SHIPPED': { label: '已发货', className: 'bg-purple-100 text-purple-700' },
    'DELIVERED': { label: '已到货', className: 'bg-orange-100 text-orange-700' },
    'COMPLETED': { label: '已完成', className: 'bg-green-100 text-green-700' },
    'CANCELLED': { label: '已取消', className: 'bg-red-100 text-red-700' },
};

export function PoStatusBadge({ status }: { status: string }) {
    const config = PO_STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100' };
    return <Badge className={config.className}>{config.label}</Badge>;
}

export function PoStatusActions({ poId, initialStatus }: PoStatusActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [optimisticStatus, setOptimisticStatus] = useOptimistic(
        initialStatus,
        (state, newStatus: string) => newStatus
    );

    const handleUpdateStatus = async (newStatus: string) => {
        startTransition(async () => {
            setOptimisticStatus(newStatus);
            try {
                const res = await updatePoStatus({ poId, status: newStatus });
                if (!res.success) {
                    toast.error(res.error || '更新状态失败');
                } else {
                    toast.success('状态已更新');
                }
            } catch (error) {
                toast.error('操作发生错误');
                logger.error(error);
            }
        });
    };

    const isDraft = optimisticStatus === 'DRAFT';
    const isInProduction = optimisticStatus === 'IN_PRODUCTION';
    const isShipped = optimisticStatus === 'SHIPPED';
    const isDelivered = optimisticStatus === 'DELIVERED';

    return (
        <div className="flex items-center gap-4">
            <PoStatusBadge status={optimisticStatus} />

            <div className="flex gap-2">
                {isDraft && (
                    <Button
                        onClick={() => handleUpdateStatus('IN_PRODUCTION')}
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                        确认下单
                    </Button>
                )}

                {isInProduction && (
                    <Button
                        onClick={() => handleUpdateStatus('READY')}
                        disabled={isPending}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PackageCheck className="h-4 w-4 mr-2" />}
                        备货完成
                    </Button>
                )}

                {isShipped && (
                    <Button
                        onClick={() => handleUpdateStatus('DELIVERED')}
                        disabled={isPending}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PackageCheck className="h-4 w-4 mr-2" />}
                        确认到货
                    </Button>
                )}

                {isDelivered && (
                    <Button
                        onClick={() => handleUpdateStatus('COMPLETED')}
                        disabled={isPending}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        完成采购
                    </Button>
                )}
            </div>
        </div>
    );
}
