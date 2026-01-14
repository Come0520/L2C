'use client';

import { Badge } from '@/shared/ui/status-badge';
import { cn } from '@/shared/utils';

const statusMap: Record<string, { label: string; className: string }> = {
    'PENDING_PO': { label: '待下单', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    'IN_PRODUCTION': { label: '生产中', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    'PENDING_DELIVERY': { label: '待发货', className: 'bg-orange-100 text-orange-800 border-orange-200' },
    'DISPATCHING': { label: '发货中', className: 'bg-purple-100 text-purple-800 border-purple-200' },
    'SHIPPED': { label: '已发货', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    'PENDING_INSTALL': { label: '待安装', className: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    'COMPLETED': { label: '已完成', className: 'bg-green-100 text-green-800 border-green-200' },
    'CLOSED': { label: '已关闭', className: 'bg-slate-100 text-slate-800 border-slate-200' },
    'CANCELLED': { label: '已取消', className: 'bg-red-100 text-red-800 border-red-200' },
    'DRAFT': { label: '草稿', className: 'bg-gray-50 text-gray-600 border-gray-100' },
};

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
        <Badge
            variant="outline"
            className={cn(config.className, "font-medium px-2 py-0.5 whitespace-nowrap", className)}
        >
            {config.label}
        </Badge>
    );
}
