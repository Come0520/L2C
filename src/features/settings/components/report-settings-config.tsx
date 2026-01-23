'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/shared/ui/form';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { getSettingsByCategory, batchUpdateSettings } from '../actions/system-settings-actions';

/**
 * 数据报表设置组件
 * 包含：更新频率、手动刷新
 */

interface ReportSettingsFormData {
    DASHBOARD_UPDATE_FREQUENCY: string;
    ENABLE_MANUAL_REFRESH: boolean;
}

const UPDATE_FREQUENCIES = [
    { value: 'REAL_TIME', label: '实时更新' },
    { value: 'HOURLY', label: '每小时更新' },
    { value: 'DAILY', label: '每日更新' },
    { value: 'WEEKLY', label: '每周更新' },
];

export function ReportSettingsConfig() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<ReportSettingsFormData>({
        defaultValues: {
            DASHBOARD_UPDATE_FREQUENCY: 'DAILY',
            ENABLE_MANUAL_REFRESH: true,
        },
    });

    useEffect(() => {
        async function loadSettings() {
            try {
                const settings = await getSettingsByCategory('REPORT');
                if (settings && Object.keys(settings).length > 0) {
                    form.reset(settings as unknown as ReportSettingsFormData);
                }
            } catch (error) {
                console.error('加载报表设置失败:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, [form]);

    const onSubmit = async (data: ReportSettingsFormData) => {
        try {
            setIsSaving(true);
            await batchUpdateSettings(data as unknown as Record<string, unknown>);
            toast.success('报表设置已保存');
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
                        <CardTitle className="text-base">仪表盘更新策略</CardTitle>
                        <CardDescription className="text-xs">配置数据报表更新频率</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="DASHBOARD_UPDATE_FREQUENCY"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm">更新频率</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-9 w-48">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {UPDATE_FREQUENCIES.map(freq => (
                                                <SelectItem key={freq.value} value={freq.value}>
                                                    {freq.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="text-xs">
                                        实时更新会增加服务器压力
                                    </FormDescription>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="ENABLE_MANUAL_REFRESH"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>支持手动刷新</FormLabel>
                                        <FormDescription className="text-xs">
                                            允许用户手动刷新获取最新数据
                                        </FormDescription>
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
