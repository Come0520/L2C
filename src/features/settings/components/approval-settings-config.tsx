'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/shared/ui/form';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { getSettingsByCategory, batchUpdateSettings } from '../actions/system-settings-actions';

/**
 * 审批流设置组件
 * 包含：超时提醒、自动升级
 */

interface ApprovalSettingsFormData {
    APPROVAL_TIMEOUT_REMINDER: number;
    ENABLE_APPROVAL_AUTO_ESCALATE: boolean;
    APPROVAL_AUTO_ESCALATE_TIMEOUT: number;
}

export function ApprovalSettingsConfig() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<ApprovalSettingsFormData>({
        defaultValues: {
            APPROVAL_TIMEOUT_REMINDER: 2,
            ENABLE_APPROVAL_AUTO_ESCALATE: true,
            APPROVAL_AUTO_ESCALATE_TIMEOUT: 24,
        },
    });

    useEffect(() => {
        async function loadSettings() {
            try {
                const settings = await getSettingsByCategory('APPROVAL');
                if (settings && Object.keys(settings).length > 0) {
                    form.reset(settings as unknown as ApprovalSettingsFormData);
                }
            } catch (error) {
                console.error('加载审批流设置失败:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, [form]);

    const onSubmit = async (data: ApprovalSettingsFormData) => {
        try {
            setIsSaving(true);
            await batchUpdateSettings(data as unknown as Record<string, unknown>);
            toast.success('审批流设置已保存');
        } catch (error) {
            toast.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">审批超时策略</CardTitle>
                        <CardDescription className="text-xs">配置审批超时提醒和自动升级</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="APPROVAL_TIMEOUT_REMINDER"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm">超时提醒时间（小时）</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={24}
                                            className="h-9 w-32"
                                            value={field.value}
                                            onChange={e => field.onChange(parseInt(e.target.value) || 2)}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        审批即将超时前多少小时提醒审批人
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="ENABLE_APPROVAL_AUTO_ESCALATE"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>启用超时自动升级</FormLabel>
                                        <FormDescription className="text-xs">
                                            审批超时后自动升级到上级审批人
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
                            name="APPROVAL_AUTO_ESCALATE_TIMEOUT"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm">自动升级超时时间（小时）</FormLabel>
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
