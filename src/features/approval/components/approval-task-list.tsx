'use client';

import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

import { CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Pagination } from '@/shared/ui/pagination';
import { type ApprovalTask } from '../schema';

export function ApprovalTaskList({
  tasks,
  isPending,
  pagination,
}: {
  tasks: ApprovalTask[];
  isPending: boolean;
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}) {
  if (tasks.length === 0) {
    return (
      <div className="text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed py-12 text-center">
        {isPending ? '暂无待处理任务' : '暂无已处理记录'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} isPending={isPending} />
        ))}
      </div>
      {pagination && pagination.totalPages > 1 && (
        <Pagination totalPages={pagination.totalPages} currentPage={pagination.page} />
      )}
    </div>
  );
}

function TaskCard({ task, isPending }: { task: ApprovalTask; isPending: boolean }) {
  const statusIcons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-4 w-4 text-amber-500" />,
    APPROVED: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    REJECTED: <XCircle className="h-4 w-4 text-red-500" />,
    CANCELED: <XCircle className="h-4 w-4 text-gray-400" />,
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{task.approval.entityType}</Badge>
              <span className="text-sm font-semibold">
                {task.approval.flow?.name || '未知审批流'}
              </span>
            </div>
            <h3 className="text-lg font-medium">{task.node.name}</h3>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={isPending ? 'secondary' : 'default'}>
              <div className="flex items-center gap-1">
                {statusIcons[task.status || 'PENDING'] || <Clock className="h-4 w-4" />}
                {task.status === 'PENDING'
                  ? '待审批'
                  : task.status === 'APPROVED'
                    ? '已通过'
                    : task.status === 'REJECTED'
                      ? '已驳回'
                      : '已取消'}
              </div>
            </Badge>
            <span className="text-muted-foreground text-xs">
              {task.createdAt ? format(new Date(task.createdAt), 'MM-dd HH:mm') : '-'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t py-2 text-sm">
          <div className="text-muted-foreground flex items-center gap-2">
            <span>申请人: {task.approval.requester?.name || '未知'}</span>
          </div>
          <Link href={`/approval/tasks/${task.id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              查看详情 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
