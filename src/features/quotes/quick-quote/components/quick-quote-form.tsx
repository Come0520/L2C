'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createQuickQuote } from '@/features/quotes/actions';

/**
 * 快速报价表单 Schema
 */
const quickQuoteFormSchema = z.object({
    planType: z.string().min(1, '请选择报价方案'),
    rooms: z.array(z.object({
        name: z.string().min(1, '请输入房间名称'),
        width: z.coerce.number().positive('宽度必须大于0'),
        height: z.coerce.number().positive('高度必须大于0'),
        hasSheer: z.boolean().default(false),
        hasBox: z.boolean().default(false),
        windowType: z.string().default('STRAIGHT'),
        hasFabric: z.boolean().default(true),
    })).min(1, '至少添加一个房间'),
});

type QuickQuoteFormValues = z.infer<typeof quickQuoteFormSchema>;

/**
 * 预设方案列表
 */
const PLAN_OPTIONS = [
    { value: 'ECONOMIC', label: '经济型', description: '基础面料 + 简约配件' },
    { value: 'STANDARD', label: '标准型', description: '中档面料 + 标准配件' },
    { value: 'PREMIUM', label: '豪华型', description: '高档面料 + 精品配件' },
];

interface QuickQuoteFormProps {
    leadId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plans?: any;
}

/**
 * 快速报价表单组件
 * 用于从线索详情页快速创建基于预设方案的报价
 */
export function QuickQuoteForm({ leadId }: QuickQuoteFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<QuickQuoteFormValues>({
        // 注意: zod 4 与 @hookform/resolvers 存在类型不兼容问题，运行时正常
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(quickQuoteFormSchema) as any,
        defaultValues: {
            planType: '',
            rooms: [
                {
                    name: '客厅',
                    width: 0,
                    height: 0,
                    hasSheer: false,
                    hasBox: false,
                    windowType: 'STRAIGHT',
                    hasFabric: true,
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'rooms',
    });

    const onSubmit = async (values: QuickQuoteFormValues) => {
        setIsSubmitting(true);
        try {
            const result = await createQuickQuote({
                leadId,
                planType: values.planType,
                rooms: values.rooms.map(room => ({
                    ...room,
                    width: room.width,
                    height: room.height,
                })),
            });

            if (result.success && result.data) {
                toast.success('报价单已生成');
                router.push(`/quotes/${result.data.id}`);
            } else {
                toast.error(result.error || '创建报价失败');
            }
        } catch (error) {
            console.error('QuickQuote Error:', error);
            toast.error('创建报价时发生错误');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedPlan = form.watch('planType');

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* 方案选择 */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">选择报价方案</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PLAN_OPTIONS.map((plan) => (
                            <Card
                                key={plan.value}
                                data-testid={`plan-${plan.value}`}
                                className={`cursor-pointer transition-all hover:shadow-md ${selectedPlan === plan.value
                                    ? 'ring-2 ring-primary border-primary'
                                    : 'hover:border-primary/50'
                                    }`}
                                onClick={() => form.setValue('planType', plan.value)}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{plan.label}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {form.formState.errors.planType && (
                        <p className="text-sm text-destructive mt-2">{form.formState.errors.planType.message}</p>
                    )}
                </div>

                {/* 房间列表 */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">房间信息</h2>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                append({
                                    name: '',
                                    width: 0,
                                    height: 0,
                                    hasSheer: false,
                                    hasBox: false,
                                    windowType: 'STRAIGHT',
                                    hasFabric: true,
                                })
                            }
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            添加房间
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <Card key={field.id} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* 房间名称 */}
                                    <FormField
                                        control={form.control}
                                        name={`rooms.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>房间名称</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="如 客厅" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* 宽度 */}
                                    <FormField
                                        control={form.control}
                                        name={`rooms.${index}.width`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>宽度 (cm)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="350" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* 高度 */}
                                    <FormField
                                        control={form.control}
                                        name={`rooms.${index}.height`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>高度 (cm)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="270" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* 删除按钮 */}
                                    <div className="flex items-end">
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => remove(index)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                删除
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* 附加选项 */}
                                <div className="flex gap-6 mt-4 pt-4 border-t">
                                    <FormField
                                        control={form.control}
                                        name={`rooms.${index}.hasSheer`}
                                        render={({ field }) => (
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel className="text-sm font-normal cursor-pointer">纱帘</FormLabel>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`rooms.${index}.hasBox`}
                                        render={({ field }) => (
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel className="text-sm font-normal cursor-pointer">窗帘盒</FormLabel>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`rooms.${index}.windowType`}
                                        render={({ field }) => (
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormLabel className="text-sm font-normal">窗型</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue placeholder="选择窗型" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="STRAIGHT">直窗</SelectItem>
                                                        <SelectItem value="BAY">飘窗</SelectItem>
                                                        <SelectItem value="L_SHAPE">L型</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* 提交按钮 */}
                <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        取消
                    </Button>
                    <Button
                        type="submit"
                        data-testid="submit-quote-btn"
                        disabled={isSubmitting || !selectedPlan}
                    >
                        {isSubmitting ? '生成中...' : '生成报价'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
