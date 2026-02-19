import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMeasureTaskById, checkMeasureFeeStatus, getMeasureTaskVersions } from '@/features/service/measurement/actions/queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DispatchDialog } from '@/features/service/measurement/components/dispatch-dialog';
import { SubmitDataDialog as SubmitMeasureDataDialog } from '@/features/service/measurement/components/submit-data-dialog';
import { ConfirmDialog as ConfirmMeasureDialog, RejectDialog as RejectMeasureDialog } from '@/features/service/measurement/components/confirm-reject-dialogs';
import { SplitTaskDialog } from '@/features/service/measurement/components/split-task-dialog';
import { FeeWaiverDialog } from '@/features/service/measurement/components/fee-waiver-dialog';
import { MeasureStatusTabs } from '@/features/service/measurement/components/status-tabs';
import { OperationLog } from '@/features/service/measurement/components/operation-log';
import { GPSCheckIn } from '@/features/service/measurement/components/gps-check-in';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import User from 'lucide-react/dist/esm/icons/user';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Clock from 'lucide-react/dist/esm/icons/clock';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import type { MeasureTaskWithRelations } from '@/types/service';
import { formatDateTimeDisplay } from '@/types/service';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';

export const dynamic = 'force-dynamic';

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
    // 使用类型断言转换为统一类型
    // TODO: 优化类型定义，避免使用 double cast (R2-CQ-01)
    const task = result.data as unknown as MeasureTaskWithRelations;

    // 检查费用状态
    const feeCheck = await checkMeasureFeeStatus(id);
    const canDispatch = feeCheck?.canDispatch ?? true;

    // 获取版本历史 (容错处理，如果表列不存在则返回空)
    let versions: Array<{ id: string; versionDisplay?: string; round?: number; variant?: string }> = [];
    try {
        const versionsResult = await getMeasureTaskVersions(id);
        versions = versionsResult.data || [];
    } catch (_e) {
        console.warn('获取版本历史失败，可能需要运行数据库迁移');
    }

    // 从 sheets 关联获取测量数据
    const latestSheet = task.sheets?.[0];
    const measureItems = latestSheet?.items || [];

    // 模拟操作日志数据 (TODO: R2-UX-05 对接审计日志服务查询真实操作记录)
    const mockOperationLogs = [
        { id: '1', action: 'CREATE', detail: '创建测量任务', operatorName: '系统', createdAt: task.createdAt || new Date() },
        ...(task.assignedWorker ? [{ id: '2', action: 'DISPATCH', detail: `指派给 ${task.assignedWorker?.name || '测量师'}`, operatorName: '派单员', createdAt: task.updatedAt || new Date() }] : []),
        ...(task.checkInAt ? [{ id: '3', action: 'CHECK_IN', detail: '测量师现场签到', operatorName: task.assignedWorker?.name || '测量师', createdAt: task.checkInAt }] : []),
    ];

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">测量任务详情</h1>
                    <p className="text-muted-foreground">任务编号: {task.measureNo}</p>
                </div>
                <div className="flex items-center gap-2">
                    {task.feeCheckStatus === 'PENDING' && (
                        <Badge variant="outline" className="border-orange-500 text-orange-500">费用待审批</Badge>
                    )}
                </div>
            </div>

            {/* 状态 Tabs */}
            <MeasureStatusTabs currentStatus={String(task.status)} />

            {/* 费用告警 */}
            {!canDispatch && task.status === 'PENDING' && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>无法派单</AlertTitle>
                    <AlertDescription>
                        {feeCheck?.message || '需支付定金或申请豁免工费才能进行派单'}
                    </AlertDescription>
                </Alert>
            )}

            {/* 版本切换 (如有多个版本) */}
            {versions.length > 1 && (
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm">测量版本</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="flex gap-2">
                            {versions.map((v) => (
                                <Badge key={v.id} variant={v.id === latestSheet?.id ? 'default' : 'outline'}>
                                    {v.versionDisplay || `V${v.round}.${v.variant}`}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

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
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{task.customer?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '-'}</span>
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
                        {task.feeCheckStatus && (
                            <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>费用状态: {task.feeCheckStatus}</span>
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

            {/* 操作日志 */}
            <OperationLog logs={mockOperationLogs} />

            {/* 操作按钮 */}
            <div className="flex gap-4 flex-wrap">
                {/* 转报价按钮 - 仅 COMPLETED 状态可用 */}
                {task.status === 'COMPLETED' && (
                    <Button asChild>
                        <Link href={`/quotes/create?measureTaskId=${task.id}`}>
                            转报价
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                )}

                {/* 拆单按钮 - 仅 PENDING/DISPATCHING 状态可用 */}
                {(task.status === 'PENDING' || task.status === 'DISPATCHING') && (
                    <SplitTaskDialog originalTaskId={task.id} />
                )}

                {/* 费用豁免按钮 - 仅无法派单(即欠费)且未申请过时可用 */}
                {!canDispatch && task.status === 'PENDING' && task.feeCheckStatus !== 'PENDING' && (
                    <FeeWaiverDialog taskId={task.id} />
                )}

                {/* 派单按钮 - 需满足费用条件 */}
                {task.status === 'PENDING' && (
                    <DispatchDialog
                        taskId={task.id}
                        trigger={<Button disabled={!canDispatch}>分配测量师</Button>}
                    />
                )}

                {(task.status === 'DISPATCHING' || task.status === 'PENDING_VISIT') && (
                    <div className="flex items-center gap-2">
                        {!task.checkInAt && <GPSCheckIn taskId={task.id} />}
                        <SubmitMeasureDataDialog taskId={task.id} />
                    </div>
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
