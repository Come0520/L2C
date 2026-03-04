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
import { AceternityTabs } from '@/shared/ui/aceternity-tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/shared/ui/alert-dialog';
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
  ShieldCheck,
  Link2,
  Copy,
  CheckCheck,
} from 'lucide-react';
import {
  approveTenant,
  rejectTenant,
  suspendTenant,
  activateTenant,
  generateMagicLink,
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
    tenant: null,
  });

  // Magic Link 弹窗状态
  const [magicLinkDialog, setMagicLinkDialog] = useState<{
    open: boolean;
    link: string;
    tenantName: string;
  }>({
    open: false,
    link: '',
    tenantName: '',
  });
  const [copied, setCopied] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState<string | null>(null);

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
    setConfirmDialog((curr) => ({ ...curr, open: false }));

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

  // 生成 Magic Link
  const handleGenerateMagicLink = async (tenant: PendingTenant) => {
    setMagicLinkLoading(tenant.id);
    try {
      const result = await generateMagicLink(tenant.id);
      if (result.success && result.magicLink) {
        setMagicLinkDialog({
          open: true,
          link: result.magicLink,
          tenantName: tenant.name,
        });
        setCopied(false);
      } else {
        toast.error(result.error || '生成链接失败');
      }
    } catch {
      toast.error('操作异常，请重试');
    } finally {
      setMagicLinkLoading(null);
    }
  };

  // 复制链接到剪贴板
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(magicLinkDialog.link);
      setCopied(true);
      toast.success('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败，请手动复制');
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
        return (
          <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">
            待审批
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
            运行中
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
            已停用
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="border-gray-200 bg-gray-100 text-gray-600">
            已拒绝
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const tabs = [
    { value: 'pending', title: `待审批 (${pendingTenants.length})` },
    { value: 'all', title: `所有租户 (${allTenants.length})` },
  ];

  const currentList = activeTab === 'pending' ? pendingTenants : allTenants;

  return (
    <div className="space-y-4">
      <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <AceternityTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabClassName="mb-0"
        />

        <div className="w-full min-w-[300px] sm:w-auto">
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
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      {tenant.name}
                    </div>
                    <div className="font-mono text-sm text-gray-500">{tenant.code}</div>
                    {tenant.businessDescription && (
                      <div
                        className="mt-1 line-clamp-1 max-w-xs text-xs text-gray-400"
                        title={tenant.businessDescription}
                      >
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
                <TableCell>{renderStatusBadge(tenant.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 text-nowrap">
                    {tenant.status === 'pending_approval' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setRejectDialogOpen(true);
                          }}
                          disabled={processing === tenant.id}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          拒绝
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              type: 'approve',
                              tenant,
                            })
                          }
                          disabled={processing === tenant.id}
                        >
                          {processing === tenant.id ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                          )}
                          批准
                        </Button>
                      </>
                    )}

                    {tenant.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleGenerateMagicLink(tenant)}
                          disabled={!!magicLinkLoading || processing === tenant.id}
                          title="为该租户 BOSS 生成一次性登录链接"
                        >
                          {magicLinkLoading === tenant.id ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <Link2 className="mr-1 h-4 w-4" />
                          )}
                          登录链接
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              type: 'suspend',
                              tenant,
                            })
                          }
                          disabled={processing === tenant.id}
                        >
                          <ShieldAlert className="mr-1 h-4 w-4" />
                          停用
                        </Button>
                      </>
                    )}

                    {tenant.status === 'suspended' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-200 text-green-600 hover:bg-green-50"
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            type: 'activate',
                            tenant,
                          })
                        }
                        disabled={processing === tenant.id}
                      >
                        <ShieldCheck className="mr-1 h-4 w-4" />
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
          <div className="border-t bg-gray-50 py-20 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
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
          <div className="space-y-2 py-4">
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
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim() || !!processing}
            >
              {processing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              确认拒绝
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 统一操作确认 AlertDialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((curr) => ({ ...curr, open }))}
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
              {confirmDialog.type === 'approve' &&
                `确定要批准 "${confirmDialog.tenant?.name}" 的入驻申请吗？批准后租户管理员即可登录系统。`}
              {confirmDialog.type === 'suspend' &&
                `停用租户 "${confirmDialog.tenant?.name}" 将导致该租户下的所有用户无法登录，确定要继续吗？`}
              {confirmDialog.type === 'activate' &&
                `确定要恢复租户 "${confirmDialog.tenant?.name}" 的正常运营吗？恢复后其用户将恢复登录权限。`}
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
      {/* Magic Link 展示 Dialog */}
      <Dialog
        open={magicLinkDialog.open}
        onOpenChange={(open) => setMagicLinkDialog((curr) => ({ ...curr, open }))}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-500" />
              一次性登录链接已生成
            </DialogTitle>
            <DialogDescription>
              为租户 <strong>{magicLinkDialog.tenantName}</strong> 生成的 BOSS 登录链接。
              请通过安全渠道发送给用户，用户点击后将自动登录并被要求修改密码。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-muted text-muted-foreground rounded-md border p-3 font-mono text-xs break-all select-all">
              {magicLinkDialog.link}
            </div>
            <div className="flex items-start gap-2 rounded-md bg-amber-50 p-2.5 text-xs text-amber-600">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                此链接 <strong>24 小时</strong>内有效，且<strong>仅可使用一次</strong>
                。用户登录后将被强制修改密码。
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setMagicLinkDialog((curr) => ({ ...curr, open: false }))}
            >
              关闭
            </Button>
            <Button
              onClick={handleCopyLink}
              className={copied ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {copied ? (
                <>
                  <CheckCheck className="mr-1 h-4 w-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-4 w-4" />
                  复制链接
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
