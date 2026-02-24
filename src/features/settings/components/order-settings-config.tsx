'use client';
import { logger } from '@/shared/lib/logger';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/shared/ui/form';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import Save from 'lucide-react/dist/esm/icons/save';
import { getSettingsByCategory, batchUpdateSettings } from '../actions/system-settings-actions';

/**
 * 订单设置组件
 * 包含：撤单审批
 */

interface OrderSettingsFormData {
    ENABLE_ORDER_CANCEL_APPROVAL: boolean;
    ORDER_CANCEL_APPROVER_ROLE: string;
}

const APPROVER_ROLES = [
    { value: 'STORE_MANAGER', label: '店长' },
    { value: 'ADMIN', label: '管理员' },
];

export function OrderSettingsConfig() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<OrderSettingsFormData>({
        defaultValues: {
            ENABLE_ORDER_CANCEL_APPROVAL: true,
            ORDER_CANCEL_APPROVER_ROLE: 'STORE_MANAGER',
        },
    });

    useEffect(() => {
        let isMounted = true;
        async function loadSettings() {
            try {
                setError(null);
                const settings = await getSettingsByCategory('ORDER');
                if (settings && Object.keys(settings).length > 0 && isMounted) {
                    form.reset(settings as unknown as OrderSettingsFormData);
                }
            } catch (err) {
                if (isMounted) {
                    logger.error('加载订单设置失败:', err);
                    setError(err instanceof Error ? err.message : '获取配置失败');
                    toast.error('加载订单设置失败');
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

    const onSubmit = async (data: OrderSettingsFormData) => {
        try {
            setIsSaving(true);
            await batchUpdateSettings(data as unknown as Record<string, unknown>);
            toast.success('订单设置已保存');
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
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">撤单审批设置</CardTitle>
                        <CardDescription className="text-xs">配置订单撤销审批规则</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="ENABLE_ORDER_CANCEL_APPROVAL"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>启用撤单审批</FormLabel>
                                        <FormDescription className="text-xs">
                                            开启后撤单需审批通过（仅限待下单状态）
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="ORDER_CANCEL_APPROVER_ROLE"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm">审批人角色</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-9 w-48">
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
