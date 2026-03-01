import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { db } from '@/shared/api/db';
import { approvalTasks } from '@/shared/api/schema';
import { desc } from 'drizzle-orm';
import { Badge } from '@/shared/ui/badge';

export async function ApApprovalHistory({
  entityId,
  entityType,
}: {
  entityId: string;
  entityType: string;
}) {
  const approval = await db.query.approvals.findFirst({
    // entityType 存储为字符串，直接传入进行比较
    where: (t, { eq, and }) => and(eq(t.entityId, entityId), eq(t.entityType, entityType)),
    with: {
      tasks: {
        with: {
          approver: true,
        },
        orderBy: [desc(approvalTasks.createdAt)],
      },
    },
  });

  if (!approval) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>审批记录</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">暂无审批记录</p>
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
        <div className="relative space-y-4">
          {/* Vertical Line */}
          <div className="bg-muted absolute top-2 bottom-2 left-2 w-px"></div>

          {approval.tasks.map((task) => (
            <div key={task.id} className="relative pl-6">
              <div
                className={`absolute top-1.5 left-0 h-4 w-4 rounded-full border-2 ${
                  task.status === 'APPROVED'
                    ? 'border-green-500 bg-green-500'
                    : task.status === 'REJECTED'
                      ? 'border-red-500 bg-red-500'
                      : 'bg-background border-muted'
                }`}
              ></div>

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{task.approver?.name || '未知审批人'}</p>
                  <p className="text-muted-foreground text-xs">
                    {task.actionAt ? new Date(task.actionAt).toLocaleString() : '等待审批...'}
                  </p>
                  {task.comment && (
                    <p className="bg-muted/50 mt-1 rounded p-2 text-sm text-zinc-600">
                      {task.comment}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {task.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
