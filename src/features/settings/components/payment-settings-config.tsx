'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/shared/ui/form';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { getSettingsByCategory, batchUpdateSettings } from '../actions/system-settings-actions';

/**
 * 收款设置组件
 * 包含：收款审批、免费测量审批
 */

interface PaymentSettingsFormData {
    ENABLE_PAYMENT_APPROVAL: boolean;
    PAYMENT_APPROVER_ROLE: string;
    EARNEST_MONEY_MAX_RATIO: number;
    ENABLE_FREE_MEASURE_APPROVAL: boolean;
    FREE_MEASURE_APPROVAL_TIMEOUT: number;
}

const APPROVER_ROLES = [
    { value: 'STORE_MANAGER', label: '店长' },
    { value: 'FINANCE', label: '财务' },
    { value: 'ADMIN', label: '管理员' },
];

export function PaymentSettingsConfig() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<PaymentSettingsFormData>({
        defaultValues: {
            ENABLE_PAYMENT_APPROVAL: true,
            PAYMENT_APPROVER_ROLE: 'STORE_MANAGER',
            EARNEST_MONEY_MAX_RATIO: 0.5,
            ENABLE_FREE_MEASURE_APPROVAL: true,
            FREE_MEASURE_APPROVAL_TIMEOUT: 24,
        },
    });

    useEffect(() => {
        let isMounted = true;
        async function loadSettings() {
            try {
                setError(null);
                const settings = await getSettingsByCategory('PAYMENT');
                if (settings && Object.keys(settings).length > 0 && isMounted) {
                    form.reset(settings as unknown as PaymentSettingsFormData);
                }
            } catch (err) {
                if (isMounted) {
                    console.error('加载收款设置失败:', err);
                    setError(err instanceof Error ? err.message : '获取配置失败');
                    toast.error('加载收款设置失败');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }
        loadSettings();
        return () => { isMounted = false; };
    }, [form]);

    const onSubmit = async (data: PaymentSettingsFormData) => {
        try {
            setIsSaving(true);
            await batchUpdateSettings(data as unknown as Record<string, unknown>);
            toast.success('收款设置已保存');
        } catch (error) {
            toast.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="h-5 w-32 bg-muted rounded"></div>
                        <div className="h-3 w-48 bg-muted rounded mt-2"></div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="h-16 w-full bg-muted rounded-lg"></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="h-16 w-full bg-muted rounded"></div>
                            <div className="h-16 w-full bg-muted rounded"></div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <div className="h-5 w-32 bg-muted rounded"></div>
                        <div className="h-3 w-48 bg-muted rounded mt-2"></div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="h-16 w-full bg-muted rounded-lg"></div>
                        <div className="h-16 w-full bg-muted rounded-lg"></div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-destructive">
                    <p className="text-sm font-medium mb-2">配置加载失败</p>
                    <p className="text-xs text-muted-foreground mb-4">{error}</p>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        刷新重试
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* 收款审批设置 */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">收款审批设置</CardTitle>
                        <CardDescription className="text-xs">配置收款审批规则</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="ENABLE_PAYMENT_APPROVAL"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>启用收款审批</FormLabel>
                                        <FormDescription className="text-xs">开启后收款需审批通过才能生效</FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="PAYMENT_APPROVER_ROLE"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm">审批人角色</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {APPROVER_ROLES.map(role => (
                                                    <SelectItem key={role.value} value={role.value}>
                                                        {role.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="EARNEST_MONEY_MAX_RATIO"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm">定金最大比例</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0.1}
                                                max={1}
                                                step={0.1}
                                                className="h-9"
                                                value={field.value}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0.5)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 免费测量审批设置 */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">免费测量审批</CardTitle>
                        <CardDescription className="text-xs">配置免费测量审批规则</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="ENABLE_FREE_MEASURE_APPROVAL"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>启用免费测量审批</FormLabel>
                                        <FormDescription className="text-xs">开启后免费测量需审批通过</FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="FREE_MEASURE_APPROVAL_TIMEOUT"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm">审批超时时长（小时）</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={168}
                                            className="h-9 w-32"
                                            value={field.value}
                                            onChange={e => field.onChange(parseInt(e.target.value) || 24)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        保存设置
                    </Button>
                </div>
            </form>
        </Form>
    );
}
