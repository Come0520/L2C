'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { Check, X, Loader2 } from 'lucide-react';
import { processApproval } from '../actions/processing';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ApprovalProgressSteps } from './approval-progress-steps';
import { AddApproverDialog } from './add-approver-dialog';

interface Task {
    // ... (existing properties)
    id: string;
    approver?: { name: string | null } | null;
    status: string | null;
    nodeId: string | null;
    node: { name: string } | null;
    approval: {
        id: string;
        flow: { name: string } | null;
        requester?: { name: string | null } | null; // Made optional based on usage
        createdAt: Date | null;
        entityType: string;
        entityId: string;
        comment?: string;
        currentNodeId: string | null;
        status: string; // Flow general status usually not null if default, but let's check. 
        tasks: Array<{ id: string; nodeId: string | null; status: string | null; approver?: { name: string | null } | null; actionAt?: Date | null; comment?: string | null }>;
    };
}

export function ApprovalTaskDetails({
    task,
    flowNodes
}: {
    task: Task;
    flowNodes: Array<{ id: string; name: string; sortOrder: number | null }>;
}) {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleAction = async (action: 'APPROVE' | 'REJECT') => {
        setIsSubmitting(true);
        try {
            const result = await processApproval({
                taskId: task.id,
                action,
                comment
            });

            if (result.success) {
                toast.success(action === 'APPROVE' ? '已核准' : '已驳回');
                router.refresh();
                router.push('/workflow/approvals');
            } else {
                toast.error(result.error || '处理失败');
            }
        } catch (err: any) {
            toast.error(err.message || '系统错误');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>审批详情</span>
                            <Badge variant="outline">{task.approval.flow?.name || '未知审批流'}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <p className="text-muted-foreground">申请人</p>
                                <p className="font-medium">{task.approval.requester?.name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground">申请时间</p>
                                <p className="font-medium">{task.approval.createdAt ? new Date(task.approval.createdAt).toLocaleString() : '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground">关联实体</p>
                                <p className="font-medium">{task.approval.entityType} ({task.approval.entityId})</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground">当前环节</p>
                                <p className="font-medium text-primary">{task.node?.name || '未知环节'}</p>
                            </div>
                        </div>

                        {task.approval.comment && (
                            <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
                                <p className="text-xs text-muted-foreground mb-1">申请备注</p>
                                <p className="text-sm">{task.approval.comment}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Approval Form */}
                {task.status === 'PENDING' && (
                    <Card className="border-primary/50 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>处理意见</CardTitle>
                            <AddApproverDialog taskId={task.id} onComplete={() => router.refresh()} />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="请输入核准或驳回的详细建议..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={4}
                            />
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    className="flex-1 min-w-[140px] h-12 text-lg font-bold bg-green-600 hover:bg-green-700"
                                    onClick={() => handleAction('APPROVE')}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Check className="mr-2" />}
                                    核准通过
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1 min-w-[140px] h-12 text-lg font-bold"
                                    onClick={() => handleAction('REJECT')}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <X className="mr-2" />}
                                    驳回申请
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Sidebar: Progress */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>流转路径</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ApprovalProgressSteps
                            nodes={flowNodes}
                            tasks={task.approval.tasks}
                            currentNodeId={task.approval.currentNodeId}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
