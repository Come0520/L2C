'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
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
            const { batchUpdateSettings } = await import('@/features/settings/actions/system-settings-actions');
            await batchUpdateSettings(
                Object.fromEntries(
                    Object.entries(data).map(([key, value]) => [`system.${key}`, value])
                )
            );
            toast.success('系统参数配置已保存');
        } catch (error) {
            toast.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">系统参数配置</CardTitle>
                                <CardDescription className="text-xs">配置报价、提醒和排期参数</CardDescription>
                            </div>
                            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Save className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                保存配置
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* 报价设置 */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-medium text-muted-foreground">报价设置</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="quoteValidityDays"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-sm">报价有效期（天）</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={365}
                                                    className="h-9"
                                                    {...field}
                                                    onChange={e => field.onChange(parseInt(e.target.value) || 30)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="quoteFollowupDays"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-sm">跟进提醒（天）</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={30}
                                                    className="h-9"
                                                    {...field}
                                                    onChange={e => field.onChange(parseInt(e.target.value) || 3)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* 提醒规则 */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-medium text-muted-foreground">提醒规则</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="orderDeliveryReminderDays"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-sm">发货提醒（天）</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={30}
                                                    className="h-9"
                                                    {...field}
                                                    onChange={e => field.onChange(parseInt(e.target.value) || 3)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="paymentDueReminderDays"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-sm">回款提醒（天）</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={30}
                                                    className="h-9"
                                                    {...field}
                                                    onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* 服务排期 */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-medium text-muted-foreground">服务排期</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="measureScheduleBufferDays"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-sm">最早可预约测量时间（当前+N天）</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={14}
                                                    className="h-9"
                                                    {...field}
                                                    onChange={e => field.onChange(parseInt(e.target.value) || 2)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="installScheduleBufferDays"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-sm">最早可预约安装时间（当前+N天）</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={14}
                                                    className="h-9"
                                                    {...field}
                                                    onChange={e => field.onChange(parseInt(e.target.value) || 3)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}

