'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/shared/ui/form';
import { Input } from '@/components/ui/input';
import { changePassword } from '../actions/profile-actions';

const passwordFormSchema = z.object({
    oldPassword: z.string().min(1, '请输入旧密码'),
    newPassword: z.string()
        .min(8, '密码至少8位')
        .regex(/[a-zA-Z]/, '密码必须包含字母')
        .regex(/[0-9]/, '密码必须包含数字'),
    confirmPassword: z.string().min(1, '请确认新密码'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的新密码不一致',
    path: ['confirmPassword'],
}).refine((data) => data.oldPassword !== data.newPassword, {
    message: '新密码不能与旧密码相同',
    path: ['newPassword'],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function PasswordChangeForm() {
    const [isPending, startTransition] = useTransition();

    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    function onSubmit(data: PasswordFormValues) {
        startTransition(async () => {
            const result = await changePassword(data);
            if (result.success) {
                toast.success('密码已成功修改');
                form.reset();
            } else {
                toast.error(result.error || '修改失败');
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="oldPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>当前密码</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="请输入当前使用的密码" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>新密码</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="请输入新密码" {...field} />
                            </FormControl>
                            <FormDescription>
                                密码长度至少8位，且必须包含字母和数字。
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>确认新密码</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="请再次输入新密码" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isPending}>
                    {isPending ? '提交中...' : '修改密码'}
                </Button>
            </form>
        </Form>
    );
}
