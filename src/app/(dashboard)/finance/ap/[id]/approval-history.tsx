
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { db } from '@/shared/api/db';
import { approvalTasks } from '@/shared/api/schema';
import { desc } from 'drizzle-orm';
import { Badge } from '@/shared/ui/badge';

export async function ApApprovalHistory({ entityId, entityType }: { entityId: string; entityType: string }) {
    const approval = await db.query.approvals.findFirst({
        where: (t, { eq, and }) => and(eq(t.entityId, entityId), eq(t.entityType, entityType as any)),
        with: {
            tasks: {
                with: {
                    approver: true
                },
                orderBy: [desc(approvalTasks.createdAt)]
            }
        }
    });

    if (!approval) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>审批记录</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">暂无审批记录</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>审批流程</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-muted"></div>

                    {approval.tasks.map((task: any) => (
                        <div key={task.id} className="relative pl-6">
                            <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${task.status === 'APPROVED' ? 'bg-green-500 border-green-500' :
                                task.status === 'REJECTED' ? 'bg-red-500 border-red-500' :
                                    'bg-background border-muted'
                                }`}></div>

                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium">{task.approver?.name || '未知审批人'}</p>
                                    <p className="text-xs text-muted-foreground">{task.actionAt ? new Date(task.actionAt).toLocaleString() : '等待审批...'}</p>
                                    {task.comment && (
                                        <p className="text-sm mt-1 bg-muted/50 p-2 rounded text-zinc-600">{task.comment}</p>
                                    )}
                                </div>
                                <Badge variant="outline" className="text-xs">{task.status}</Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
