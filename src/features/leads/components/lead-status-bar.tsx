'use client';

import { cn } from '@/shared/lib/utils';
import { Check } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { restoreLeadAction } from '../actions/restore';

interface LeadStatusBarProps {
    status: string;
    leadId?: string;
    userId?: string;
    tenantId?: string;
}

// 状态顺序：待分配 -> 待跟进 -> 跟进中 -> 已成交 (WON) / 已作废 (VOID) is separate
const STATUS_STEPS = [
    { value: 'PENDING_ASSIGNMENT', label: '待分配' },
    { value: 'PENDING_FOLLOWUP', label: '待跟进' },
    { value: 'FOLLOWING_UP', label: '跟踪中' },
    { value: 'WON', label: '已成交' },
];

function RestoreButton({ leadId, userId, tenantId }: { leadId: string, userId: string, tenantId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleRestore = () => {
        if (!confirm('确定要恢复该线索吗？这将把状态重置为作废前的状态。')) return;

        startTransition(async () => {
            const res = await restoreLeadAction({ id: leadId, reason: '用户手动恢复' }, userId, tenantId);
            if (res.success) {
                toast.success(`线索已恢复，当前状态：${res.targetStatus}`);
            } else {
                toast.error(res.error || '恢复失败');
            }
        });
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className="ml-4 h-8 bg-white/50 hover:bg-white/80 border-red-200 text-red-700 hover:text-red-800"
            onClick={handleRestore}
            disabled={isPending}
        >
            {isPending ? '恢复中...' : '恢复线索'}
        </Button>
    );
}

export function LeadStatusBar({ status, leadId, userId, tenantId }: LeadStatusBarProps) {
    // Determine current step index
    let currentIndex = STATUS_STEPS.findIndex(s => s.value === status);

    // Fallback or handling for VOID/INVALID
    const isVoid = status === 'VOID' || status === 'INVALID';
    if (isVoid) {
        currentIndex = -1;
    }

    return (
        <div className="w-full py-4">
            {isVoid ? (
                <div className="glass-alert-error flex items-center justify-between p-2 text-red-600 rounded-md">
                    <span className="font-medium">当前状态：已作废 ({status === 'VOID' ? '手动作废' : '无效'})</span>
                    {leadId && userId && tenantId && status === 'VOID' && (
                        <RestoreButton leadId={leadId} userId={userId} tenantId={tenantId} />
                    )}
                </div>
            ) : (
                <div className="relative flex justify-between">
                    {/* Line background */}
                    <div className="absolute top-1/2 left-0 w-full h-1 glass-progress-track -translate-y-1/2 z-0" />

                    {/* Steps */}
                    {STATUS_STEPS.map((step, index) => {
                        const isCompleted = index <= currentIndex;
                        const isCurrent = index === currentIndex;

                        return (
                            <div key={step.value} className="relative z-10 flex flex-col items-center px-2">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                                        isCompleted ? "bg-primary border-primary text-primary-foreground" : "glass-step-inactive text-muted-foreground",
                                        isCurrent && "ring-4 ring-primary/20"
                                    )}
                                >
                                    {index < currentIndex ? <Check className="w-4 h-4" /> : (index + 1)}
                                </div>
                                <span className={cn(
                                    "text-xs mt-2 font-medium",
                                    isCompleted ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
