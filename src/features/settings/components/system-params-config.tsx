'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

/**
 * 系统参数配置表单 Schema
 * [Settings-02] 系统参数配置
 */
const systemParamsSchema = z.object({
    // 报价相关
    quoteValidityDays: z.number().min(1, '最少1天').max(365, '最多365天'),
    quoteFollowupDays: z.number().min(1, '最少1天').max(30, '最多30天'),

    // 提醒相关
    orderDeliveryReminderDays: z.number().min(1).max(30),
    paymentDueReminderDays: z.number().min(1).max(30),

    // 测量/安装相关
    measureScheduleBufferDays: z.number().min(0).max(14),
    installScheduleBufferDays: z.number().min(0).max(14),
});

type SystemParamsFormData = z.infer<typeof systemParamsSchema>;

interface SystemParamsConfigProps {
    initialValues?: Partial<SystemParamsFormData>;
}

export function SystemParamsConfig({ initialValues }: SystemParamsConfigProps) {
    const form = useForm<SystemParamsFormData>({
        resolver: zodResolver(systemParamsSchema),
        defaultValues: {
            quoteValidityDays: initialValues?.quoteValidityDays ?? 30,
            quoteFollowupDays: initialValues?.quoteFollowupDays ?? 3,
            orderDeliveryReminderDays: initialValues?.orderDeliveryReminderDays ?? 3,
            paymentDueReminderDays: initialValues?.paymentDueReminderDays ?? 1,
            measureScheduleBufferDays: initialValues?.measureScheduleBufferDays ?? 2,
            installScheduleBufferDays: initialValues?.installScheduleBufferDays ?? 3,
        },
    });

    const onSubmit = async (data: SystemParamsFormData) => {
        try {
            // TODO: 调用后端 Action 保存配置
            console.log('保存系统参数:', data);
            toast.success('系统参数配置已保存');
        } catch (error) {
            toast.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
        }
    };

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* 报价设置卡片 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>报价设置</CardTitle>
                            <CardDescription>配置报价单的默认参数</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="quoteValidityDays"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>报价有效期（天）</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={365}
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value) || 30)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            新报价单的默认有效天数
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="quoteFollowupDays"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>跟进提醒（天）</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={30}
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value) || 3)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            报价超过此天数未跟进则提醒
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* 提醒规则卡片 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>提醒规则</CardTitle>
                            <CardDescription>配置系统自动提醒的触发条件</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="orderDeliveryReminderDays"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>发货提醒（天）</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={30}
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value) || 3)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            订单预计发货前N天提醒
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="paymentDueReminderDays"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>回款提醒（天）</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={30}
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            应收到期前N天提醒
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* 服务排期卡片 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>服务排期</CardTitle>
                            <CardDescription>配置测量和安装服务的排期参数</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="measureScheduleBufferDays"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>测量预约缓冲（天）</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={14}
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value) || 2)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            最早可预约测量时间（当前+N天）
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="installScheduleBufferDays"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>安装预约缓冲（天）</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={14}
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value) || 3)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            最早可预约安装时间（当前+N天）
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            保存配置
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
