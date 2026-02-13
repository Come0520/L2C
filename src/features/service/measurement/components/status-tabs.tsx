'use client';

import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { cn } from '@/shared/lib/utils';

/**
 * 测量任务状态定义
 */
const MEASURE_STATUS_FLOW = [
    { value: 'PENDING', label: '待分配' },
    { value: 'DISPATCHING', label: '分配中' },
    { value: 'PENDING_VISIT', label: '待上门' },
    { value: 'PENDING_CONFIRM', label: '待确认' },
    { value: 'COMPLETED', label: '已完成' },
] as const;

interface MeasureStatusTabsProps {
    currentStatus: string;
    className?: string;
}

/**
 * 测量任务状态 Tabs 组件
 * 
 * 用于详情页展示当前任务状态，高亮当前阶段
 * 仅展示状态进度，不可交互
 */
export function MeasureStatusTabs({ currentStatus, className }: MeasureStatusTabsProps) {
    // 处理特殊状态
    const displayStatus = currentStatus === 'CANCELLED' ? 'CANCELLED' :
        currentStatus === 'PENDING_APPROVAL' ? 'PENDING' :
            currentStatus;

    // 获取当前状态在流程中的索引
    const currentIndex = MEASURE_STATUS_FLOW.findIndex(s => s.value === displayStatus);

    return (
        <div className={cn("space-y-2", className)}>
            <Tabs value={displayStatus} className="w-full">
                <TabsList className="w-full grid grid-cols-5">
                    {MEASURE_STATUS_FLOW.map((status, index) => {
                        const isPast = currentIndex >= 0 && index < currentIndex;
                        const isCurrent = status.value === displayStatus;

                        return (
                            <TabsTrigger
                                key={status.value}
                                value={status.value}
                                disabled
                                className={cn(
                                    "relative",
                                    isPast && "text-muted-foreground",
                                    isCurrent && "font-semibold"
                                )}
                            >
                                {status.label}
                                {/* 已完成标记 */}
                                {isPast && (
                                    <span className="absolute -top-1 -right-1 text-green-500 text-xs">✓</span>
                                )}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </Tabs>

            {/* 已取消状态提示 */}
            {currentStatus === 'CANCELLED' && (
                <p className="text-sm text-destructive text-center">
                    该任务已取消
                </p>
            )}

            {/* 审批中状态提示 */}
            {currentStatus === 'PENDING_APPROVAL' && (
                <p className="text-sm text-orange-500 text-center">
                    该任务正在等待费用审批
                </p>
            )}
        </div>
    );
}

export default MeasureStatusTabs;
