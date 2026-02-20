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

    const newPassword = form.watch('newPassword');

    const calculateStrength = (password: string) => {
        if (!password) return 0;
        let score = 0;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    };

    const strength = calculateStrength(newPassword);

    const getStrengthColor = (score: number) => {
        switch (score) {
            case 1: return 'bg-red-500';
            case 2: return 'bg-orange-500';
            case 3: return 'bg-yellow-500';
            case 4: return 'bg-green-500';
            default: return 'bg-gray-200';
        }
    };

    const getStrengthText = (score: number) => {
        switch (score) {
            case 1: return '弱';
            case 2: return '中';
            case 3: return '好';
            case 4: return '极强';
            default: return '';
        }
    };

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
                            {newPassword && (
                                <div className="mt-2 space-y-2">
                                    <div className="flex gap-1 h-1.5">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={`flex-1 rounded-full transition-colors duration-300 ${i <= strength ? getStrengthColor(strength) : 'bg-gray-200'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs font-medium ${strength > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        密码强度: {getStrengthText(strength) || '未知'}
                                    </p>
                                </div>
                            )}
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

                <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
                    {isPending ? '提交中...' : '修改密码'}
                </Button>
            </form>
        </Form>
    );
}

