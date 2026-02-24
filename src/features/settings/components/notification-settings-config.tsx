'use client';
import { logger } from '@/shared/lib/logger';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/shared/ui/form';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import Save from 'lucide-react/dist/esm/icons/save';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import { getSettingsByCategory, batchUpdateSettings } from '../actions/system-settings-actions';

/**
 * 通知设置组件
 * 包含：系统内通知、短信、微信
 */

interface NotificationSettingsFormData {
    ENABLE_SYSTEM_NOTIFICATION: boolean;
    ENABLE_SMS_NOTIFICATION: boolean;
    ENABLE_WECHAT_NOTIFICATION: boolean;
}

export function NotificationSettingsConfig() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<NotificationSettingsFormData>({
        defaultValues: {
            ENABLE_SYSTEM_NOTIFICATION: true,
            ENABLE_SMS_NOTIFICATION: false,
            ENABLE_WECHAT_NOTIFICATION: true,
        },
    });

    useEffect(() => {
        let isMounted = true;
        async function loadSettings() {
            try {
                setError(null);
                const settings = await getSettingsByCategory('NOTIFICATION');
                if (settings && Object.keys(settings).length > 0 && isMounted) {
                    form.reset(settings as unknown as NotificationSettingsFormData);
                }
            } catch (err) {
                if (isMounted) {
                    logger.error('加载通知设置失败:', err);
                    setError(err instanceof Error ? err.message : '获取配置失败');
                    toast.error('加载通知设置失败');
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

    const onSubmit = async (data: NotificationSettingsFormData) => {
        try {
            setIsSaving(true);
            await batchUpdateSettings(data as unknown as Record<string, unknown>);
            toast.success('通知设置已保存');
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
                    <CardContent className="space-y-3">
                        <div className="h-16 w-full bg-muted rounded-lg"></div>
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
                        <CardTitle className="text-base">通知渠道设置</CardTitle>
                        <CardDescription className="text-xs">配置启用的通知渠道</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <FormField
                            control={form.control}
                            name="ENABLE_SYSTEM_NOTIFICATION"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex items-center gap-3">
                                        <Bell className="h-5 w-5 text-muted-foreground" />
                                        <div className="space-y-0.5">
                                            <FormLabel>系统内通知</FormLabel>
                                            <FormDescription className="text-xs">在消息中心显示通知</FormDescription>
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="ENABLE_WECHAT_NOTIFICATION"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare className="h-5 w-5 text-green-500" />
                                        <div className="space-y-0.5">
                                            <FormLabel>微信通知</FormLabel>
                                            <FormDescription className="text-xs">通过微信小程序/公众号发送</FormDescription>
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="ENABLE_SMS_NOTIFICATION"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-5 w-5 text-blue-500" />
                                        <div className="space-y-0.5">
                                            <FormLabel>短信通知</FormLabel>
                                            <FormDescription className="text-xs">通过短信网关发送（需配置）</FormDescription>
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
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
