'use client';

import { Badge } from '@/shared/ui/status-badge';
import { cn } from '@/shared/utils';

const statusMap: Record<string, { label: string; className: string }> = {
    'PENDING_PO': { label: '待下单', className: 'glass-step-inactive text-muted-foreground' },
    'IN_PRODUCTION': { label: '生产中', className: 'glass-alert-info' },
    'PENDING_DELIVERY': { label: '待发货', className: 'glass-alert-warning' },
    'DISPATCHING': { label: '发货中', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20 border' },
    'SHIPPED': { label: '已发货', className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 border' },
    'PENDING_INSTALL': { label: '待安装', className: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 border' },
    'COMPLETED': { label: '已完成', className: 'glass-alert-success' },
    'CLOSED': { label: '已关闭', className: 'glass-step-inactive text-muted-foreground opacity-75' },
    'CANCELLED': { label: '已取消', className: 'glass-alert-error' },
    'DRAFT': { label: '草稿', className: 'bg-muted/30 text-muted-foreground border-border border' },
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
