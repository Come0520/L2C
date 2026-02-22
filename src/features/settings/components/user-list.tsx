'use client';
import { logger } from '@/shared/lib/logger';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Edit, UserX, UserCheck, Trash2 } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { EmptyTableRow } from '@/shared/ui/empty-table-row';
import { useState } from 'react';
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
import type { UserInfo } from '@/features/settings/actions/user-actions';
import { ROLE_LABELS } from '@/features/settings/actions/user-actions';
import { toast } from 'sonner';

interface UserListProps {
  data: UserInfo[];
  onEdit?: (user: UserInfo) => void;
  onToggleActive?: (userId: string) => Promise<void>;
  onDelete?: (userId: string) => Promise<void>;
}

/**
 * 用户列表组件
 * 展示用户信息，支持编辑、禁用/启用、删除操作
 */
export function UserList({ data, onEdit, onToggleActive, onDelete }: UserListProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'toggle' | 'delete';
    user: UserInfo | null;
  }>({ open: false, type: 'toggle', user: null });
  const [loading, setLoading] = useState(false);

  // 打开确认对话框
  const openConfirm = (type: 'toggle' | 'delete', user: UserInfo) => {
    setConfirmDialog({ open: true, type, user });
  };

  // 确认操作
  const handleConfirm = async () => {
    if (!confirmDialog.user) return;
    setLoading(true);
    try {
      if (confirmDialog.type === 'toggle') {
        await onToggleActive?.(confirmDialog.user.id);
        toast.success(confirmDialog.user.isActive ? '账号已禁用' : '账号已启用');
      } else {
        await onDelete?.(confirmDialog.user.id);
        toast.success('用户已删除');
      }
      setConfirmDialog({ open: false, type: 'toggle', user: null });
    } catch (error) {
      toast.error('操作失败，请重试');
      logger.error('UserList detail action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取角色显示名称
  const getRoleLabel = (role: string) => {
    return ROLE_LABELS[role] || role;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <EmptyTableRow colSpan={5} message="暂无用户" />
            ) : (
              data.map((item) => (
                <TableRow key={item.id} className={!item.isActive ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(item.roles && item.roles.length > 0 ? item.roles : [item.role]).map(
                        (role: string) => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {getRoleLabel(role)}
                          </Badge>
                        )
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? 'default' : 'secondary'}>
                      {item.isActive ? '已启用' : '已禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" title="编辑" onClick={() => onEdit?.(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={item.isActive ? '禁用账号' : '启用账号'}
                      onClick={() => openConfirm('toggle', item)}
                    >
                      {item.isActive ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      title="删除"
                      onClick={() => openConfirm('delete', item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 确认对话框 */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog({ open: false, type: 'toggle', user: null });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'delete'
                ? '确认删除用户'
                : confirmDialog.user?.isActive
                  ? '确认禁用用户'
                  : '确认启用用户'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'delete'
                ? `确定要删除用户「${confirmDialog.user?.name}」吗？该操作会禁用该账号，用户将无法登录。历史业务数据不受影响。`
                : confirmDialog.user?.isActive
                  ? `确定要禁用用户「${confirmDialog.user?.name}」吗？禁用后该用户将无法登录系统。`
                  : `确定要重新启用用户「${confirmDialog.user?.name}」吗？启用后该用户可以正常登录。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={loading}
              className={
                confirmDialog.type === 'delete'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {loading ? '处理中...' : '确认'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
