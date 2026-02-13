'use client';

import React from 'react';
import { cn } from '@/shared/utils';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Circle from 'lucide-react/dist/esm/icons/circle';
import Clock from 'lucide-react/dist/esm/icons/clock';

const steps = [
    { status: 'DRAFT', label: '草稿', description: '订单已创建' },
    { status: 'PENDING_PO', label: '待下单', description: '等待拆分采购单' },
    { status: 'IN_PRODUCTION', label: '生产中', description: '工厂正在生产' },
    { status: 'PENDING_DELIVERY', label: '待发货', description: '产品已入库，待发货' },
    { status: 'SHIPPED', label: '已发货', description: '物流运输中' },
    { status: 'PENDING_INSTALL', label: '待安装', description: '产品已送达，待安装' },
    { status: 'COMPLETED', label: '已完成', description: '订单已交结' },
];

export function OrderTimeline({ currentStatus }: { currentStatus: string }) {
    const currentIndex = steps.findIndex(s => s.status === currentStatus);

    return (
        <div className="space-y-4">
            {steps.map((step, index) => {
                const isCompleted = index < currentIndex || currentStatus === 'COMPLETED';
                const isCurrent = step.status === currentStatus;

                return (
                    <div key={step.status} className="flex gap-4 relative">
                        {index < steps.length - 1 && (
                            <div className={cn(
                                "absolute left-[11px] top-6 bottom-0 w-[2px]",
                                isCompleted ? "bg-primary" : "bg-border"
                            )} />
                        )}
                        <div className="mt-1 relative z-10">
                            {isCompleted ? (
                                <CheckCircle2 className="h-6 w-6 text-primary bg-card rounded-full" />
                            ) : isCurrent ? (
                                <Clock className="h-6 w-6 text-primary bg-card rounded-full" />
                            ) : (
                                <Circle className="h-6 w-6 text-muted bg-card rounded-full" />
                            )}
                        </div>
                        <div className="pb-6">
                            <div className={cn(
                                "font-medium",
                                isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {step.label}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {step.description}
                                {isCurrent && " (当前阶段)"}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
