import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { getInstallTasks } from '@/features/service/actions/install-actions';
import { formatDate } from '@/shared/lib/utils';
import { DispatchDialog } from '@/features/service/components/dispatch-dialog';
import { Truck, Calendar } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import Link from 'next/link';

const STATUS_MAP: Record<string, string> = {
    'PENDING_DISPATCH': '待派单',
    'PENDING_ACCEPT': '待接单', // or Pending Installer Confirmation
    'PENDING_START': '待上门', // Check Enums in schema/enums.ts if unsure, stick to generic for now
    'IN_PROGRESS': '施工中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
};

export const revalidate = 0;

export default async function ProjectsPage({
    searchParams
}: {
    searchParams: Promise<{ status?: string; search?: string }>
}) {
    const { status, search } = await searchParams;
    const { data: tasks = [] } = await getInstallTasks({ status, search });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">交付与安装项目</h1>
                <div className="flex gap-2">
                    {/* Search or Create Manual Task if needed */}
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <Link href="/projects?status=ALL">
                    <Button variant={!status || status === 'ALL' ? 'secondary' : 'ghost'} size="sm">全部</Button>
                </Link>
                <Link href="/projects?status=PENDING_DISPATCH">
                    <Button variant={status === 'PENDING_DISPATCH' ? 'secondary' : 'ghost'} size="sm">待派单</Button>
                </Link>
                <Link href="/projects?status=IN_PROGRESS">
                    <Button variant={status === 'IN_PROGRESS' ? 'secondary' : 'ghost'} size="sm">施工中</Button>
                </Link>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-base font-medium">任务列表</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">任务号</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">客户</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">状态</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">预约时间</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">安装师傅</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {tasks?.map((task: any) => (
                                    <tr key={task.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{task.taskNo}</td>
                                        <td className="p-4 align-middle">
                                            <div>{task.customerName}</div>
                                            <div className="text-xs text-muted-foreground">{task.customerPhone}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Badge variant={
                                                task.status === 'PENDING_DISPATCH' ? 'destructive' :
                                                    task.status === 'COMPLETED' ? 'secondary' : 'outline'
                                            }>
                                                {STATUS_MAP[task.status] || task.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle">
                                            {task.scheduledDate ? (
                                                <div className="flex flex-col">
                                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(task.scheduledDate)}</span>
                                                    <span className="text-xs text-muted-foreground">{task.scheduledTimeSlot}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 align-middle">
                                            {task.installer?.name ? (
                                                <div className="flex items-center gap-1">
                                                    <Truck className="h-3 w-3" /> {task.installer.name}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            {task.status === 'PENDING_DISPATCH' ? (
                                                <DispatchDialog taskId={task.id} />
                                            ) : (
                                                <Button variant="ghost" size="sm">查看</Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {tasks?.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
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
