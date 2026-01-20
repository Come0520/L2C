'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { updateGlobalQuoteConfig } from '@/features/quotes/actions/config-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const businessRulesSchema = z.object({
    minDiscountRate: z.number().min(0, '最低折扣率不能小于 0').max(1, '最低折扣率不能大于 1'),
    requireApprovalBelow: z.number().min(0, '审批阈值不能小于 0').max(1, '审批阈值不能大于 1'),
}).refine((data) => data.minDiscountRate <= data.requireApprovalBelow, {
    message: '最低折扣率必须小于等于审批阈值',
    path: ['minDiscountRate'],
});

type BusinessRulesFormData = z.infer<typeof businessRulesSchema>;

interface BusinessRulesConfigProps {
    initialValues?: {
        minDiscountRate?: number;
        requireApprovalBelow?: number;
    };
}

export function BusinessRulesConfig({ initialValues }: BusinessRulesConfigProps) {
    const form = useForm<BusinessRulesFormData>({
        resolver: zodResolver(businessRulesSchema),
        defaultValues: {
            minDiscountRate: initialValues?.minDiscountRate ?? 0.80,
            requireApprovalBelow: initialValues?.requireApprovalBelow ?? 0.90,
        },
    });

    const onSubmit = async (data: BusinessRulesFormData) => {
        try {
            const result = await updateGlobalQuoteConfig({
                discountControl: {
                    minDiscountRate: data.minDiscountRate,
                    requireApprovalBelow: data.requireApprovalBelow,
                },
            });

            if (result.success) {
                toast.success('业务规则配置已更新');
            } else {
                toast.error('更新失败');
            }
        } catch (error) {
            toast.error('更新失败: ' + (error instanceof Error ? error.message : '未知错误'));
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>业务规则配置</CardTitle>
                <CardDescription>
                    配置折扣控制规则，低于设定阈值的折扣将触发审批流程
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="minDiscountRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>最低折扣率</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="1"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                className="max-w-[200px]"
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                ({Math.round((field.value || 0) * 100)}% 折扣)
                                            </span>
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        系统允许的最低折扣率 (0-1)，例如 0.80 表示最低 8 折
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="requireApprovalBelow"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>需审批折扣阈值</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="1"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                className="max-w-[200px]"
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                ({Math.round((field.value || 0) * 100)}% 折扣)
                                            </span>
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        低于此折扣率的报价需要审批，例如 0.90 表示低于 9 折需审批
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
                            <h4 className="text-sm font-medium">规则说明</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                <li>最低折扣率：系统允许的最低折扣，低于此值将被拒绝</li>
                                <li>需审批阈值：低于此折扣率的报价需要提交审批流程</li>
                                <li>示例：设置最低折扣 80%，审批阈值 90%，则 85% 折扣需审批，75% 折扣被拒绝</li>
                            </ul>
                        </div>

                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            保存配置
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
