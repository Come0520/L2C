import { notFound } from 'next/navigation';
import { getMeasureTaskById, getAvailableWorkers } from '@/features/service/measurement/actions';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { DispatchDialog } from '@/features/service/measurement/components/dispatch-dialog';
import { SubmitMeasureDataDialog } from '@/features/service/measurement/components/submit-data-dialog';
import { ConfirmMeasureDialog, RejectMeasureDialog } from '@/features/service/measurement/components/confirm-reject-dialogs';
import { Calendar, User, MapPin, Clock, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

const statusMap = {
    PENDING: { label: '待分配', color: 'bg-gray-500' },
    DISPATCHED: { label: '已分配', color: 'bg-blue-500' },
    PENDING_VISIT: { label: '待上门', color: 'bg-yellow-500' },
    PENDING_CONFIRM: { label: '待确认', color: 'bg-orange-500' },
    COMPLETED: { label: '已完成', color: 'bg-green-500' },
    CANCELLED: { label: '已取消', color: 'bg-red-500' },
};

export default async function MeasureTaskDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await getMeasureTaskById({ id });

    if (!result.success || !result.data) {
        notFound();
    }

    const task = result.data;
    const workerRes = await getAvailableWorkers({});
    const workers = workerRes.success ? (workerRes.data || []) : [];
    const statusInfo = statusMap[task.status as keyof typeof statusMap] || statusMap.PENDING;

    interface MeasureRoom {
        name: string;
        windowType: string;
        width: number;
        height: number;
    }

    interface MeasureResultData {
        rooms?: MeasureRoom[];
    }

    // Parse resultData and images
    const resultData = task.resultData as MeasureResultData | null;
    const images = (task.images as string[]) || [];
    const rooms = resultData?.rooms || [];

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">测量任务详情</h1>
                    <p className="text-muted-foreground mt-1">
                        {task.measureNo}
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
                            <span>测量师: {task.worker?.name || '未分配'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                                预约时间: {task.scheduledAt ? new Date(task.scheduledAt).toLocaleString('zh-CN') : '未设置'}
                            </span>
                        </div>
                        {task.checkInAt && (
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>
                                    签到时间: {new Date(task.checkInAt).toLocaleString('zh-CN')}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 测量数据 */}
            {rooms.length > 0 && (
                <Card>
                    <CardHeader title="测量数据" description={`共 ${rooms.length} 个空间`} />
                    <CardContent>
                        <div className="space-y-4">
                            {rooms.map((room, index) => (
                                <div key={index} className="border rounded-lg p-4">
                                    <h4 className="font-medium mb-2">{room.name}</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">窗型：</span>
                                            <span className="font-medium">{room.windowType}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">宽度：</span>
                                            <span className="font-medium">{room.width} mm</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">高度：</span>
                                            <span className="font-medium">{room.height} mm</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 现场照片 */}
            {images.length > 0 && (
                <Card>
                    <CardHeader title="现场照片" description={`共 ${images.length} 张`} />
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {images.map((url: string, index: number) => (
                                <div key={index} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">照片 {index + 1}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 操作按钮 */}
            <Card>
                <CardHeader title="操作" />
                <CardContent className="flex flex-wrap gap-2">
                    {task.status === 'PENDING' && (
                        <DispatchDialog
                            taskId={task.id}
                            workers={workers}
                            trigger={<button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">指派测量师</button>}
                        />
                    )}

                    {(task.status === 'DISPATCHING' || task.status === 'PENDING_VISIT') && (
                        <SubmitMeasureDataDialog
                            taskId={task.id}
                            trigger={<button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">提交测量数据</button>}
                        />
                    )}

                    {task.status === 'PENDING_CONFIRM' && (
                        <>
                            <ConfirmMeasureDialog taskId={task.id} />
                            <RejectMeasureDialog taskId={task.id} />
                        </>
                    )}
                </CardContent>
            </Card>

            {/* 备注 */}
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
