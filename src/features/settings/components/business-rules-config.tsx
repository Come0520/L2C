'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { getMyQuoteConfig, updateGlobalQuoteConfig } from '@/features/quotes/actions/config-actions';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/shared/ui/skeleton';

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

export function BusinessRulesConfig({ initialValues: propInitialValues }: BusinessRulesConfigProps) {
    const [isLoading, setIsLoading] = useState(!propInitialValues);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<BusinessRulesFormData>({
        resolver: zodResolver(businessRulesSchema),
        defaultValues: {
            minDiscountRate: propInitialValues?.minDiscountRate ?? 0.80,
            requireApprovalBelow: propInitialValues?.requireApprovalBelow ?? 0.90,
        },
    });

    useEffect(() => {
        if (propInitialValues) return;

        const loadConfig = async () => {
            try {
                const config = await getMyQuoteConfig();
                if (config?.discountControl) {
                    form.reset({
                        minDiscountRate: config.discountControl.minDiscountRate,
                        requireApprovalBelow: config.discountControl.requireApprovalBelow,
                    });
                }
            } catch (_error) {
                toast.error('加载业务规则失败');
            } finally {
                setIsLoading(false);
            }
        };

        loadConfig();
    }, [propInitialValues, form]);

    const onSubmit = async (data: BusinessRulesFormData) => {
        setIsSaving(true);
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
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full max-w-[200px]" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full max-w-[200px]" />
                    </div>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        );
    }

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
                        <fieldset disabled={isSaving} className="space-y-6">
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
                        </fieldset>

                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            保存配置
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
