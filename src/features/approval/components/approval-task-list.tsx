'use client';

import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

import { CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export function ApprovalTaskList({
    tasks,
    isPending
}: {
    tasks: Array<any>;
    isPending: boolean;
}) {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                {isPending ? '暂无待处理任务' : '暂无已处理记录'}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {tasks.map((task) => (
                <TaskCard key={task.id} task={task} isPending={isPending} />
            ))}
        </div>
    );
}

function TaskCard({ task, isPending }: { task: any; isPending: boolean }) {
    const statusIcons: Record<string, React.ReactNode> = {
        'PENDING': <Clock className="w-4 h-4 text-amber-500" />,
        'APPROVED': <CheckCircle2 className="w-4 h-4 text-green-500" />,
        'REJECTED': <XCircle className="w-4 h-4 text-red-500" />,
        'CANCELED': <XCircle className="w-4 h-4 text-gray-400" />,
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{task.approval.entityType}</Badge>
                            <span className="text-sm font-semibold">{task.approval.flow?.name || '未知审批流'}</span>
                        </div>
                        <h3 className="font-medium text-lg">{task.node.name}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge variant={isPending ? "secondary" : "default"}>
                            <div className="flex items-center gap-1">
                                {statusIcons[task.status || 'PENDING'] || <Clock className="w-4 h-4" />}
                                {task.status === 'PENDING' ? '待审批' :
                                    task.status === 'APPROVED' ? '已通过' :
                                        task.status === 'REJECTED' ? '已驳回' : '已取消'}
                            </div>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            {task.createdAt ? format(new Date(task.createdAt), 'MM-dd HH:mm') : '-'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 py-2 border-t text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>申请人: {task.approval.requester?.name || '未知'}</span>
                    </div>
                    <Link href={`/approval/tasks/${task.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                            查看详情 <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
