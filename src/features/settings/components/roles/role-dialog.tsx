'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Checkbox } from '@/shared/ui/checkbox';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { createRole, updateRole } from '@/features/settings/actions/roles-management';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { PERMISSION_GROUPS, PERMISSION_LABELS } from '@/shared/config/permissions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui/accordion';

const roleSchema = z.object({
    code: z
        .string()
        .min(2, '角色代码至少2个字符')
        .regex(/^[A-Z0-9_]+$/, '角色代码只能包含大写字母、数字和下划线'),
    name: z.string().min(2, '角色名称至少2个字符'),
    description: z.string().optional(),
    permissions: z.array(z.string()).default([]),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleDialogProps {
    role?: {
        id: string;
        code: string;
        name: string;
        description?: string | null;
        permissions?: string[] | null;
    };
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function RoleDialog({ role, trigger, open, onOpenChange }: RoleDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Internal state for controlled/uncontrolled
    const show = open ?? isOpen;
    const setShow = onOpenChange ?? setIsOpen;

    const isEdit = !!role;

    const form = useForm<RoleFormValues>({
        // zodResolver 与 react-hook-form 泛型不完全匹配，使用 never 断言绕过
        resolver: zodResolver(roleSchema) as never,
        defaultValues: {
            code: role?.code || '',
            name: role?.name || '',
            description: role?.description || '',
            permissions: (role?.permissions as string[]) || [],
        },
    });

    // 当 role prop 变化时重置表单（编辑不同角色时刷新）
    useEffect(() => {
        form.reset({
            code: role?.code || '',
            name: role?.name || '',
            description: role?.description || '',
            permissions: (role?.permissions as string[]) || [],
        });
    }, [role?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    function onSubmit(values: RoleFormValues) {
        startTransition(async () => {
            try {
                let result;
                if (isEdit && role) {
                    result = await updateRole(role.id, {
                        name: values.name,
                        description: values.description,
                        permissions: values.permissions,
                    });
                } else {
                    result = await createRole(values);
                }

                if (result.success) {
                    toast.success(result.message);
                    setShow(false);
                    if (!isEdit) {
                        form.reset();
                    }
                } else {
                    toast.error(result.message);
                }
            } catch (error) {
                console.error(error);
                toast.error('操作失败');
            }
        });
    }

    const handlePermissionChange = (checked: boolean, code: string) => {
        const current = form.getValues('permissions');
        if (checked) {
            form.setValue('permissions', [...current, code]);
        } else {
            form.setValue(
                'permissions',
                current.filter((p) => p !== code)
            );
        }
    };

    return (
        <Dialog open={show} onOpenChange={setShow}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{isEdit ? '编辑角色' : '创建新角色'}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? '修改自定义角色的基本信息和权限。'
                            : '创建一个新的自定义角色并分配权限。'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 flex flex-col overflow-hidden">
                        <ScrollArea className="flex-1 pr-4 -mr-4">
                            <div className="space-y-4 p-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control as never}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>角色代码</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="MY_ROLE" {...field} disabled={isEdit} />
                                                </FormControl>
                                                <FormDescription>
                                                    唯一标识，创建后不可修改。建议使用大写字母。
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control as never}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>角色名称</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="我的角色" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control as never}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>描述</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="角色的职责描述..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-2">
                                    <FormLabel>权限配置</FormLabel>
                                    <div className="border rounded-md">
                                        <Accordion type="multiple" className="w-full">
                                            {PERMISSION_GROUPS.map((group) => (
                                                <AccordionItem key={group.key} value={group.key}>
                                                    <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-muted/50">
                                                        <div className="flex flex-col items-start text-left">
                                                            <span className="font-medium text-sm">{group.label}</span>
                                                            {group.description && (
                                                                <span className="text-xs text-muted-foreground font-normal">
                                                                    {group.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-4 py-2">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {Object.entries(group.permissions).map(([, code]) => {
                                                                const permissionCode = code as string;
                                                                return (
                                                                    <FormField
                                                                        key={permissionCode}
                                                                        control={form.control as never}
                                                                        name="permissions"
                                                                        render={({ field }) => {
                                                                            return (
                                                                                <FormItem
                                                                                    key={permissionCode}
                                                                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-2"
                                                                                >
                                                                                    <FormControl>
                                                                                        <Checkbox
                                                                                            checked={field.value?.includes(permissionCode)}
                                                                                            onCheckedChange={(checked) => {
                                                                                                handlePermissionChange(checked as boolean, permissionCode);
                                                                                            }}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <div className="space-y-1 leading-none">
                                                                                        <FormLabel className="cursor-pointer">
                                                                                            {PERMISSION_LABELS[permissionCode] || permissionCode}
                                                                                        </FormLabel>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            {permissionCode}
                                                                                        </p>
                                                                                    </div>
                                                                                </FormItem>
                                                                            );
                                                                        }}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        <DialogFooter className="pt-4 border-t mt-auto">
                            <Button type="button" variant="outline" onClick={() => setShow(false)}>
                                取消
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? '保存更改' : '创建角色'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
