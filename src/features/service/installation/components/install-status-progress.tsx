'use client';

import React from 'react';
import { cn } from '@/shared/lib/utils';
import { Check } from 'lucide-react';

/**
 * 安装任务状态进度条
 * 
 * 展示任务从待分配到完成的流转进度
 */

/**
 * 状态流转步骤定义
 */
const INSTALL_STEPS = [
    { key: 'PENDING_DISPATCH', label: '待分配', order: 1 },
    { key: 'DISPATCHING', label: '分配中', order: 2 },
    { key: 'PENDING_VISIT', label: '待上门', order: 3 },
    { key: 'PENDING_CONFIRM', label: '待验收', order: 4 },
    { key: 'COMPLETED', label: '已完成', order: 5 },
] as const;

/**
 * 获取当前状态的序号
 */
function getStatusOrder(status: string): number {
    const step = INSTALL_STEPS.find((s) => s.key === status);
    return step?.order ?? 0;
}

interface InstallStatusProgressProps {
    currentStatus: string;
    className?: string;
}

export function InstallStatusProgress({ currentStatus, className }: InstallStatusProgressProps) {
    const currentOrder = getStatusOrder(currentStatus);
    const isCancelled = currentStatus === 'CANCELLED';

    return (
        <div className={cn('flex items-center justify-between', className)}>
            {INSTALL_STEPS.map((step, index) => {
                const isCompleted = currentOrder > step.order;
                const isCurrent = step.key === currentStatus;
                const isLast = index === INSTALL_STEPS.length - 1;

                return (
                    <React.Fragment key={step.key}>
                        {/* 步骤圆圈 */}
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                                    isCompleted && 'bg-green-500 text-white',
                                    isCurrent && !isCancelled && 'bg-blue-500 text-white ring-4 ring-blue-100',
                                    !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500',
                                    isCancelled && isCurrent && 'bg-red-500 text-white'
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    step.order
                                )}
                            </div>
                            {/* 步骤标签 */}
                            <span
                                className={cn(
                                    'mt-2 text-xs font-medium',
                                    isCompleted && 'text-green-600',
                                    isCurrent && !isCancelled && 'text-blue-600',
                                    !isCompleted && !isCurrent && 'text-gray-400'
                                )}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* 连接线 */}
                        {!isLast && (
                            <div
                                className={cn(
                                    'flex-1 h-0.5 mx-2',
                                    currentOrder > step.order + 1 && 'bg-green-500',
                                    currentOrder === step.order + 1 && 'bg-gradient-to-r from-green-500 to-gray-200',
                                    currentOrder <= step.order && 'bg-gray-200'
                                )}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

export default InstallStatusProgress;
