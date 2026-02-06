'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { MultiSelect } from '@/shared/ui/multi-select';
import { updateUser } from '@/features/settings/actions/user-actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: any;
    onSuccess: () => void;
}

const ROLE_OPTIONS = [
    { label: '普通员工 (STAFF)', value: 'STAFF' },
    { label: '经理 (MANAGER)', value: 'MANAGER' },
    { label: '管理员 (ADMIN)', value: 'ADMIN' },
    { label: '销售 (SALES)', value: 'SALES' },
    { label: '财务 (FINANCE)', value: 'FINANCE' },
    { label: '调度 (DISPATCHER)', value: 'DISPATCHER' },
    { label: '安装工 (INSTALLER)', value: 'INSTALLER' },
    { label: '测量员 (MEASURER)', value: 'MEASURER' },
];

export function UserForm({ open, onOpenChange, initialData, onSuccess }: UserFormProps) {
    const [loading, setLoading] = useState(false);
    const form = useForm({
        defaultValues: {
            name: '',
            roles: [] as string[],
            isActive: true
        }
    });

    useEffect(() => {
        if (open && initialData) {
            form.reset({
                name: initialData.name || '',
                roles: initialData.roles || [initialData.role] || [],
                isActive: initialData.isActive ?? true
            });
        }
    }, [open, initialData, form]);

    const onSubmit = async (data: any) => {
        if (!initialData?.id) return;

        setLoading(true);
        try {
            const result = await updateUser(initialData.id, {
                name: data.name,
                roles: data.roles,
                isActive: data.isActive
            });

            if (result.success) {
                toast.success('用户更新成功');
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(result.error || '更新失败');
            }
        } catch (e) {
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

                    <div className="space-y-2">
                        <Label>角色</Label>
                        <MultiSelect
                            options={ROLE_OPTIONS}
                            selected={form.watch('roles')}
                            onChange={(vals) => form.setValue('roles', vals)}
                            placeholder="选择角色..."
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
