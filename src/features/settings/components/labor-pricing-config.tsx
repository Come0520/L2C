'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useState } from 'react';

/**
 * 劳务工费定价配置
 * 
 * 功能：
 * 1. 按产品类型设置基础安装单价
 * 2. 附加费用配置（高空作业费、夜间费等）
 * 3. 区域差异系数
 */

// 劳务定价 Schema
const laborPricingSchema = z.object({
    // 窗帘安装基础费用
    curtainBasePrice: z.number().min(0, '不能为负'),
    curtainPricePerSquareMeter: z.number().min(0, '不能为负'),

    // 墙纸安装基础费用
    wallpaperBasePrice: z.number().min(0, '不能为负'),
    wallpaperPricePerSquareMeter: z.number().min(0, '不能为负'),

    // 附加费用
    highRiseExtraFee: z.number().min(0, '不能为负'), // 高空作业费 (6楼+)
    weekendExtraRatio: z.number().min(0).max(2, '最大200%'), // 周末加班系数
    nightExtraRatio: z.number().min(0).max(2, '最大200%'), // 夜间施工系数
    urgentExtraRatio: z.number().min(0).max(2, '最大200%'), // 紧急订单系数

    // 其他
    minOrderAmount: z.number().min(0, '不能为负'), // 起步价
    maxDailyTasks: z.number().min(1).max(20), // 每人每日最大任务数
});

type LaborPricingFormData = z.infer<typeof laborPricingSchema>;

interface LaborPricingConfigProps {
    initialValues?: Partial<LaborPricingFormData>;
    onSave?: (data: LaborPricingFormData) => Promise<void>;
}

export function LaborPricingConfig({ initialValues, onSave }: LaborPricingConfigProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LaborPricingFormData>({
        resolver: zodResolver(laborPricingSchema),
        defaultValues: {
            // 窗帘默认值
            curtainBasePrice: initialValues?.curtainBasePrice ?? 50,
            curtainPricePerSquareMeter: initialValues?.curtainPricePerSquareMeter ?? 30,

            // 墙纸默认值
            wallpaperBasePrice: initialValues?.wallpaperBasePrice ?? 60,
            wallpaperPricePerSquareMeter: initialValues?.wallpaperPricePerSquareMeter ?? 15,

            // 附加费用默认值
            highRiseExtraFee: initialValues?.highRiseExtraFee ?? 50,
            weekendExtraRatio: initialValues?.weekendExtraRatio ?? 1.5,
            nightExtraRatio: initialValues?.nightExtraRatio ?? 1.8,
            urgentExtraRatio: initialValues?.urgentExtraRatio ?? 1.3,

            // 其他默认值
            minOrderAmount: initialValues?.minOrderAmount ?? 100,
            maxDailyTasks: initialValues?.maxDailyTasks ?? 6,
        },
    });

    const onSubmit = async (data: LaborPricingFormData) => {
        try {
            setIsLoading(true);
            if (onSave) {
                await onSave(data);
            } else {
                // TODO: 调用后端 Action 保存配置
                console.log('保存劳务工费配置:', data);
            }
            toast.success('劳务工费配置已保存');
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
                    {/* 窗帘安装费用 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>窗帘安装费用</CardTitle>
                            <CardDescription>设置窗帘产品的基础安装单价</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="curtainBasePrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>基础上门费（元/次）</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                step={10}
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            每次上门的固定费用
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="curtainPricePerSquareMeter"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>面积单价（元/㎡）</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                step={5}
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            按安装面积计算的单价
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* 墙纸安装费用 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>墙纸安装费用</CardTitle>
                            <CardDescription>设置墙纸产品的基础安装单价</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="wallpaperBasePrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>基础上门费（元/次）</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                step={10}
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="wallpaperPricePerSquareMeter"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>面积单价（元/㎡）</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                step={5}
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* 附加费用系数 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>附加费用</CardTitle>
                            <CardDescription>设置特殊情况下的费用加成</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="highRiseExtraFee"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>高空作业费（元/次）</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                step={10}
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            6楼以上加收
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="weekendExtraRatio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>周末加班系数</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={3}
                                                step={0.1}
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            周末施工费用 = 基础费用 × 系数
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nightExtraRatio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>夜间施工系数</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={3}
                                                step={0.1}
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            夜间（18:00后）施工费用系数
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="urgentExtraRatio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>紧急订单系数</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={3}
                                                step={0.1}
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            24小时内需完成的订单
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* 其他设置 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>其他设置</CardTitle>
                            <CardDescription>劳务调度相关参数</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="minOrderAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>最低起步价（元）</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                step={10}
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            单次上门最低收费
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxDailyTasks"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>每人每日最大任务数</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={20}
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value) || 6)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            用于调度系统排期
                                        </FormDescription>
                                        <FormMessage />
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
