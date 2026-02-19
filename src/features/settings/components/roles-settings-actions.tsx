'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { RefreshCw, Plus, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { syncSystemRoles, createRole } from '@/features/settings/actions/roles-management';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { useForm } from 'react-hook-form';

/** 创建角色表单数据类型 */
interface CreateRoleFormValues {
  code: string;
  name: string;
  description: string;
}

export function RolesSettingsActions() {
  const [syncing, setSyncing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleFormValues>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
    },
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncSystemRoles();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('同步失败');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreate = async (data: CreateRoleFormValues) => {
    setCreating(true);
    try {
      // uppercase code
      const code = data.code.toUpperCase().trim();
      const result = await createRole({
        code,
        name: data.name,
        description: data.description,
      });

      if (result.success) {
        toast.success('角色创建成功');
        setCreateOpen(false);
        reset();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('创建失败');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新角色</DialogTitle>
            <DialogDescription>
              创建一个新的自定义角色，之后可以在权限矩阵中配置其权限。
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>角色代码 (Code)</Label>
              <Input
                {...register('code', { required: true, pattern: /^[A-Za-z0-9_]+$/ })}
                placeholder="例如: INTERN"
              />
              {errors.code && (
                <p className="text-xs text-red-500">请输入有效的代码（字母、数字、下划线）</p>
              )}
              <p className="text-muted-foreground text-xs">
                系统将自动转换为大写，创建后不可修改。
              </p>
            </div>

            <div className="space-y-2">
              <Label>角色名称</Label>
              <Input {...register('name', { required: true })} placeholder="例如: 实习生" />
            </div>

            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea {...register('description')} placeholder="角色的职责描述..." />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                创建
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            操作 <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>角色管理</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            创建角色
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            同步系统角色
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
