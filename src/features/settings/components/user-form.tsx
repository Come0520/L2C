'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Checkbox } from '@/shared/ui/checkbox';
import { updateUser } from '@/features/settings/actions/user-actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  id: string;
  name?: string;
  roles?: string[];
  role?: string;
  isActive?: boolean;
}

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: UserData;
  onSuccess: () => void;
  availableRoles?: { label: string; value: string }[];
}

interface FormData {
  name: string;
  roles: string[];
  isActive: boolean;
}

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
        roles:
          Array.isArray(initialData.roles) && initialData.roles.length > 0
            ? initialData.roles
            : initialData.role
              ? [initialData.role]
              : [],
        isActive: initialData.isActive ?? true,
      });
    }
  }, [open, initialData, form]);

  const onSubmit = async (data: FormData) => {
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
    } catch (_e) {
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

          <div className="space-y-3">
            <Label>角色</Label>
            <div className="bg-muted/30 grid grid-cols-2 gap-4 rounded-lg border p-4">
              {availableRoles.map((role) => (
                <div key={role.value} className="flex flex-row items-center space-y-0 space-x-3">
                  <Checkbox
                    id={`role-${role.value}`}
                    checked={form.watch('roles').includes(role.value)}
                    onCheckedChange={(checked) => {
                      const currentRoles = form.getValues('roles') || [];
                      if (checked) {
                        form.setValue('roles', [...currentRoles, role.value]);
                      } else {
                        form.setValue(
                          'roles',
                          currentRoles.filter((r) => r !== role.value)
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`role-${role.value}`}
                    className="cursor-pointer text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {role.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2 pt-2">
            <Label htmlFor="active-mode" className="cursor-pointer">
              账号状态 (启用/禁用)
            </Label>
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
