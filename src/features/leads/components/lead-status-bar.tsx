'use client';

import { cn } from '@/shared/lib/utils';
import { Check } from 'lucide-react';

interface LeadStatusBarProps {
    status: string;
}

// 状态顺序：待分配 -> 待跟进 -> 跟进中 -> 已成交 (WON) / 已作废 (VOID) is separate
const STATUS_STEPS = [
    { value: 'PENDING_ASSIGNMENT', label: '待分配' },
    { value: 'PENDING_FOLLOWUP', label: '待跟进' },
    { value: 'FOLLOWING_UP', label: '跟踪中' },
    { value: 'WON', label: '已成交' },
];

export function LeadStatusBar({ status }: LeadStatusBarProps) {
    // Determine current step index
    let currentIndex = STATUS_STEPS.findIndex(s => s.value === status);

    // Fallback or handling for VOID/INVALID
    if (status === 'VOID' || status === 'INVALID') {
        // Only show if it's currently void, maybe as a special state or just don't highlight the progression
        // Requirement implies a linear progression. Void is a termination state.
        // We can treat VOID as a red failed state.
        currentIndex = -1;
    }

    const isVoid = status === 'VOID' || status === 'INVALID';

    return (
        <div className="w-full py-4">
            {isVoid ? (
                <div className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-md border border-red-200">
                    当前状态：已作废 ({status === 'VOID' ? '手动作废' : '无效'})
                </div>
            ) : (
                <div className="relative flex justify-between">
                    {/* Line background */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0" />

                    {/* Steps */}
                    {STATUS_STEPS.map((step, index) => {
                        const isCompleted = index <= currentIndex;
                        const isCurrent = index === currentIndex;

                        return (
                            <div key={step.value} className="relative z-10 flex flex-col items-center bg-white px-2">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                                        isCompleted ? "bg-primary border-primary text-primary-foreground" : "bg-white border-gray-300 text-gray-400",
                                        isCurrent && "ring-4 ring-primary/20"
                                    )}
                                >
                                    {index < currentIndex ? <Check className="w-4 h-4" /> : (index + 1)}
                                </div>
                                <span className={cn(
                                    "text-xs mt-2 font-medium",
                                    isCompleted ? "text-primary" : "text-gray-500"
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
