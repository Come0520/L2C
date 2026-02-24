'use client';

/**
 * 租户审批列表客户端组件
 * 
 * 升级至 L5:
 * 1. 替换原生 confirm 为 AlertDialog
 * 2. 增加租户停用/恢复功能
 * 3. 增强状态可视化（Badge 颜色区分）
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { SearchInput } from '@/shared/ui/search-input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/shared/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
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
    Loader2,
    AlertTriangle,
    ShieldAlert,
    ShieldCheck
} from 'lucide-react';
import {
    approveTenant,
    rejectTenant,
    suspendTenant,
    activateTenant
} from '@/features/platform/actions/admin-actions';
import type { PendingTenant } from '@/features/platform/actions/admin-actions';
import { toast } from 'sonner';

interface TenantApprovalListProps {
    pendingTenants: PendingTenant[];
    allTenants: PendingTenant[];
}

export function TenantApprovalList({ pendingTenants, allTenants }: TenantApprovalListProps) {
    const router = useRouter();
    const [processing, setProcessing] = useState<string | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

    // 统一确认弹窗状态
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: 'approve' | 'suspend' | 'activate' | null;
        tenant: PendingTenant | null;
    }>({
        open: false,
        type: null,
        tenant: null
    });

    const [rejectReason, setRejectReason] = useState('');
    const [selectedTenant, setSelectedTenant] = useState<PendingTenant | null>(null);
    const [activeTab, setActiveTab] = useState('pending');

    // 搜索状态
    const [searchValue, setSearchValue] = useState('');
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    // 处理确认流程
    const handleConfirmAction = async () => {
        const { type, tenant } = confirmDialog;
        if (!tenant || !type) return;

        setProcessing(tenant.id);
        setConfirmDialog(curr => ({ ...curr, open: false }));

        try {
            let result;
            if (type === 'approve') {
                result = await approveTenant(tenant.id);
            } else if (type === 'suspend') {
                result = await suspendTenant(tenant.id);
            } else if (type === 'activate') {
                result = await activateTenant(tenant.id);
            }

            if (result?.success) {
                toast.success('操作成功');
                router.refresh();
            } else {
                toast.error(result?.error || '操作失败');
            }
        } catch (_error) {
            toast.error('网络或服务器异常');
        } finally {
            setProcessing(null);
        }
    };

    // 拒绝入驻提交
    const handleRejectSubmit = async () => {
        if (!selectedTenant || !rejectReason.trim()) {
            toast.error('请输入拒绝理由');
            return;
        }

        setProcessing(selectedTenant.id);
        setRejectDialogOpen(false);

        try {
            const result = await rejectTenant(selectedTenant.id, rejectReason);
            if (result.success) {
                toast.success('已拒绝该租户入驻');
                setRejectReason('');
                router.refresh();
            } else {
                toast.error(result.error || '操作失败');
            }
        } catch (_error) {
            toast.error('操作异常');
        } finally {
            setProcessing(null);
        }
    };

    // 处理搜索，防抖后更新 URL
    const handleSearch = (value: string) => {
        setSearchValue(value);
        if (searchTimeout) clearTimeout(searchTimeout);

        const timeout = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            if (value.trim()) {
                params.set('search', value.trim());
            } else {
                params.delete('search');
            }
            router.push(`?${params.toString()}`);
        }, 500);

        setSearchTimeout(timeout);
    };

    // 状态 Badge 渲染
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_approval':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">待审批</Badge>;
            case 'active':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">运行中</Badge>;
            case 'suspended':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">已停用</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">已拒绝</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const tabs = [
        { value: 'pending', label: `待审批 (${pendingTenants.length})` },
        { value: 'all', label: `所有租户 (${allTenants.length})` }
    ];

    const currentList = activeTab === 'pending' ? pendingTenants : allTenants;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <AnimatedTabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    tabClassName="mb-0"
                />

                <div className="w-full sm:w-auto min-w-[300px]">
                    <SearchInput
                        placeholder="搜索租户名称、编号、联系人..."
                        value={searchValue}
                        onChange={(e) => handleSearch(e.target.value)}
                        onClear={() => {
                            setSearchValue('');
                            const params = new URLSearchParams(window.location.search);
                            params.delete('search');
                            router.push(`?${params.toString()}`);
                        }}
                    />
                </div>
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>租户信息</TableHead>
                            <TableHead>联系人</TableHead>
                            <TableHead>区域与时间</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentList.map((tenant) => (
                            <TableRow key={tenant.id} className="hover:bg-gray-50/50">
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="font-medium text-gray-900 flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-gray-400" />
                                            {tenant.name}
                                        </div>
                                        <div className="text-sm text-gray-500 font-mono">
                                            {tenant.code}
                                        </div>
                                        {tenant.businessDescription && (
                                            <div className="text-xs text-gray-400 line-clamp-1 max-w-xs mt-1" title={tenant.businessDescription}>
                                                {tenant.businessDescription}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            {tenant.applicantName} ({tenant.applicantPhone})
                                        </div>
                                        {tenant.applicantEmail && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                {tenant.applicantEmail}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            {tenant.region || '未提供'}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '未知'}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {renderStatusBadge(tenant.status)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2 text-nowrap">
                                        {tenant.status === 'pending_approval' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() => {
                                                        setSelectedTenant(tenant);
                                                        setRejectDialogOpen(true);
                                                    }}
                                                    disabled={processing === tenant.id}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    拒绝
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => setConfirmDialog({
                                                        open: true,
                                                        type: 'approve',
                                                        tenant
                                                    })}
                                                    disabled={processing === tenant.id}
                                                >
                                                    {processing === tenant.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                    ) : (
                                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                                    )}
                                                    批准
                                                </Button>
                                            </>
                                        )}

                                        {tenant.status === 'active' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                                onClick={() => setConfirmDialog({
                                                    open: true,
                                                    type: 'suspend',
                                                    tenant
                                                })}
                                                disabled={processing === tenant.id}
                                            >
                                                <ShieldAlert className="h-4 w-4 mr-1" />
                                                停用
                                            </Button>
                                        )}

                                        {tenant.status === 'suspended' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-green-600 border-green-200 hover:bg-green-50"
                                                onClick={() => setConfirmDialog({
                                                    open: true,
                                                    type: 'activate',
                                                    tenant
                                                })}
                                                disabled={processing === tenant.id}
                                            >
                                                <ShieldCheck className="h-4 w-4 mr-1" />
                                                恢复
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {currentList.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 border-t">
                        <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                            {activeTab === 'pending' ? '暂无待审批的租户申请' : '暂无相关租户信息'}
                        </p>
                    </div>
                )}
            </Card>

            {/* 拒绝入驻 Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>拒绝租户申请</DialogTitle>
                        <DialogDescription>
                            请向 {selectedTenant?.name} 提供被拒绝的具体原因。该信息将通过邮件发送给申请人。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="reason">拒绝理由</Label>
                        <Textarea
                            id="reason"
                            placeholder="例如：申请材料不完整、背景审核未通过等"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>取消</Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectSubmit}
                            disabled={!rejectReason.trim() || !!processing}
                        >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                            确认拒绝
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 统一操作确认 AlertDialog */}
            <AlertDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog(curr => ({ ...curr, open }))}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            {confirmDialog.type === 'approve' && '批准租户入驻'}
                            {confirmDialog.type === 'suspend' && '停用租户确认'}
                            {confirmDialog.type === 'activate' && '恢复租户确认'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.type === 'approve' && `确定要批准 "${confirmDialog.tenant?.name}" 的入驻申请吗？批准后租户管理员即可登录系统。`}
                            {confirmDialog.type === 'suspend' && `停用租户 "${confirmDialog.tenant?.name}" 将导致该租户下的所有用户无法登录，确定要继续吗？`}
                            {confirmDialog.type === 'activate' && `确定要恢复租户 "${confirmDialog.tenant?.name}" 的正常运营吗？恢复后其用户将恢复登录权限。`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleConfirmAction();
                            }}
                            className={confirmDialog.type === 'suspend' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            执行操作
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
