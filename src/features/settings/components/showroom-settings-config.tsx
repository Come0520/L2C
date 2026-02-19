'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/shared/ui/form';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { getSettingsByCategory, batchUpdateSettings } from '../actions/system-settings-actions';

interface ShowroomSettingsFormData {
    ENABLE_SHOWROOM_WRITE_FOR_ALL: boolean;
    [key: string]: unknown;
}

export function ShowroomSettingsConfig() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<ShowroomSettingsFormData>({
        defaultValues: {
            ENABLE_SHOWROOM_WRITE_FOR_ALL: true,
        },
    });

    useEffect(() => {
        async function loadSettings() {
            try {
                const settings = await getSettingsByCategory('SHOWROOM');
                if (settings && Object.keys(settings).length > 0) {
                    // 安全映射配置数据
                    const mappedData: ShowroomSettingsFormData = {
                        ENABLE_SHOWROOM_WRITE_FOR_ALL: settings.ENABLE_SHOWROOM_WRITE_FOR_ALL as boolean ?? true,
                    };
                    form.reset(mappedData);
                }
            } catch (error) {
                console.error('加载云展厅设置失败:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, [form]);

    const onSubmit = async (data: ShowroomSettingsFormData) => {
        try {
            setIsSaving(true);
            // 直接传递数据，ShowroomSettingsFormData 与 Record<string, unknown> 兼容
            await batchUpdateSettings(data as Record<string, unknown>);
            toast.success('云展厅设置已保存');
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
                        <CardTitle className="text-base">内容生产权限</CardTitle>
                        <CardDescription className="text-xs">控制谁可以创建新的展厅素材</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="ENABLE_SHOWROOM_WRITE_FOR_ALL"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>全员可创建</FormLabel>
                                        <FormDescription className="text-xs">
                                            开启后，所有员工均可发布新素材（适合全员营销模式）；<br />
                                            关闭后，仅管理员和拥有产品管理权限的用户可发布。
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
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        保存设置
                    </Button>
                </div>
            </form>
        </Form>
    );
}
