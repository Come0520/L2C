import { notFound } from 'next/navigation';
import { getInstallTaskById, getAvailableWorkers } from '@/features/service/installation/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { InstallDispatchDialog } from '@/features/service/installation/components/install-dispatch-dialog';
import { SubmitInstallCompletionDialog } from '@/features/service/installation/components/submit-completion-dialog';
import { ConfirmInstallDialog, RejectInstallDialog } from '@/features/service/installation/components/confirm-reject-dialogs';
import { InstallPhotoGallery } from '@/features/service/installation/components/install-photo-gallery';
import { InstallItemsTable } from '@/features/service/installation/components/install-items-table';
import { Calendar, User, MapPin, Package, Star, FileText } from 'lucide-react';


export const dynamic = 'force-dynamic';

const statusMap = {
    PENDING: { label: '待分配', color: 'bg-gray-500' },
    DISPATCHED: { label: '已分配', color: 'bg-blue-500' },
    DISPATCHING: { label: '待接单', color: 'bg-blue-500' },
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
    const result = await getInstallTaskById(id);

    if (!result.data || !result.success) {
        notFound();
    }

    const task = result.data;
    const workerRes = await getAvailableWorkers();
    const workers = workerRes.success ? (workerRes.data || []) : [];
    const statusInfo = statusMap[task.status as keyof typeof statusMap] || statusMap.PENDING;

    // Helper to cast items to component props
    const tableItems = (task.items || []).map(item => ({
        id: item.id,
        productName: item.productName,
        roomName: item.roomName,
        quantity: item.quantity as string,
        actualInstalledQuantity: item.actualInstalledQuantity as string | null,
        isInstalled: item.isInstalled,
        issueCategory: item.issueCategory as 'NONE' | 'MISSING' | 'DAMAGED' | 'WRONG_SIZE' | null,
    }));

    // Helper to cast photos to component props
    const galleryPhotos = (task.photos || []).map(p => ({
        id: p.id,
        photoType: p.photoType as 'BEFORE' | 'AFTER' | 'DETAIL',
        photoUrl: p.photoUrl,
        remark: p.remark,
        createdAt: p.createdAt ? new Date(p.createdAt) : null
    }));

    const allowEdit = task.status === 'PENDING_VISIT' || task.status === 'DISPATCHING';

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

                <Card>
                    <CardHeader>
                        <CardTitle>任务信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>安装师: {task.installer?.name || '未分配'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                                预约日期: {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString() : '未设置'}
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


            {/* 安装明细 & 照片 */}
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>安装明细</CardTitle>
                        <CardDescription>共 {task.items?.length || 0} 项</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InstallItemsTable
                            items={tableItems}
                            allowEdit={allowEdit}
                        />
                    </CardContent>
                </Card>

                <InstallPhotoGallery
                    photos={galleryPhotos}
                    allowUpload={allowEdit}
                />
            </div>

            {/* 评价信息 */}
            {task.rating && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            客户评价
                        </CardTitle>
                    </CardHeader>
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
                <CardHeader>
                    <CardTitle>操作</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {task.status === 'PENDING_DISPATCH' && (
                        <InstallDispatchDialog
                            taskId={task.id}
                            workers={workers}
                            trigger={<Button>指派安装师</Button>}
                        />
                    )}

                    {(task.status === 'DISPATCHING' || task.status === 'PENDING_VISIT') && (
                        <SubmitInstallCompletionDialog
                            taskId={task.id}
                            trigger={<Button>提交完工</Button>}
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
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            备注/日志
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-sm whitespace-pre-wrap text-muted-foreground">{task.remark}</pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
