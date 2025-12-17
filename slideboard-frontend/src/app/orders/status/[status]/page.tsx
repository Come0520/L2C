'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';

import { SpotlightCard, SpotlightCardHeader, SpotlightCardTitle, SpotlightCardContent } from '@/components/ui/spotlight-card';
import { ORDER_STATUS_CONFIG } from '@/lib/state-machine/order-state-machine';

// 定义状态分类
interface StatusCategory {
    label: string;
    statuses: string[];
}

const statusCategories: StatusCategory[] = [
    {
        label: '测量阶段',
        statuses: [
            'pending-survey',
            'surveying-pending-assignment',
            'surveying-assigning',
            'surveying-pending-visit',
            'surveying-pending-confirmation',
            'plan-pending-confirmation',
        ],
    },
    {
        label: '订单阶段',
        statuses: [
            'draft-sign',
            'pending-push',
            'pending-place-order',
            'in-production',
            'stock-ready',
            'pending-shipment',
        ],
    },
    {
        label: '安装阶段',
        statuses: [
            'installing-pending-assignment',
            'installing-assigning',
            'installing-pending-visit',
            'installing-pending-confirmation',
        ],
    },
    {
        label: '结算阶段',
        statuses: [
            'pending-reconciliation',
            'pending-invoice',
            'pending-payment',
        ],
    },
    {
        label: '已结束',
        statuses: ['completed', 'cancelled', 'exception'],
    },
];

// 根据状态获取分类
function getCategoryByStatus(status: string): string {
    for (const category of statusCategories) {
        if (category.statuses.includes(status)) {
            return category.label;
        }
    }
    return '其他';
}

function StatusTabButton({
    statusKey,
    isActive,
    onClick
}: {
    statusKey: string;
    isActive: boolean;
    onClick: () => void;
}) {
    const config = ORDER_STATUS_CONFIG[statusKey];
    const label = config?.label || statusKey;

    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive
                    ? 'bg-theme-primary text-white'
                    : 'bg-theme-bg-secondary text-theme-text-secondary hover:bg-theme-bg-tertiary hover:text-theme-text-primary'
                }`}
        >
            {label}
        </button>
    );
}

function OrderListPlaceholder({ status }: { status: string }) {
    const config = ORDER_STATUS_CONFIG[status];
    const statusLabel = config?.label || status;

    return (
        <div className="text-center py-12 text-theme-text-secondary">
            <p className="text-lg">"{statusLabel}" 状态的订单列表</p>
            <p className="text-sm mt-2">暂无数据或正在开发中...</p>
        </div>
    );
}

export default function OrderStatusPage() {
    const params = useParams();
    const status = params.status as string;

    const config = ORDER_STATUS_CONFIG[status];
    const statusLabel = config?.label || status;
    const categoryLabel = getCategoryByStatus(status);

    // 获取当前分类的所有状态
    const currentCategory = statusCategories.find(cat => cat.statuses.includes(status));
    const relatedStatuses = currentCategory?.statuses || [status];

    return (
        <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary p-6 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* 页面标题 */}
                <div>
                    <h1 className="text-3xl font-bold text-theme-text-primary tracking-tight">
                        {categoryLabel}
                    </h1>
                    <p className="text-theme-text-secondary mt-1">
                        按状态管理订单流程
                    </p>
                </div>

                {/* 状态标签页 */}
                <div className="flex flex-wrap gap-2">
                    {relatedStatuses.map((s) => (
                        <StatusTabButton
                            key={s}
                            statusKey={s}
                            isActive={s === status}
                            onClick={() => {
                                window.location.href = `/orders/status/${s}`;
                            }}
                        />
                    ))}
                </div>

                {/* 订单列表 */}
                <SpotlightCard className="bg-theme-bg-secondary border-theme-border">
                    <SpotlightCardHeader>
                        <SpotlightCardTitle>{statusLabel}</SpotlightCardTitle>
                    </SpotlightCardHeader>
                    <SpotlightCardContent>
                        <Suspense fallback={<div>加载中...</div>}>
                            <OrderListPlaceholder status={status} />
                        </Suspense>
                    </SpotlightCardContent>
                </SpotlightCard>
            </div>
        </div>
    );
}
