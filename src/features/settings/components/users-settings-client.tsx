'use client';

import { useState } from 'react';
import { UserList } from './user-list';
import { UserForm } from './user-form';
import { toggleUserActive, deleteUser } from '@/features/settings/actions/user-actions';
import type { UserInfo } from '@/features/settings/actions/user-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface UsersSettingsClientProps {
  userData: UserInfo[];
  availableRoles?: { label: string; value: string }[];
}

/**
 * 用户管理客户端组件
 * 管理编辑、禁用、删除等用户操作
 */
export function UsersSettingsClient({ userData, availableRoles = [] }: UsersSettingsClientProps) {
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const handleEdit = (user: UserInfo) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setEditingUser(null);
    router.refresh();
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
    <>
      <UserList
        data={userData}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />

      <UserForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingUser}
        onSuccess={handleSuccess}
        availableRoles={availableRoles}
      />
    </>
  );
}
