'use client';

import { useState } from 'react';
import { UserList } from './user-list';
import { UserForm } from './user-form';
import {
  toggleUserActive,
  deleteUser,
  generateUserMagicLink,
} from '@/features/settings/actions/user-actions';
import type { UserInfo } from '@/features/settings/actions/user-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/shared/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Link2, AlertTriangle, CheckCheck, Copy } from 'lucide-react';

interface UsersSettingsClientProps {
  userData: UserInfo[];
  availableRoles?: { label: string; value: string }[];
  totalPages?: number;
}

/**
 * 用户管理客户端组件
 * 管理编辑、禁用、删除等用户操作
 */
export function UsersSettingsClient({
  userData,
  availableRoles = [],
  totalPages = 1,
}: UsersSettingsClientProps) {
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  // Magic Link 状态
  const [magicLinkDialog, setMagicLinkDialog] = useState<{
    open: boolean;
    link: string;
    userName: string;
  }>({
    open: false,
    link: '',
    userName: '',
  });
  const [copied, setCopied] = useState(false);

  const handleEdit = (user: UserInfo) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setEditingUser(null);
    router.refresh();
  };

  const handleGenerateMagicLink = async (user: UserInfo) => {
    const result = await generateUserMagicLink(user.id);

    if (result.success && result.magicLink) {
      setMagicLinkDialog({
        open: true,
        link: result.magicLink,
        userName: user.name,
      });
      setCopied(false);
    } else {
      toast.error(result.error || '生成链接失败');
    }
  };

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

  const handleToggleActive = async (userId: string) => {
    const result = await toggleUserActive(userId);
    if (result.success) {
      toast.success(result.message || '操作成功');
      router.refresh();
    } else {
      toast.error(result.error || '操作失败');
    }
  };

  const handleDelete = async (userId: string) => {
    const result = await deleteUser(userId);
    if (result.success) {
      toast.success(result.message || '已删除');
      router.refresh();
    } else {
      toast.error(result.error || '删除失败');
    }
  };

  return (
    <div className="space-y-4">
      <UserList
        data={userData}
        onEdit={handleEdit}
        onGenerateMagicLink={handleGenerateMagicLink}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />

      {totalPages > 1 && <Pagination totalPages={totalPages} />}

      <UserForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingUser}
        onSuccess={handleSuccess}
        availableRoles={availableRoles}
      />

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
              为员工 <strong>{magicLinkDialog.userName}</strong> 生成的专属登录链接。
              请通过安全渠道发送给员工，员工点击后将自动登录并被要求修改密码。
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
