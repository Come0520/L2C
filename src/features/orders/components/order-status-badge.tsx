'use client';

import { Badge } from '@/shared/ui/status-badge';
import { cn } from '@/shared/utils';

const statusMap: Record<string, { label: string; className: string }> = {
    'DRAFT': { label: '草稿', className: 'bg-muted/30 text-muted-foreground border-border border' },
    'PENDING_MEASURE': { label: '待测量', className: 'bg-sky-500/10 text-sky-600 border-sky-500/20 border' },
    'MEASURED': { label: '已测量', className: 'bg-teal-500/10 text-teal-600 border-teal-500/20 border' },
    'QUOTED': { label: '已报价', className: 'bg-violet-500/10 text-violet-600 border-violet-500/20 border' },
    'SIGNED': { label: '已签约', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 border' },
    'PAID': { label: '已付款', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 border' },
    'PENDING_PO': { label: '待下单', className: 'glass-step-inactive text-muted-foreground' },
    'PENDING_PRODUCTION': { label: '待排产', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 border' },
    'PENDING_APPROVAL': { label: '待审批', className: 'bg-orange-500/10 text-orange-600 border-orange-500/20 border' },
    'IN_PRODUCTION': { label: '生产中', className: 'glass-alert-info' },
    'PENDING_DELIVERY': { label: '待发货', className: 'glass-alert-warning' },
    'PENDING_INSTALL': { label: '待安装', className: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 border' },
    'INSTALLATION_COMPLETED': { label: '安装完成', className: 'bg-lime-500/10 text-lime-600 border-lime-500/20 border' },
    'PENDING_CONFIRMATION': { label: '待验收', className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 border' },
    'INSTALLATION_REJECTED': { label: '安装驳回', className: 'bg-rose-500/10 text-rose-600 border-rose-500/20 border' },
    'COMPLETED': { label: '已完成', className: 'glass-alert-success' },
    'HALTED': { label: '已叫停', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 border' },
    'PAUSED': { label: '已暂停', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 border' },
    'CANCELLED': { label: '已取消', className: 'glass-alert-error' },
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
