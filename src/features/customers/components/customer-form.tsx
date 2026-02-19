'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '../schemas';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { ChannelPicker } from '@/features/channels/components/channel-picker';
import { createCustomer, updateCustomer } from '../actions/mutations';
import { toast } from 'sonner';
import { useTransition } from 'react';
import { z } from 'zod';
import { CustomerDetail } from '@/features/customers/types';

interface CustomerFormProps {
    onSuccess?: (customer?: { id: string }) => void;
    tenantId: string;
    initialData?: Partial<CustomerDetail>;
}

type FormValues = z.infer<typeof customerSchema>;

/**
 * 客户表单组件
 *
 * 用于创建和编辑客户信息，包含：
 * - 基本信息（姓名、电话、微信等）
 * - 客户类型和等级
 * - 渠道来源和带单人
 * - 地址和备注
 */
export function CustomerForm({ onSuccess, tenantId, initialData }: CustomerFormProps) {
    const [isPending, startTransition] = useTransition();
    const isEdit = !!initialData;

    const form = useForm<FormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(customerSchema) as any,
        defaultValues: {
            name: initialData?.name || '',
            phone: initialData?.phone || '',
            phoneSecondary: initialData?.phoneSecondary || undefined,
            wechat: initialData?.wechat || '',
            type: (initialData?.type as unknown as FormValues['type']) || 'INDIVIDUAL',
            level: (initialData?.level as unknown as FormValues['level']) || 'D',
            address: initialData?.addresses?.find((a) => a.isDefault)?.address || '',
            notes: initialData?.notes || '',
            source: initialData?.source || '',
            referrerName: initialData?.referrerName || '',
        },
    });

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            try {
                if (isEdit && initialData?.id) {
                    await updateCustomer({ id: initialData.id, data: values });
                    toast.success('客户更新成功');
                    onSuccess?.();
                } else {
                    const result = await createCustomer(values);
                    toast.success('客户创建成功');
                    onSuccess?.(result);
                }
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : (isEdit ? '更新失败' : '创建失败');
                toast.error(message);
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>客户姓名 *</FormLabel>
                                <FormControl>
                                    <Input placeholder="输入姓名" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>手机号 *</FormLabel>
                                <FormControl>
                                    <Input placeholder="输入11位手机号" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* 客户类型和等级 */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>客户类型</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="选择类型" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="INDIVIDUAL">个人</SelectItem>
                                        <SelectItem value="COMPANY">公司</SelectItem>
                                        <SelectItem value="DESIGNER">设计师</SelectItem>
                                        <SelectItem value="PARTNER">合作伙伴</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="level"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>客户等级</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="选择等级" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="D">D级 (普通)</SelectItem>
                                        <SelectItem value="C">C级 (重要)</SelectItem>
                                        <SelectItem value="B">B级 (核心)</SelectItem>
                                        <SelectItem value="A">A级 (VIP)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* 渠道来源和带单人 */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>渠道来源</FormLabel>
                                <FormControl>
                                    <ChannelPicker
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        tenantId={tenantId}
                                        placeholder="选择渠道来源"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="referrerName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>带单人</FormLabel>
                                <FormControl>
                                    <Input placeholder="设计师/介绍人姓名" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* 微信和备用电话 */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="wechat"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>微信号</FormLabel>
                                <FormControl>
                                    <Input placeholder="选填" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phoneSecondary"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>备用电话</FormLabel>
                                <FormControl>
                                    <Input placeholder="选填" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* 地址（仅新建时显示） */}
                {!isEdit && (
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>默认地址</FormLabel>
                                <FormControl>
                                    <Input placeholder="详细地址..." {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* 备注 */}
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>备注</FormLabel>
                            <FormControl>
                                <Textarea placeholder="备注信息..." {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? '保存中...' : (isEdit ? '保存更新' : '创建客户')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
