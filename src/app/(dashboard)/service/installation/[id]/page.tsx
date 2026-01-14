import { notFound } from 'next/navigation';
import { getInstallTaskById, getAvailableWorkers } from '@/features/service/installation/actions';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { InstallDispatchDialog } from '@/features/service/installation/components/install-dispatch-dialog';
import { SubmitInstallCompletionDialog } from '@/features/service/installation/components/submit-completion-dialog';
import { ConfirmInstallDialog, RejectInstallDialog } from '@/features/service/installation/components/confirm-reject-dialogs';
import { Calendar, User, MapPin, Package, Star, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

const statusMap = {
    PENDING: { label: '待分配', color: 'bg-gray-500' },
    DISPATCHED: { label: '已分配', color: 'bg-blue-500' },
    PENDING_VISIT: { label: '待上门', color: 'bg-yellow-500' },
    PENDING_CONFIRM: { label: '待验收', color: 'bg-orange-500' },
    COMPLETED: { label: '已完成', color: 'bg-green-500' },
    CANCELLED: { label: '已取消', color: 'bg-red-500' },
};

export default async function InstallTaskDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await getInstallTaskById({ id });

    if (!result.success || !result.data) {
        notFound();
    }

    const task = result.data;
    const workerRes = await getAvailableWorkers({});
    const workers = workerRes.success ? (workerRes.data || []) : [];
    const statusInfo = statusMap[task.status as keyof typeof statusMap] || statusMap.PENDING;

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">安装任务详情</h1>
                    <p className="text-muted-foreground mt-1">
                        {task.taskNo} - {task.order?.orderNo}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                </div>
            </div>

            {/* 基础信息卡片 */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader title="客户信息" />
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{task.customer?.name || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{task.customer?.defaultAddress || '-'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="任务信息" />
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>安装师: {task.worker?.name || '未分配'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                                预约日期: {task.scheduledDate || '未设置'}
                            </span>
                        </div>
                        {task.laborFee && (
                            <div className="flex items-center gap-2 text-sm">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span>预估工费: ¥{task.laborFee}</span>
                            </div>
                        )}
                        {task.actualLaborFee && (
                            <div className="flex items-center gap-2 text-sm">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">实际工费: ¥{task.actualLaborFee}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>


            {/* 安装明细 */}
            {task.order?.quote?.items && task.order.quote.items.length > 0 && (
                <Card>
                    <CardHeader title="安装明细" description={`共 ${task.order.quote.items.length} 项`} />
                    <CardContent>
                        <div className="space-y-2">
                            {task.order.quote.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div>
                                        <p className="font-medium">{item.productName}</p>
                                        <p className="text-sm text-muted-foreground">数量: {item.quantity}</p>
                                    </div>
                                    <Badge variant="secondary">
                                        待安装
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 评价信息 */}
            {task.rating && (
                <Card>
                    <CardHeader title="客户评价" icon={<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />} />
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-5 w-5 ${star <= task.rating!
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>
                            {task.ratingComment && (
                                <p className="text-sm text-muted-foreground">{task.ratingComment}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 操作按钮 */}
            <Card>
                <CardHeader title="操作" />
                <CardContent className="flex flex-wrap gap-2">
                    {task.status === 'PENDING_DISPATCH' && (
                        <InstallDispatchDialog
                            taskId={task.id}
                            workers={workers}
                            trigger={<button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">指派安装师</button>}
                        />
                    )}

                    {(task.status === 'DISPATCHING' || task.status === 'PENDING_VISIT') && (
                        <SubmitInstallCompletionDialog
                            taskId={task.id}
                            trigger={<button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">提交完工</button>}
                        />
                    )}

                    {task.status === 'PENDING_CONFIRM' && (
                        <>
                            <ConfirmInstallDialog
                                taskId={task.id}
                                estimatedFee={task.laborFee ? Number(task.laborFee) : undefined}
                            />
                            <RejectInstallDialog taskId={task.id} />
                        </>
                    )}
                </CardContent>
            </Card>

            {/* 备注/日志 */}
            {task.remark && (
                <Card>
                    <CardHeader title="备注/日志" icon={<FileText className="h-4 w-4" />} />
                    <CardContent>
                        <pre className="text-sm whitespace-pre-wrap text-muted-foreground">{task.remark}</pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
