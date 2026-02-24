'use client';

import { Check, Clock, X, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * 审批进度步骤组件属性
 */
interface ApprovalProgressStepsProps {
    /** 审批流程中的定义节点列表 */
    nodes: Array<{ id: string; name: string; sortOrder: number | null }>;
    /** 已创建的审批任务列表，用于展示每个节点的完成情况 */
    tasks: Array<{ id: string; nodeId: string | null; status: string | null; approver?: { name: string | null } | null; actionAt?: Date | null; comment?: string | null }>;
    /** 当前审批流停留的节点 ID */
    currentNodeId: string | null;
}

/**
 * 审批进度步骤组件
 * 展示整个审批流程的节点状态、审批人信息及审批意见
 */
export function ApprovalProgressSteps({ nodes, tasks, currentNodeId }: ApprovalProgressStepsProps) {
    // Sort nodes by order
    const sortedNodes = [...nodes].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    if (sortedNodes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/30 rounded-lg border-2 border-dashed">
                <Clock className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">暂无审批流程信息</p>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col space-y-8 py-4">
            {/* Background Line */}
            <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-muted" />

            {sortedNodes.map((node) => {
                // Find tasks for this node
                const nodeTasks = tasks.filter(t => t.nodeId === node.id);
                const isCurrent = currentNodeId === node.id;

                // Determine node state
                let state: 'PENDING' | 'CURRENT' | 'APPROVED' | 'REJECTED' | 'CANCELED' = 'PENDING';

                if (nodeTasks.some(t => t.status === 'REJECTED')) {
                    state = 'REJECTED';
                } else if (nodeTasks.length > 0 && nodeTasks.every(t => t.status === 'APPROVED' || t.status === 'CANCELED')) {
                    // Check if actually approved (not just skipped)
                    state = nodeTasks.some(t => t.status === 'APPROVED') ? 'APPROVED' : 'CANCELED';
                } else if (isCurrent) {
                    state = 'CURRENT';
                }

                const colors = {
                    PENDING: 'glass-step-inactive text-muted-foreground',
                    CURRENT: 'bg-primary border-primary text-primary-foreground animate-pulse',
                    APPROVED: 'bg-green-500 border-green-500 text-white',
                    REJECTED: 'bg-red-500 border-red-500 text-white',
                    CANCELED: 'glass-step-inactive', // Cancelled is also inactive style basically
                };

                const icons = {
                    PENDING: <Clock className="w-5 h-5" />,
                    CURRENT: <AlertCircle className="w-5 h-5" />,
                    APPROVED: <Check className="w-5 h-5" />,
                    REJECTED: <X className="w-5 h-5" />,
                    CANCELED: <X className="w-5 h-5" />,
                };

                return (
                    <div key={node.id} className="relative flex items-start group">
                        {/* Node Roundel */}
                        <div className={cn(
                            "z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                            colors[state]
                        )}>
                            {icons[state]}
                        </div>

                        {/* Node Info */}
                        <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                                <h4 className={cn(
                                    "text-sm font-semibold",
                                    state === 'CURRENT' ? 'text-primary' : 'text-zinc-900'
                                )}>
                                    {node.name}
                                </h4>
                                {state === 'APPROVED' && (
                                    <span className="text-[10px] uppercase font-bold text-green-600 glass-alert-success px-1.5 py-0.5 rounded">通过</span>
                                )}
                                {state === 'REJECTED' && (
                                    <span className="text-[10px] uppercase font-bold text-red-600 glass-alert-error px-1.5 py-0.5 rounded">驳回</span>
                                )}
                            </div>

                            {/* Task Details */}
                            <div className="mt-1 space-y-2">
                                {nodeTasks.length > 0 ? (
                                    nodeTasks.map((task, tid) => (
                                        <div key={task.id || tid} className="text-xs text-zinc-500 flex items-center gap-2">
                                            <span className="font-medium text-zinc-700">{task.approver?.name || '未知审批人'}</span>
                                            {task.actionAt && (
                                                <span className="text-zinc-400">
                                                    {new Date(task.actionAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                            {task.comment && (
                                                <span className="italic text-zinc-400">&quot;{task.comment}&quot;</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    state === 'PENDING' && <div className="text-xs text-zinc-400">等待到达此环节</div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
