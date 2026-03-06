'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { isValidPhoneNumber } from 'libphonenumber-js/min';
import { Button } from '@/shared/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { PhoneInput } from '@/shared/ui/phone-input';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { cn } from '@/shared/lib/utils';
import { updateProfile } from '../actions/profile-actions';
import { User } from 'next-auth';

const profileFormSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符').max(20, '姓名最多20个字符'),
  phone: z
    .string()
    .refine((val) => !val || isValidPhoneNumber(val, 'CN'), { message: '请输入有效的电话号码' })
    .optional()
    .or(z.literal('')),
  image: z.string().url('头像链接无效').optional().or(z.literal('')),
  avatarText: z.string().max(2, '最多2个字符').optional().or(z.literal('')),
  avatarBgColor: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ExtendedUser extends User {
  name?: string | null;
  image?: string | null;
  phone?: string | null;
  email?: string | null;
  preferences?: {
    avatarBgColor?: string;
    avatarText?: string;
    [key: string]: unknown;
  }
}

interface UserProfileFormProps {
  user: ExtendedUser;
}

const PRESET_COLORS = [
  { label: '品牌紫', value: 'bg-primary-500' },
  { label: '天空蓝', value: '#3b82f6' },
  { label: '翡翠绿', value: '#10b981' },
  { label: '活力橙', value: '#f97316' },
  { label: '玫瑰红', value: '#e11d48' },
  { label: '曜石黑', value: '#18181b' },
];

export function UserProfileForm({ user }: UserProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || '',
      phone: user.phone || '',
      image: user.image || '',
      avatarText: user.preferences?.avatarText || '',
      avatarBgColor: user.preferences?.avatarBgColor || 'bg-primary-500',
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓名</FormLabel>
              <FormControl>
                <Input placeholder="请输入您的姓名" {...field} />
              </FormControl>
              <FormDescription>这是您在系统中显示的名称。</FormDescription>
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
                <PhoneInput placeholder="请输入手机号" {...field} value={field.value || ''} />
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
              <FormDescription>支持外部图片链接作为头像。如果设置了图片链接，将优先显示图片。</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-lg border p-4">
          <h4 className="text-sm font-medium">个性化头像设置</h4>
          <p className="text-sm text-muted-foreground">如果您没有设置头像图片链接，系统将使用以下设置生成您的默认头像。</p>

          <FormField
            control={form.control}
            name="avatarText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>头像显示文字</FormLabel>
                <FormControl>
                  <Input placeholder="默认使用姓名首字母" {...field} />
                </FormControl>
                <FormDescription>建议输入 1-2 个字符，如："A" 或 "张三"。</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="avatarBgColor"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>头像背景颜色</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-wrap gap-4"
                  >
                    {PRESET_COLORS.map((color) => (
                      <FormItem key={color.value} className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={color.value} className="sr-only" />
                        </FormControl>
                        <FormLabel
                          className={cn(
                            "group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 ring-offset-background transition-all hover:scale-110",
                            color.value.startsWith('#') ? "" : color.value,
                            field.value === color.value ? "border-foreground" : "border-transparent ring-1 ring-border"
                          )}
                          style={{ backgroundColor: color.value.startsWith('#') ? color.value : undefined }}
                        >
                          <span className="sr-only">{color.label}</span>
                          {field.value === color.value && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20 text-white">
                              ✓
                            </div>
                          )}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? '保存中...' : '保存更改'}
        </Button>
      </form>
    </Form>
  );
}
