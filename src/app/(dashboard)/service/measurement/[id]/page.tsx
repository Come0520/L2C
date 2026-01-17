import { notFound } from 'next/navigation';
import { getMeasureTaskById } from '@/features/service/measurement/actions/queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DispatchDialog } from '@/features/service/measurement/components/dispatch-dialog';
import { SubmitDataDialog as SubmitMeasureDataDialog } from '@/features/service/measurement/components/submit-data-dialog';
import { ConfirmDialog as ConfirmMeasureDialog, RejectDialog as RejectMeasureDialog } from '@/features/service/measurement/components/confirm-reject-dialogs';
import { Calendar, User, MapPin, Clock, FileText } from 'lucide-react';
import type { MeasureTaskWithRelations } from '@/types/service';
import { formatDateTimeDisplay } from '@/types/service';

export const dynamic = 'force-dynamic';

const statusMap = {
    PENDING: { label: '待分配', color: 'bg-gray-500' },
    DISPATCHED: { label: '已分配', color: 'bg-blue-500' },
    PENDING_VISIT: { label: '待上门', color: 'bg-yellow-500' },
    PENDING_CONFIRM: { label: '待确认', color: 'bg-orange-500' },
    COMPLETED: { label: '已完成', color: 'bg-green-500' },
    CANCELLED: { label: '已取消', color: 'bg-red-500' },
    DISPATCHING: { label: '派单中', color: 'bg-blue-400' },
};

export default async function MeasureTaskDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await getMeasureTaskById(id);

    if (!result.success || !result.data) {
        notFound();
    }

    // 使用类型断言转换为统一类型
    const task = result.data as unknown as MeasureTaskWithRelations;
    const statusInfo = statusMap[task.status as keyof typeof statusMap] || statusMap.PENDING;

    // 从 sheets 关联获取测量数据
    const latestSheet = task.sheets?.[0];
    const measureItems = latestSheet?.items || [];

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">测量任务详情</h1>
                    <p className="text-muted-foreground">任务编号: {task.measureNo}</p>
                </div>
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* 客户信息 */}
                <Card>
                    <CardHeader>
                        <CardTitle>客户信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{task.customer?.name || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{task.customer?.phone || '-'}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 任务信息 */}
                <Card>
                    <CardHeader>
                        <CardTitle>任务信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>测量师: {task.assignedWorker?.name || '未分配'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                                预约时间: {formatDateTimeDisplay(task.scheduledAt)}
                            </span>
                        </div>
                        {task.checkInAt && (
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>签到时间: {formatDateTimeDisplay(task.checkInAt)}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 测量数据 */}
            {measureItems.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>测量数据</CardTitle>
                        <CardDescription>
                            共 {measureItems.length} 个测量点位
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {measureItems.map((item, index) => (
                                <div key={item.id || index} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{item.roomName || `位置 ${index + 1}`}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {item.windowType || '-'}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-sm text-muted-foreground">
                                        尺寸: {item.width || '-'} x {item.height || '-'}
                                    </div>
                                    {item.remark && (
                                        <div className="mt-2 text-sm text-muted-foreground">
                                            备注: {item.remark}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 备注 */}
            {task.remark && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            任务备注
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{task.remark}</p>
                    </CardContent>
                </Card>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-4 flex-wrap">
                {task.status === 'PENDING' && (
                    <DispatchDialog taskId={task.id} trigger={<Button>分配测量师</Button>} />
                )}
                {(task.status === 'DISPATCHED' || task.status === 'PENDING_VISIT') && (
                    <SubmitMeasureDataDialog taskId={task.id} />
                )}
                {task.status === 'PENDING_CONFIRM' && (
                    <>
                        <ConfirmMeasureDialog taskId={task.id} />
                        <RejectMeasureDialog taskId={task.id} />
                    </>
                )}
            </div>
        </div>
    );
}
