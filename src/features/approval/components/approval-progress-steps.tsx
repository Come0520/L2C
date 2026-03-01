'use client';

import { Check, Clock, X, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * 审批进度步骤组件属性
 */
interface ApprovalProgressStepsProps {
  /** 审批流程中的定义节点列表 */
  nodes: Array<{
    id: string;
    name: string;
    sortOrder: number | null;
    approverRole?: string | null;
    approverUserId?: string | null;
  }>;
  /** 已创建的审批任务列表，用于展示每个节点的完成情况 */
  tasks: Array<{
    id: string;
    nodeId: string | null;
    status: string | null;
    approver?: { name: string | null } | null;
    actionAt?: Date | null;
    comment?: string | null;
  }>;
  /** 当前审批流停留的节点 ID */
  currentNodeId: string | null;
}

/**
 * 审批进度步骤组件
 * 展示整个审批流程的节点状态、审批人信息及审批意见
 */
export function ApprovalProgressSteps({ nodes, tasks, currentNodeId }: ApprovalProgressStepsProps) {
  // Sort nodes by order
  const sortedNodes = nodes.toSorted((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (sortedNodes.length === 0) {
    return (
      <div className="text-muted-foreground bg-muted/30 flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
        <Clock className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">暂无审批流程信息</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col space-y-8 py-4">
      {/* Background Line */}
      <div className="bg-muted absolute top-6 bottom-6 left-[19px] w-0.5" />

      {sortedNodes.map((node) => {
        // Find tasks for this node
        const nodeTasks = tasks.filter((t) => t.nodeId === node.id);
        const isCurrent = currentNodeId === node.id;

        // Determine node state
        let state: 'PENDING' | 'CURRENT' | 'APPROVED' | 'REJECTED' | 'CANCELED' = 'PENDING';

        if (nodeTasks.some((t) => t.status === 'REJECTED')) {
          state = 'REJECTED';
        } else if (
          nodeTasks.length > 0 &&
          nodeTasks.every((t) => t.status === 'APPROVED' || t.status === 'CANCELED')
        ) {
          // Check if actually approved (not just skipped)
          state = nodeTasks.some((t) => t.status === 'APPROVED') ? 'APPROVED' : 'CANCELED';
        } else if (isCurrent) {
          state = 'CURRENT';
        }

        const colors = {
          PENDING: 'glass-step-inactive text-muted-foreground',
          CURRENT:
            'bg-primary border-primary text-primary-foreground animate-pulse shadow-[0_0_12px_rgba(24,24,27,0.4)] dark:shadow-[0_0_12px_rgba(250,250,250,0.4)]',
          APPROVED: 'bg-green-500 border-green-500 text-white',
          REJECTED: 'bg-red-500 border-red-500 text-white',
          CANCELED: 'glass-step-inactive', // Cancelled is also inactive style basically
        };

        const icons = {
          PENDING: <Clock className="h-5 w-5" />,
          CURRENT: <AlertCircle className="h-5 w-5" />,
          APPROVED: <Check className="h-5 w-5" />,
          REJECTED: <X className="h-5 w-5" />,
          CANCELED: <X className="h-5 w-5" />,
        };

        return (
          <div key={node.id} className="group relative flex items-start">
            {/* Node Roundel */}
            <div
              className={cn(
                'z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                colors[state]
              )}
            >
              {icons[state]}
            </div>

            {/* Node Info */}
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <h4
                  className={cn(
                    'text-sm font-semibold',
                    state === 'CURRENT' ? 'text-primary' : 'text-zinc-900 dark:text-zinc-100'
                  )}
                >
                  {node.name}
                </h4>
                {state === 'APPROVED' && (
                  <span className="glass-alert-success rounded px-1.5 py-0.5 text-[10px] font-bold text-green-600 uppercase">
                    通过
                  </span>
                )}
                {state === 'REJECTED' && (
                  <span className="glass-alert-error rounded px-1.5 py-0.5 text-[10px] font-bold text-red-600 uppercase">
                    驳回
                  </span>
                )}
              </div>

              {/* Task Details */}
              <div className="mt-1 space-y-2">
                {nodeTasks.length > 0
                  ? nodeTasks.map((task, tid) => (
                      <div
                        key={task.id || tid}
                        className="flex items-center gap-2 text-xs text-zinc-500"
                      >
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {task.approver?.name || '未知审批人'}
                        </span>
                        {task.actionAt && (
                          <span className="text-zinc-400">
                            {new Date(task.actionAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                        {task.comment && (
                          <span className="text-zinc-400 italic">&quot;{task.comment}&quot;</span>
                        )}
                      </div>
                    ))
                  : state === 'PENDING' && (
                      <div className="mt-1 flex flex-col gap-1 text-xs text-zinc-400">
                        <span>等待到达此环节</span>
                        {(node.approverRole || node.approverUserId) && (
                          <span className="w-fit rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500 dark:bg-zinc-800">
                            预计由 {node.approverRole ? `[${node.approverRole}] 角色` : '指定用户'}{' '}
                            处理
                          </span>
                        )}
                      </div>
                    )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
