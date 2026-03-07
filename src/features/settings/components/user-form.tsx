'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { RoleSelector } from './role-selector';
import { updateUser, updateUserWithToggles } from '@/features/settings/actions/user-actions';
import type { UserInfo } from '@/features/settings/actions/user-actions';
import { BaseMemberTogglesSection } from './base-member-toggles-section';
import { rolesToToggles } from '@/features/settings/lib/base-member-toggles';
import type { BaseMemberToggles } from '@/features/settings/lib/base-member-toggles';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import { toast } from 'sonner';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: UserInfo | null;
  onSuccess: () => void;
  availableRoles?: { label: string; value: string }[];
  /** 是否为基础版租户（使用虚拟开关代替角色选择器） */
  isBasePlan?: boolean;
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
  isBasePlan = false,
}: UserFormProps) {
  const [loading, setLoading] = useState(false);
  // Base 版虚拟开关状态
  const [toggles, setToggles] = useState<BaseMemberToggles>({
    isPartner: false,
    allowFinance: false,
    allowDispatch: false,
    allowSupply: false,
    allowStoreSharing: false,
  });
  const form = useForm({
    defaultValues: {
      name: '',
      roles: [] as string[],
      isActive: true,
    },
  });

  useEffect(() => {
    if (open && initialData) {
      const currentRoles = Array.from(
        new Set([...(initialData.roles || []), ...(initialData.role ? [initialData.role] : [])])
      ).filter((r) => r && r !== 'STAFF');

      form.reset({
        name: initialData.name || '',
        roles: currentRoles,
        isActive: initialData.isActive ?? true,
      });

      // Base 版：从当前角色反推开关状态
      if (isBasePlan) {
        const permissions = ((initialData as unknown as { permissions?: string[] }).permissions) ?? [];
        setToggles(rolesToToggles(currentRoles, permissions));
      }
    }
  }, [open, initialData, form, isBasePlan]);

  const onSubmit = async (data: { name: string; roles: string[]; isActive: boolean }) => {
    if (!initialData?.id) return;

    setLoading(true);
    try {
      let result;

      if (isBasePlan) {
        // Base 版：通过虚拟开关提交
        result = await updateUserWithToggles(initialData.id, data.name, toggles);
      } else {
        // Pro/Enterprise 版：通过角色选择器提交
        result = await updateUser(initialData.id, {
          name: data.name,
          roles: data.roles,
          isActive: data.isActive,
        });
      }

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
          <fieldset disabled={loading} className="space-y-4">
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input {...form.register('name')} placeholder="请输入用户姓名" />
            </div>

            {/* 只读信息：手机号和邮箱 */}
            {initialData && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground opacity-70">手机号</Label>
                  <Input
                    value={initialData.phone || '-'}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground opacity-70">邮箱</Label>
                  <Input
                    value={initialData.email || '未绑定'}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* 角色/权限配置 */}
            {isBasePlan ? (
              <BaseMemberTogglesSection
                toggles={toggles}
                onChange={setToggles}
              />
            ) : (
              <div className="space-y-2">
                <Label>角色</Label>
                <RoleSelector
                  options={availableRoles}
                  selected={form.watch('roles')}
                  onSelect={(vals) => form.setValue('roles', vals)}
                />
              </div>
            )}

            <div className="bg-muted/30 flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="active-mode" className="text-sm font-medium">
                  账号状态
                </Label>
                <p className="text-muted-foreground text-xs">控制该用户是否可以登录系统</p>
              </div>
              <Switch
                id="active-mode"
                checked={form.watch('isActive')}
                onCheckedChange={(checked) => form.setValue('isActive', checked)}
              />
            </div>
          </fieldset>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[100px]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                '保存更改'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
