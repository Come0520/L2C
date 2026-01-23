/**
 * 租户审批列表客户端组件
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/shared/ui/dialog';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import {
    CheckCircle2,
    XCircle,
    Building2,
    Phone,
    Mail,
    MapPin,
    Clock,
    Loader2
} from 'lucide-react';
import { approveTenant, rejectTenant } from '@/features/platform/actions/admin-actions';
import type { PendingTenant } from '@/features/platform/actions/admin-actions';

interface TenantApprovalListProps {
    pendingTenants: PendingTenant[];
    allTenants: PendingTenant[];
}

export function TenantApprovalList({ pendingTenants, allTenants }: TenantApprovalListProps) {
    const router = useRouter();
    const [processing, setProcessing] = useState<string | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<PendingTenant | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // 审批通过
    const handleApprove = async (tenant: PendingTenant) => {
        if (!confirm(`确认通过「${tenant.name}」的入驻申请？`)) return;

        setProcessing(tenant.id);
        try {
            const result = await approveTenant(tenant.id);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error || '操作失败');
            }
        } finally {
            setProcessing(null);
        }
    };

    // 打开拒绝对话框
    const openRejectDialog = (tenant: PendingTenant) => {
        setSelectedTenant(tenant);
        setRejectReason('');
        setRejectDialogOpen(true);
    };

    // 确认拒绝
    const handleReject = async () => {
        if (!selectedTenant) return;
        if (!rejectReason.trim()) {
            alert('请填写拒绝原因');
            return;
        }

        setProcessing(selectedTenant.id);
        try {
            const result = await rejectTenant(selectedTenant.id, rejectReason);
            if (result.success) {
                setRejectDialogOpen(false);
                router.refresh();
            } else {
                alert(result.error || '操作失败');
            }
        } finally {
            setProcessing(null);
        }
    };

    // 格式化日期
    const formatDate = (date: Date | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // 租户卡片
    const TenantCard = ({ tenant, showActions = false }: { tenant: PendingTenant; showActions?: boolean }) => (
        <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-400" />
                            <h3 className="font-semibold text-white">{tenant.name}</h3>
                            <Badge variant="outline" className="text-slate-400 border-slate-600">
                                {tenant.code}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-slate-400">
                                <span className="text-slate-500">联系人:</span>
                                {tenant.applicantName || '-'}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Phone className="w-4 h-4" />
                                {tenant.applicantPhone || '-'}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Mail className="w-4 h-4" />
                                {tenant.applicantEmail || '-'}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <MapPin className="w-4 h-4" />
                                {tenant.region || '-'}
                            </div>
                        </div>

                        {tenant.businessDescription && (
                            <p className="text-slate-500 text-sm line-clamp-2">
                                {tenant.businessDescription}
                            </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            申请时间: {formatDate(tenant.createdAt)}
                        </div>
                    </div>

                    {showActions && (
                        <div className="flex gap-2 ml-4">
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(tenant)}
                                disabled={processing === tenant.id}
                            >
                                {processing === tenant.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <><CheckCircle2 className="w-4 h-4 mr-1" /> 通过</>
                                )}
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openRejectDialog(tenant)}
                                disabled={processing === tenant.id}
                            >
                                <XCircle className="w-4 h-4 mr-1" /> 拒绝
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <>
            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="bg-slate-800 border-slate-700">
                    <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700">
                        待审批
                        {pendingTenants.length > 0 && (
                            <Badge className="ml-2 bg-orange-600">{pendingTenants.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="all" className="data-[state=active]:bg-slate-700">
                        全部租户 ({allTenants.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-4">
                    {pendingTenants.length === 0 ? (
                        <Card className="bg-slate-800 border-slate-700">
                            <CardContent className="p-8 text-center">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <p className="text-slate-400">暂无待审批的租户申请</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {pendingTenants.map((tenant) => (
                                <TenantCard key={tenant.id} tenant={tenant} showActions />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="all" className="mt-4">
                    <div className="space-y-4">
                        {allTenants.map((tenant) => (
                            <TenantCard key={tenant.id} tenant={tenant} />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* 拒绝原因对话框 */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">拒绝申请</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            请填写拒绝「{selectedTenant?.name}」入驻申请的原因
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejectReason" className="text-white">拒绝原因</Label>
                            <Textarea
                                id="rejectReason"
                                placeholder="请说明拒绝原因，将发送给申请人..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialogOpen(false)}
                            className="border-slate-600"
                        >
                            取消
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={processing !== null}
                        >
                            {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            确认拒绝
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
