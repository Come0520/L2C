'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import Save from 'lucide-react/dist/esm/icons/save';
import { useState } from 'react';

/**
 * 财务基础配置
 * 
 * 功能：
 * 1. 税率设置
 * 2. 收付款规则
 * 3. 对账周期配置
 */

const financeConfigSchema = z.object({
    // 税率设置
    defaultTaxRate: z.number().min(0).max(0.5, '税率不能超过50%'),
    isTaxInclusive: z.boolean(), // 是否含税报价

    // 收款规则
    downPaymentRatio: z.number().min(0.1).max(1, '预付款比例在10%-100%之间'),
    paymentTermDays: z.number().min(0).max(180, '最长180天'),

    // 对账周期
    reconciliationPeriod: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
    autoGenerateStatement: z.boolean(), // 自动生成对账单

    // 提醒设置
    paymentOverdueReminderDays: z.number().min(1).max(30),
    settlementReminderEnabled: z.boolean(),

    // 开票设置
    invoicePrefix: z.string().max(10),
    autoInvoiceOnComplete: z.boolean(),
});

type FinanceConfigFormData = z.infer<typeof financeConfigSchema>;

interface FinanceBaseConfigProps {
    initialValues?: Partial<FinanceConfigFormData>;
    onSave?: (data: FinanceConfigFormData) => Promise<void>;
}

export function FinanceBaseConfig({ initialValues, onSave }: FinanceBaseConfigProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FinanceConfigFormData>({
        resolver: zodResolver(financeConfigSchema),
        defaultValues: {
            defaultTaxRate: initialValues?.defaultTaxRate ?? 0.13,
            isTaxInclusive: initialValues?.isTaxInclusive ?? true,
            downPaymentRatio: initialValues?.downPaymentRatio ?? 0.5,
            paymentTermDays: initialValues?.paymentTermDays ?? 30,
            reconciliationPeriod: initialValues?.reconciliationPeriod ?? 'MONTHLY',
            autoGenerateStatement: initialValues?.autoGenerateStatement ?? true,
            paymentOverdueReminderDays: initialValues?.paymentOverdueReminderDays ?? 3,
            settlementReminderEnabled: initialValues?.settlementReminderEnabled ?? true,
            invoicePrefix: initialValues?.invoicePrefix ?? 'INV',
            autoInvoiceOnComplete: initialValues?.autoInvoiceOnComplete ?? false,
        },
    });

    const onSubmit = async (data: FinanceConfigFormData) => {
        try {
            setIsLoading(true);
            if (onSave) {
                await onSave(data);
            }
            toast.success('财务配置已保存');
        } catch (error) {
            toast.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* 税率设置 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>税率设置</CardTitle>
                            <CardDescription>配置默认税率和含税模式</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="defaultTaxRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>默认税率</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={0.5}
                                                step={0.01}
                                                {...field}
                                                value={(field.value * 100).toFixed(0)}
                                                onChange={e => field.onChange((parseFloat(e.target.value) || 0) / 100)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            增值税率 (如: 13 表示 13%)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isTaxInclusive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">含税报价</FormLabel>
                                            <FormDescription>
                                                报价金额是否默认含税
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* 收款规则 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>收款规则</CardTitle>
                            <CardDescription>配置预付款和账期</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="downPaymentRatio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>最低预付款比例</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={10}
                                                max={100}
                                                step={5}
                                                {...field}
                                                value={(field.value * 100).toFixed(0)}
                                                onChange={e => field.onChange((parseFloat(e.target.value) || 50) / 100)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            订单确认时最低预付款 (如: 50 表示 50%)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="paymentTermDays"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>默认账期（天）</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={180}
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value) || 30)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            订单完成后尾款支付期限
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* 对账设置 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>对账设置</CardTitle>
                            <CardDescription>配置对账周期和提醒</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="paymentOverdueReminderDays"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>逾期提醒（天）</FormLabel>
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
                                            应收逾期N天后自动提醒
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="autoGenerateStatement"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">自动生成对账单</FormLabel>
                                            <FormDescription>
                                                订单完成时自动生成 AR 对账单
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
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
