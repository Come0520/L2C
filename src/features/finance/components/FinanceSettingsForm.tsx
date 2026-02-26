'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateFinanceConfigSchema } from '../actions/schema';
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
import { Button } from '@/shared/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { updateFinanceConfig } from '../actions/config';
import { toast } from 'sonner';
import { useTransition } from 'react';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

type FormValues = z.infer<typeof updateFinanceConfigSchema>;

interface FinanceSettingsFormProps {
    initialData?: Partial<FormValues>;
}

export function FinanceSettingsForm({ initialData }: FinanceSettingsFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm({
        resolver: zodResolver(updateFinanceConfigSchema),
        defaultValues: {
            allow_difference: initialData?.allow_difference ?? false,
            max_difference_amount: initialData?.max_difference_amount ?? 100,
            difference_handling: initialData?.difference_handling ?? 'MANUAL_RECORD',
            allow_rounding: initialData?.allow_rounding ?? false,
            rounding_mode: initialData?.rounding_mode ?? 'ROUND_HALF_UP',
            rounding_unit: initialData?.rounding_unit ?? 'YUAN',
        },
    });

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            try {
                await updateFinanceConfig(values);
                toast.success('财务配置更新成功');
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : '更新失败';
                toast.error(message);
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>收付款差异处理</CardTitle>
                        <CardDescription>配置订单金额与实际收付款金额不一致时的处理规则</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="allow_difference"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">允许金额差异</FormLabel>
                                        <FormDescription>
                                            是否允许结案时存在未结清的微小差额
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

                        {form.watch('allow_difference') && (
                            <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
                                <FormField
                                    control={form.control}
                                    name="max_difference_amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>最大允许差额 (元)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="difference_handling"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>差异处理方式</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="选择方式" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="AUTO_ADJUST">自动调账 (计入营业外收支)</SelectItem>
                                                    <SelectItem value="MANUAL_RECORD">手动记录 (需财务确认)</SelectItem>
                                                    <SelectItem value="FORBIDDEN">禁止结案 (必须完全结清)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>抹零规则</CardTitle>
                        <CardDescription>配置自动生成的对账单金额抹零规则</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="allow_rounding"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">启用自动抹零</FormLabel>
                                        <FormDescription>
                                            在生成应收/应付对账单时自动应用抹零
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

                        {form.watch('allow_rounding') && (
                            <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
                                <FormField
                                    control={form.control}
                                    name="rounding_unit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>抹零单位</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="选择单位" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="YUAN">元 (抹除非整数元)</SelectItem>
                                                    <SelectItem value="JIAO">角 (抹除非整数角)</SelectItem>
                                                    <SelectItem value="FEN">分 (不抹零)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="rounding_mode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>抹零方式</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="选择方式" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ROUND_DOWN">去尾法 (直接舍去)</SelectItem>
                                                    <SelectItem value="ROUND_HALF_UP">四舍五入</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? '保存中...' : '保存配置'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
