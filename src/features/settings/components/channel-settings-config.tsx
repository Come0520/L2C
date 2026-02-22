'use client';
import { logger } from '@/shared/lib/logger';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/shared/ui/form';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { getSettingsByCategory, batchUpdateSettings } from '../actions/system-settings-actions';
import { Skeleton } from '@/shared/ui/skeleton';

/**
 * 渠道设置组件
 * 包含：保护期、等级评定规则
 */

interface ChannelSettingsFormData {
    CHANNEL_PROTECTION_PERIOD: number;
}

export function ChannelSettingsConfig() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<ChannelSettingsFormData>({
        defaultValues: {
            CHANNEL_PROTECTION_PERIOD: 30,
        },
    });

    useEffect(() => {
        let isMounted = true;
        async function loadSettings() {
            try {
                setError(null);
                const settings = await getSettingsByCategory('CHANNEL');
                if (settings && Object.keys(settings).length > 0 && isMounted) {
                    form.reset(settings as unknown as ChannelSettingsFormData);
                }
            } catch (err) {
                if (isMounted) {
                    logger.error('加载渠道设置失败:', err);
                    setError(err instanceof Error ? err.message : '获取配置失败');
                    toast.error('加载渠道设置失败');
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

    const onSubmit = async (data: ChannelSettingsFormData) => {
        try {
            setIsSaving(true);
            await batchUpdateSettings(data as unknown as Record<string, unknown>);
            toast.success('渠道设置已保存');
        } catch (error) {
            toast.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-3 w-48 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-3 w-48 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-40 w-full" />
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
                <fieldset disabled={isSaving} className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">渠道保护期设置</CardTitle>
                            <CardDescription className="text-xs">配置渠道报备客户的保护期限</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="CHANNEL_PROTECTION_PERIOD"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>保护期（天）</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={365}
                                                className="h-9 w-32"
                                                value={field.value}
                                                onChange={e => field.onChange(parseInt(e.target.value) || 30)}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            A 渠道报备客户后，B 渠道在保护期内不得重复报备
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">渠道等级评定</CardTitle>
                            <CardDescription className="text-xs">等级规则仅作参考，实际返点在具体渠道中设置</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <div className="grid grid-cols-4 gap-2 font-medium text-foreground border-b pb-2">
                                    <span>等级</span>
                                    <span>名称</span>
                                    <span>年度成交额</span>
                                    <span>建议返点</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <span className="font-bold text-yellow-600">S</span>
                                    <span>战略伙伴</span>
                                    <span>≥50 万</span>
                                    <span>12%</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <span className="font-bold text-blue-600">A</span>
                                    <span>核心伙伴</span>
                                    <span>≥20 万</span>
                                    <span>10%</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <span className="font-bold text-green-600">B</span>
                                    <span>普通伙伴</span>
                                    <span>≥5 万</span>
                                    <span>8%</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <span className="font-bold text-gray-500">C</span>
                                    <span>考察期</span>
                                    <span>&lt;5 万</span>
                                    <span>5%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </fieldset>

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
