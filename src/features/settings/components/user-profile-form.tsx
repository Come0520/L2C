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
import { updateProfile } from '../actions/profile-actions';
import { User } from 'next-auth';

const profileFormSchema = z.object({
    name: z.string().min(2, '姓名至少2个字符').max(20, '姓名最多20个字符'),
    phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional().or(z.literal('')),
    image: z.string().url('头像链接无效').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ExtendedUser extends User {
    name?: string | null;
    image?: string | null;
    phone?: string | null;
    email?: string | null;
}

interface UserProfileFormProps {
    user: ExtendedUser;
}

export function UserProfileForm({ user }: UserProfileFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: user.name || '',
            phone: user.phone || '',
            image: user.image || '',
        },
    });

    function onSubmit(data: ProfileFormValues) {
        startTransition(async () => {
            const result = await updateProfile(data);
            if (result.success) {
                toast.success('个人信息已更新');
            } else {
                toast.error(result.error || '更新失败');
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>姓名</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入您的姓名" {...field} />
                            </FormControl>
                            <FormDescription>
                                这是您在系统中显示的名称。
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>手机号</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入手机号" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>头像链接</FormLabel>
                            <FormControl>
                                <Input placeholder="https://example.com/avatar.jpg" {...field} />
                            </FormControl>
                            <FormDescription>
                                支持外部图片链接作为头像。
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isPending}>
                    {isPending ? '保存中...' : '保存更改'}
                </Button>
            </form>
        </Form>
    );
}
