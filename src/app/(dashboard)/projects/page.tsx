import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { getInstallTasks } from '@/features/service/actions/install-actions';
import { formatDate } from '@/shared/lib/utils';
import { DispatchDialog } from '@/features/service/components/dispatch-dialog';
import { Truck, Calendar } from 'lucide-react';
import Link from 'next/link';

const STATUS_MAP: Record<string, string> = {
  PENDING_DISPATCH: '待派单',
  PENDING_ACCEPT: '待接单', // or Pending Installer Confirmation
  PENDING_START: '待上门', // Check Enums in schema/enums.ts if unsure, stick to generic for now
  IN_PROGRESS: '施工中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

export const revalidate = 0;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const { status, search } = await searchParams;
  const { data: tasks = [] } = await getInstallTasks({ status, search });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">交付与安装项目</h1>
        <div className="flex gap-2">{/* Search or Create Manual Task if needed */}</div>
      </div>

      <div className="flex items-center space-x-4">
        <Link href="/projects?status=ALL">
          <Button variant={!status || status === 'ALL' ? 'secondary' : 'ghost'} size="sm">
            全部
          </Button>
        </Link>
        <Link href="/projects?status=PENDING_DISPATCH">
          <Button variant={status === 'PENDING_DISPATCH' ? 'secondary' : 'ghost'} size="sm">
            待派单
          </Button>
        </Link>
        <Link href="/projects?status=IN_PROGRESS">
          <Button variant={status === 'IN_PROGRESS' ? 'secondary' : 'ghost'} size="sm">
            施工中
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-medium">任务列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-left text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                  <th className="text-muted-foreground h-12 px-4 align-middle font-medium">
                    任务号
                  </th>
                  <th className="text-muted-foreground h-12 px-4 align-middle font-medium">客户</th>
                  <th className="text-muted-foreground h-12 px-4 align-middle font-medium">状态</th>
                  <th className="text-muted-foreground h-12 px-4 align-middle font-medium">
                    预约时间
                  </th>
                  <th className="text-muted-foreground h-12 px-4 align-middle font-medium">
                    安装师傅
                  </th>
                  <th className="text-muted-foreground h-12 px-4 text-right align-middle font-medium">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {tasks?.map((task: any) => (
                  <tr key={task.id} className="hover:bg-muted/50 border-b transition-colors">
                    <td className="p-4 align-middle font-medium">{task.taskNo}</td>
                    <td className="p-4 align-middle">
                      <div>{task.customerName}</div>
                      <div className="text-muted-foreground text-xs">{task.customerPhone}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge
                        variant={
                          task.status === 'PENDING_DISPATCH'
                            ? 'destructive'
                            : task.status === 'COMPLETED'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {STATUS_MAP[task.status] || task.status}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      {task.scheduledDate ? (
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatDate(task.scheduledDate)}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {task.scheduledTimeSlot}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      {task.installer?.name ? (
                        <div className="flex items-center gap-1">
                          <Truck className="h-3 w-3" /> {task.installer.name}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 text-right align-middle">
                      {task.status === 'PENDING_DISPATCH' ? (
                        <DispatchDialog taskId={task.id} />
                      ) : (
                        <Button variant="ghost" size="sm">
                          查看
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {tasks?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-muted-foreground p-8 text-center">
                      暂无安装任务
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
