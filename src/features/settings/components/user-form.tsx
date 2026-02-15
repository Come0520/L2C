'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { RoleSelector } from './role-selector';
import { updateUser } from '@/features/settings/actions/user-actions';
import type { UserInfo } from '@/features/settings/actions/user-actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: UserInfo | null;
  onSuccess: () => void;
  availableRoles?: { label: string; value: string }[];
}

/**
 * 用户编辑表单对话框
 * 支持编辑姓名、角色、启用状态
 * 显示手机号和邮箱（只读）
 */
export function UserForm({
  open,
  onOpenChange,
  initialData,
  onSuccess,
  availableRoles = [],
}: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm({
    defaultValues: {
      name: '',
      roles: [] as string[],
      isActive: true,
    },
  });

  useEffect(() => {
    if (open && initialData) {
      form.reset({
        name: initialData.name || '',
        roles: initialData.roles || (initialData.role ? [initialData.role] : []) || [],
        isActive: initialData.isActive ?? true,
      });
    }
  }, [open, initialData, form]);

  const onSubmit = async (data: { name: string; roles: string[]; isActive: boolean }) => {
    if (!initialData?.id) return;

    setLoading(true);
    try {
      const result = await updateUser(initialData.id, {
        name: data.name,
        roles: data.roles,
        isActive: data.isActive,
      });

      if (result.success) {
        toast.success('用户更新成功');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || '更新失败');
      }
    } catch {
      toast.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? '编辑用户' : '创建用户'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>姓名</Label>
            <Input {...form.register('name')} placeholder="用户姓名" />
          </div>

          {/* 只读信息：手机号和邮箱 */}
          {initialData && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">手机号</Label>
                <Input value={initialData.phone || '-'} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">邮箱</Label>
                <Input value={initialData.email || '未绑定'} disabled className="bg-muted" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>角色</Label>
            <RoleSelector
              options={availableRoles}
              selected={form.watch('roles')}
              onSelect={(vals) => form.setValue('roles', vals)}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="active-mode">账号状态 (启用/禁用)</Label>
            <Switch
              id="active-mode"
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
